"""
Time-temperature superposition shift-factor models: WLF, Arrhenius, the
piecewise hybrid of the two, and the analytic inverse WLF.

Forward evaluation only — given coefficients, produce a_T(T). `calibration`
fits those coefficients to measured shift data; `tts` applies the result to a
data frame.

Every function here is one division away from a pole, so they all run inside
`_fp_safe`, which turns numpy's overflow/divide/invalid into a ValueError the
route can hand to the user as HTTP 400.
"""

from contextlib import contextmanager

import numpy as np


float_correction = 1e-7
R = 8.31446261815324  # J/(mol*K)

# Williams-Landel-Ferry's "universal" empirical constants — reasonable defaults
# across many polymers when the user hasn't supplied material-specific values.
# Used (a) by the frequency-domain visualization to scatter the master curve
# across a temperature axis, and (b) by the route as the fallback when the
# C1/C2 "estimate" toggles are on.
UNIVERSAL_WLF_C1 = 17.44
UNIVERSAL_WLF_C2 = 51.6


@contextmanager
def _fp_safe(user_message: str):
    """Convert numpy FP overflow/divide/invalid into a user-facing ValueError.

    The shift-factor functions all need the same protective shell around their
    arithmetic: switch numpy to raise on overflow/divide/invalid, catch those
    (and any FloatingPointError the body raises explicitly for a non-finite
    result), and re-raise as ValueError(user_message) so the route can convert
    it to HTTP 400 with text the end user can act on.
    """
    with np.errstate(divide='raise', invalid='raise', over='raise'):
        try:
            yield
        except (FloatingPointError, ZeroDivisionError):
            raise ValueError(user_message)


# OLD Method
# def wlf_shift(T, T_ref, C1, C2):
#     """Calculate shift factor a_T using the WLF equation."""
#     print(f"T: {T}")
#     print(f"T_ref: {T_ref}")
#     print(f'C1: {C1}')
#     print(f'C2: {C2}')
#     return 10 ** (-C1 * (T - T_ref) / (C2 + (T - T_ref)))

def wlf_log10_shift(T: np.ndarray, T_ref: float, C1: float, C2: float,
                    a_T_ref: float = 1.0) -> np.ndarray:
    """
    Return log10(a_T) = -C1 * (T - T_ref) / (C2 + (T - T_ref)) directly,
    plus log10(a_T_ref).

    Computing in log10 space avoids the 10**exponent overflow that occurs for
    cold data (T well below T_ref) when the exponent is large but finite.
    No finiteness guard is applied here; wlf_shift wraps this function and
    raises ValueError via _fp_safe if the result is non-finite.

    Parameters:
        T (numpy.ndarray): 1-D array of temperatures in °C.
        T_ref (float): Reference temperature in °C.
        C1 (float): WLF parameter C1.
        C2 (float): WLF parameter C2.
        a_T_ref (float): Shift factor at T_ref, i.e. a vertical offset on the
            whole curve. The bare WLF equation is 1 at T_ref; measured shift
            factors need not be referenced there (see fit_wlf_coefficients,
            which co-fits this). Defaults to 1.0, which adds exactly zero.

    Returns:
        numpy.ndarray: 1-D array of log10(a_T) values, same length as T.
    """
    return -C1 * (T - T_ref) / (C2 + (T - T_ref)) + np.log10(a_T_ref)


def wlf_shift(T, T_ref: float, C1: float, C2: float,
              a_T_ref: float = 1.0) -> np.ndarray:
    """
    Calculate the WLF shift factor a_T.

    Implements the Williams-Landel-Ferry equation:
        log10(a_T) = -C1 * (T - T_ref) / (C2 + (T - T_ref))

    Delegates to wlf_log10_shift for the analytic log10, then exponentiates.
    The single-source-of-truth formula lives in wlf_log10_shift; this function
    adds the _fp_safe shell and the finiteness check.

    Parameters:
        T: Temperatures at which to evaluate a_T. Scalars and 0-D arrays are
            promoted to a length-1 1-D array; 1-D arrays pass through.
        T_ref (float): Reference temperature.
        C1 (float): WLF parameter C1.
        C2 (float): WLF parameter C2.
        a_T_ref (float): Shift factor at T_ref; scales every returned value
            (the hybrid_shift argument of the same name does the same job).

    Returns:
        numpy.ndarray: 1-D array of shift factors a_T, same length as T, where
            a_T at T_ref is a_T_ref.

    Raises:
        ValueError: If the WLF denominator C2 + (T - T_ref) reaches zero or the
            result is non-finite (overflow or invalid arithmetic).
    """
    T = np.atleast_1d(T)
    assert T.ndim == 1, "T must be a 1-D numpy.ndarray or scalar"

    with _fp_safe(
        "divide by zero detected when calculating WLF. "
        "Please adjust parameters or manually provide shift factors."
    ):
        a_T = np.power(10.0, wlf_log10_shift(T, T_ref, C1, C2, a_T_ref))
        if not np.all(np.isfinite(a_T)):
            raise FloatingPointError("Non-finite result in WLF computation")
        return a_T


def _arr_shift(T: np.ndarray, T_ref: float, Ea: float) -> np.ndarray:
    """
    Calculate the Arrhenius shift factor a_T.

    Implements the Arrhenius equation:
        ln(a_T) = (Ea_J_per_mol / R) * (1/T_K - 1/T_ref_K)

    where T_K and T_ref_K are absolute temperatures in Kelvin (T + 273.15) and
    Ea_J_per_mol = 1000 * Ea.

    Parameters:
        T (numpy.ndarray): 1-D array of temperatures in °C.
        T_ref (float): Reference temperature in °C.
        Ea (float): Activation energy in kJ/mol.

    Returns:
        numpy.ndarray: 1-D array of shift factors a_T, same length as T.

    Raises:
        ValueError: If an absolute-zero singularity is reached or the result
            is non-finite (overflow or invalid arithmetic).
    """
    T_ref_K = T_ref + 273.15
    T_K = T + 273.15
    m = (Ea * 1000.0) /  R
    with _fp_safe(
        "absolute-zero singularity detected when calculating Arrhenius shift. "
        "Please adjust parameters or manually provide shift factors."
    ):
        a_T = np.exp(m * (1.0 / T_K - 1.0 / T_ref_K))
        if not np.all(np.isfinite(a_T)):
            raise FloatingPointError("Non-finite result in Arrhenius computation")
        return a_T


def hybrid_shift(
        T,
        T_ref: float,
        C1: float,
        C2: float,
        Ea: float,
        a_T_ref: float=1.0,
        ascending: bool=None,
) -> np.ndarray:
    """
    Calculate hybrid Arrhenius/WLF shift factors at T_ref.

    Applies the WLF equation to temperatures above T_ref and the Arrhenius
    equation to temperatures at or below T_ref. With two or more elements, T
    must be monotonically sorted (ascending or descending); the direction is
    detected from the signs of consecutive differences so the assembled output
    preserves the input order. Ties are tolerated — real ramps carry repeated
    temperature rows and the piecewise split (a searchsorted) is untroubled by
    duplicates, which simply get identical shift factors. An all-constant T is
    treated as ascending; the direction is irrelevant since reversal is a
    no-op there.

    Parameters:
        T: Temperatures in °C. Scalars and 0-D arrays are promoted to a
            length-1 1-D array; 1-D arrays of length >= 2 must be monotonically
            sorted (ties allowed).
        T_ref (float): Reference temperature in °C; WLF/Arrhenius boundary.
        C1 (float): WLF parameter C1.
        C2 (float): WLF parameter C2.
        Ea (float): Arrhenius activation energy in kJ/mol.
        a_T_ref (float): convenience argument to scale returned shift factors.
        ascending (bool): Flag to skip descending handling if pre-calculated elsewhere

    Returns:
        numpy.ndarray: 1-D array of shift factors a_T, same length as T, where
            np.interp(T_ref,T,a_T) ~ a_T_ref

    Raises:
        ValueError: If the WLF or Arrhenius sub-calculation hits a singularity.
    """
    T = np.atleast_1d(T)
    if ascending is None:
        assert T.ndim == 1, "T must be a 1-D numpy.ndarray or scalar"
        assert np.all(np.isfinite(T)), "T must contain only finite values"
        diffs = np.diff(T)
        if len(diffs) > 0:
            # Non-strict: upload_init keeps duplicate-temperature rows, so a
            # sorted ramp can legally contain ties (an all-constant T lands in
            # the ascending branch, where the direction doesn't matter).
            ascending = bool(np.all(diffs >= 0))  # base case from loader utility
            assert ascending or np.all(diffs <= 0), "T must be monotonically sorted"
        else:
            ascending = True  # single element; direction irrelevant

    T = T if ascending else T[::-1]
    k = np.searchsorted(T, T_ref + float_correction, side='right')
    a_T_arr = _arr_shift(T[:k], T_ref, Ea)
    a_T_wlf = wlf_shift(T[k:], T_ref, C1, C2)
    result = np.concatenate((a_T_arr, a_T_wlf))
    result *= a_T_ref
    return result if ascending else result[::-1]


def inverse_wlf_shift(a_T, T_ref: float, C1: float, C2: float) -> np.ndarray:
    """
    Calculate the temperature T corresponding to a WLF shift factor a_T.

    Inverts the Williams-Landel-Ferry equation
        log10(a_T) = -C1 * (T - T_ref) / (C2 + (T - T_ref))
    to give
        T = T_ref - C2 * log10(a_T) / (C1 + log10(a_T)).

    Parameters:
        a_T: Shift factor(s). Scalars and 0-D arrays are promoted to a length-1
            1-D array; 1-D arrays pass through.
        T_ref (float): Reference temperature.
        C1 (float): WLF parameter C1.
        C2 (float): WLF parameter C2.

    Returns:
        numpy.ndarray: 1-D array of temperatures, same length as a_T.

    Raises:
        ValueError: If a_T <= 0 (log10 undefined), C1 + log10(a_T) = 0
            (singularity), or the result is non-finite.
    """
    a_T = np.atleast_1d(a_T)
    assert a_T.ndim == 1, "a_T must be a 1-D numpy.ndarray or scalar"

    with _fp_safe(
        "invalid shift factor when inverting WLF "
        "(a_T must be positive and log10(a_T) != -C1). Please adjust parameters."
    ):
        log_a_T = np.log10(a_T)
        T = (log_a_T * (T_ref - C2) + C1 * T_ref) / (log_a_T + C1)
        if not np.all(np.isfinite(T)):
            raise FloatingPointError("Non-finite result in inverse WLF computation")
        return T


def _inverse_arr_shift(a_T: np.ndarray, T_ref: float, Ea: float) -> np.ndarray:
    """
    Calculate the temperature T corresponding to an Arrhenius shift factor a_T.

    Inverts _arr_shift's
        ln(a_T) = (Ea_J_per_mol / R) * (1/T_K - 1/T_ref_K)
    to give
        T_K = 1 / (1/T_ref_K + ln(a_T) / m),   m = 1000 * Ea / R.

    Parameters:
        a_T (numpy.ndarray): 1-D array of positive shift factors.
        T_ref (float): Reference temperature in °C.
        Ea (float): Activation energy in kJ/mol.

    Returns:
        numpy.ndarray: 1-D array of temperatures in °C, same length as a_T.

    Raises:
        ValueError: If a_T <= 0 (log undefined), Ea == 0 (no temperature
            dependence to invert), or the required temperature falls at or
            below absolute zero (1/T_K crossing 0 shows up as a non-positive
            reciprocal). Unreachable from inverse_hybrid_shift's split for
            physical parameters — a_T >= 1 with Ea > 0 keeps 1/T_K above
            1/T_ref_K — but reachable with a hand-typed negative Ea.
    """
    T_ref_K = T_ref + 273.15
    m = (Ea * 1000.0) / R
    with _fp_safe(
        "invalid shift factor when inverting Arrhenius (a_T must be positive "
        "and the required temperature above absolute zero). Please adjust "
        "parameters."
    ):
        inv_T_K = 1.0 / T_ref_K + np.log(a_T) / m
        if np.any(inv_T_K <= 0):
            raise FloatingPointError(
                "Inverse Arrhenius temperature at or below absolute zero")
        T = 1.0 / inv_T_K - 273.15
        if not np.all(np.isfinite(T)):
            raise FloatingPointError(
                "Non-finite result in inverse Arrhenius computation")
        return T


def inverse_hybrid_shift(
        a_T,
        T_ref: float,
        C1: float,
        C2: float,
        Ea: float,
        a_T_ref: float = 1.0,
) -> np.ndarray:
    """
    Calculate the temperature T corresponding to a hybrid shift factor a_T.

    Inverse of hybrid_shift: shift factors at or above a_T_ref (the hybrid's
    value at T_ref) invert through Arrhenius — the forward's T <= T_ref
    branch — and the rest through WLF (T > T_ref). For physical parameters
    (Ea > 0, C1 > 0, C2 > 0) both branches are monotone decreasing in T and
    meet continuously at (T_ref, a_T_ref), so the split threshold is exact;
    the boundary value itself maps to T_ref through either branch.

    Unlike hybrid_shift (whose piecewise assembly needs a sorted T), the
    branch test here is elementwise, so a_T may arrive in any order and the
    output preserves it.

    Parameters:
        a_T: Shift factor(s). Scalars and 0-D arrays are promoted to a
            length-1 1-D array; 1-D arrays pass through.
        T_ref (float): Reference temperature in °C; WLF/Arrhenius boundary.
        C1 (float): WLF parameter C1.
        C2 (float): WLF parameter C2.
        Ea (float): Arrhenius activation energy in kJ/mol.
        a_T_ref (float): The data's shift factor at T_ref (the same vertical
            offset hybrid_shift applies); incoming a_T are divided by it
            before the branch test.

    Returns:
        numpy.ndarray: 1-D array of temperatures in °C, same length as a_T.

    Raises:
        ValueError: If a_T is non-positive or non-finite; if a WLF-side value
            lies at or beyond the model's 10**-C1 horizon (WLF only reaches
            that value as T → ∞, and past it inverse_wlf_shift's formula
            returns a finite temperature on the wrong branch of its
            hyperbola); or if the branch results contradict the split —
            possible only for unphysical parameter signs, which break the
            monotonicity the threshold relies on.
    """
    a_T = np.atleast_1d(np.asarray(a_T, dtype=float))
    assert a_T.ndim == 1, "a_T must be a 1-D numpy.ndarray or scalar"
    if not np.all(np.isfinite(a_T)) or np.any(a_T <= 0):
        raise ValueError(
            "invalid shift factor when inverting the hybrid model "
            "(a_T must be positive and finite). Please adjust parameters."
        )
    scaled = a_T / a_T_ref
    cold = scaled >= 1.0  # Arrhenius side: T <= T_ref
    T = np.empty_like(scaled)
    if np.any(cold):
        T[cold] = _inverse_arr_shift(scaled[cold], T_ref, Ea)
    if np.any(~cold):
        wlf_side = scaled[~cold]
        if np.any(np.log10(wlf_side) <= -C1):
            raise ValueError(
                "shift factor beyond the WLF horizon when inverting the "
                f"hybrid model: log10(a_T) reaches -C1 = {-C1:g} only as the "
                "temperature goes to infinity. Please adjust parameters or "
                "manually provide shift factors."
            )
        T[~cold] = inverse_wlf_shift(wlf_side, T_ref, C1, C2)
    # float_correction gives the boundary the same numerical slack as the
    # forward searchsorted split.
    if (np.any(T[cold] > T_ref + float_correction)
            or np.any(T[~cold] < T_ref - float_correction)):
        raise ValueError(
            "the hybrid model is not monotonic with these parameters "
            "(inversion needs Ea > 0, C1 > 0, and C2 > 0). Please adjust "
            "parameters or manually provide shift factors."
        )
    return T
