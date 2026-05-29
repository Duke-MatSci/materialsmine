import os
os.environ['OPENBLAS_NUM_THREADS'] = '1'
import numpy as np
import pandas as pd

from contextlib import contextmanager
from scipy.optimize import curve_fit, minimize
from scipy.signal import find_peaks
import plotly.express as px
import plotly.graph_objects as go

from app.utils.util import log_errors

float_correction = 1e-7
R = 8.31446261815324  # J/(mol*K)

# Williams-Landel-Ferry's "universal" empirical constants — reasonable defaults
# across many polymers when the user hasn't supplied material-specific values.
# Used (a) by the frequency-domain visualization to scatter the master curve
# across a temperature axis, and (b) by the route as the fallback when the
# C1/C2 "estimate" toggles are on.
UNIVERSAL_WLF_C1 = 17.44
UNIVERSAL_WLF_C2 = 51.6

# Reference frequency / temperature for the frequency-domain visualization's
# inverse-WLF scatter; arbitrary but stable so the temperature axis stays
# comparable across uploads.
VIS_REF_FREQUENCY_HZ = 1.0
VIS_REF_TEMPERATURE_C = 30.0


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


def prony_basis(freq: np.ndarray, relaxations: np.ndarray, solid: bool) -> np.ndarray:
    """
    Construct the Prony-series basis matrix for storage and loss moduli.

    For each (ω, τ) pair the storage-modulus contribution is ω²τ² / (1 + ω²τ²)
    and the loss-modulus contribution is ωτ / (1 + ω²τ²). The two blocks are
    stacked vertically so that prony_basis(...) @ E_i yields a flat
    [E_storage; E_loss] vector. When solid is True, a leading column is
    prepended to represent an equilibrium modulus: ones on the storage block,
    zeros on the loss block.

    Parameters:
        freq (numpy.ndarray): 1-D array of angular frequencies ω.
        relaxations (numpy.ndarray): 1-D array of relaxation times τ.
        solid (bool): Whether to prepend an equilibrium-modulus column.

    Returns:
        numpy.ndarray: Basis matrix of shape (2 * len(freq), len(relaxations) + bool(solid)).
    """
    assert isinstance(freq, np.ndarray) and freq.ndim == 1, \
        "freq must be a 1-D numpy.ndarray"
    assert isinstance(relaxations, np.ndarray) and relaxations.ndim == 1, \
        "relaxations must be a 1-D numpy.ndarray"

    # dimensionless time ωτ
    dt = np.outer(freq, relaxations)

    dt2 = dt * dt
    dt2p1 = dt2 + 1
    ep_basis = dt2 / dt2p1
    epp_basis = dt / dt2p1

    if solid:
        ep_basis = np.concatenate(
            (np.ones_like(ep_basis, shape=(len(ep_basis), 1)), ep_basis), axis=1
        )
        epp_basis = np.concatenate(
            (np.zeros_like(epp_basis, shape=(len(epp_basis), 1)), epp_basis), axis=1
        )

    return np.concatenate((ep_basis, epp_basis), axis=0)


def prony_relaxation_space(tau_min: float, tau_max: float, N: int) -> np.ndarray:
    """
    Build a log-spaced grid of relaxation times.

    Parameters:
        tau_min (float): Lower bound of the relaxation-time range.
        tau_max (float): Upper bound of the relaxation-time range.
        N (int): Number of grid points.

    Returns:
        numpy.ndarray: 1-D array of N log-spaced values from tau_min to tau_max (inclusive).
    """
    return np.logspace(np.log10(tau_min), np.log10(tau_max), N, endpoint=True)


def compute_complex(tau_i: np.ndarray, E_i: np.ndarray,
                    num_pts: int = 1000) -> pd.DataFrame:
    """
    Compute the complex modulus on a log-spaced frequency grid.

    Builds an angular-frequency grid spanning 1/max(tau_i) to 1/min(tau_i) and
    evaluates the storage and loss moduli from the Prony coefficients in E_i.
    When E_i has one more element than tau_i, the leading coefficient is
    treated as an equilibrium-modulus term.

    Parameters:
        tau_i (numpy.ndarray): 1-D array of relaxation times.
        E_i (numpy.ndarray): 1-D array of Prony coefficients (same length as
            tau_i, or one longer to include an equilibrium-modulus term).
        num_pts (int): Number of points in the output frequency grid.

    Returns:
        pandas.DataFrame: Frame with num_pts rows and columns
        "Frequency", "E Storage", "E Loss".
    """
    assert isinstance(tau_i, np.ndarray) and tau_i.ndim == 1, \
        "tau_i must be a 1-D numpy.ndarray"
    assert isinstance(E_i, np.ndarray) and E_i.ndim == 1, \
        "E_i must be a 1-D numpy.ndarray"
    omega = np.logspace(-np.log10(np.max(tau_i)), -np.log10(np.min(tau_i)), num_pts)
    basis = prony_basis(omega, tau_i, solid=not (len(E_i) == len(tau_i)))
    complex = basis @ E_i
    real, imag = complex.reshape(2, num_pts)

    return pd.DataFrame(data={"Frequency": omega, "E Storage": real, "E Loss": imag})


def compute_relaxation_modulus(tau_i: np.ndarray, E_i: np.ndarray,
                               num_pts: int = 1000) -> pd.DataFrame:
    """
    Compute the time-domain relaxation modulus on a log-spaced time grid.

    Builds a time grid spanning min(tau_i) to max(tau_i) and evaluates the
    decaying part of the Prony relaxation modulus from the coefficients in
    E_i. When E_i has one more element than tau_i, the leading
    equilibrium-modulus coefficient is excluded from the output.

    Parameters:
        tau_i (numpy.ndarray): 1-D array of relaxation times.
        E_i (numpy.ndarray): 1-D array of Prony coefficients (same length as
            tau_i, or one longer to include an equilibrium-modulus term).
        num_pts (int): Number of points in the output time grid.

    Returns:
        pandas.DataFrame: Frame with num_pts rows and columns "Time", "E".
    """
    assert isinstance(tau_i, np.ndarray) and tau_i.ndim == 1, \
        "tau_i must be a 1-D numpy.ndarray"
    assert isinstance(E_i, np.ndarray) and E_i.ndim == 1, \
        "E_i must be a 1-D numpy.ndarray"
    t = np.logspace(np.log10(np.min(tau_i)), np.log10(np.max(tau_i)), num_pts)
    # dimensionless time t/τ
    dt = np.outer(t, 1 / tau_i)
    solid = not (len(E_i) == len(tau_i))
    E = np.exp(-dt) @ E_i[solid:]
    return pd.DataFrame(data={"Time": t, "E": E})


def compute_relaxation_spectrum(tau_i: np.ndarray, E_i: np.ndarray,
                                num_pts: int = 1000) -> pd.DataFrame:
    """
    Compute the relaxation spectrum on a log-spaced time grid.

    Builds a time grid spanning min(tau_i) to max(tau_i) and evaluates the
    relaxation spectrum H from the Prony coefficients in E_i. When E_i has
    one more element than tau_i, the leading equilibrium-modulus coefficient
    is excluded from the output.

    Parameters:
        tau_i (numpy.ndarray): 1-D array of relaxation times.
        E_i (numpy.ndarray): 1-D array of Prony coefficients (same length as
            tau_i, or one longer to include an equilibrium-modulus term).
        num_pts (int): Number of points in the output time grid.

    Returns:
        pandas.DataFrame: Frame with num_pts rows and columns "Time", "H".
    """
    assert isinstance(tau_i, np.ndarray) and tau_i.ndim == 1, \
        "tau_i must be a 1-D numpy.ndarray"
    assert isinstance(E_i, np.ndarray) and E_i.ndim == 1, \
        "E_i must be a 1-D numpy.ndarray"
    t = np.logspace(np.log10(np.min(tau_i)), np.log10(np.max(tau_i)), num_pts)
    # dimensionless time t/τ
    dt = np.outer(t, 1 / tau_i)
    solid = not (len(E_i) == len(tau_i))
    H = (dt * np.exp(-dt)) @ E_i[solid:]
    return pd.DataFrame(data={"Time": t, "H": H})


def _prony_objective(
        logcoefs: np.ndarray,
        data: np.ndarray,
        std: np.ndarray,
        basis: np.ndarray,
        smoothness: float,
        solid: bool,
) -> tuple:
    """
    Compute the loss and gradient for the smoothed Prony fit.

    Designed to be passed to scipy.optimize.minimize with jac=True. Coefficients
    are parameterized in log-space (E_i = exp(logcoefs)) so that the optimizer
    sees an unconstrained problem while the physical coefficients remain
    positive. The loss is the weighted sum of squared residuals between
    basis @ exp(logcoefs) and data, plus an optional second-difference penalty
    on logcoefs[solid:] scaled by smoothness.

    Parameters:
        logcoefs (numpy.ndarray): 1-D array of log-coefficients to fit.
        data (numpy.ndarray): 1-D array of target values.
        std (numpy.ndarray): 1-D array of per-point standard deviations for weighting.
        basis (numpy.ndarray): 2-D basis matrix; basis @ exp(logcoefs) is the model.
        smoothness (float): Strength of the second-difference penalty on
            logcoefs[solid:]. Pass 0 to disable.
        solid (bool): Whether the leading coefficient is an equilibrium term to
            exclude from the smoothness penalty.

    Returns:
        tuple: (loss, gradient) where loss is a float and gradient is a 1-D
        ndarray with the same shape as logcoefs.
    """
    coefs = np.exp(logcoefs)
    estimate = basis @ coefs
    resid = (data - estimate) / std
    loss = resid @ resid
    if smoothness:
        curve = smoothness * np.diff(logcoefs[solid:], n=2)
        loss += curve @ curve

    grad = -(basis.T @ (resid / std))

    # apply chain rule because these are functions of
    # coefs rather than logcoefs
    grad *= coefs

    if smoothness:
        diffs = smoothness * curve  # smoothness*np.diff(logcoefs[solid:], n=2)
        grad_slice = grad[solid:]
        grad_slice[:-2] += diffs
        grad_slice[1:-1] -= 2 * diffs
        grad_slice[2:] += diffs

    return loss, 2 * grad  # more chain rule (squared errors)


def smooth_prony_fit(
        omega: np.ndarray,
        E_stor: np.ndarray,
        E_loss: np.ndarray,
        E_stor_std: np.ndarray,
        E_loss_std: np.ndarray,
        N: int,
        smoothness: float,
        solid: bool = True,
) -> tuple:
    """
    Fit a Prony series to complex-modulus data with coefficient smoothing.

    Builds a log-spaced relaxation-time grid spanning 1/max(omega) to
    1/min(omega), constructs the Prony basis at those (omega, tau) pairs, and
    solves for positive Prony coefficients by minimizing weighted squared
    residuals plus an optional second-difference smoothness penalty on the
    log-coefficients (see _prony_objective). Coefficients are parameterized in
    log-space so the optimizer sees an unconstrained problem.

    Parameters:
        omega (numpy.ndarray): 1-D array of angular frequencies.
        E_stor (numpy.ndarray): 1-D array of storage-modulus values, same
            length as omega.
        E_loss (numpy.ndarray): 1-D array of loss-modulus values, same length
            as omega.
        E_stor_std (numpy.ndarray): 1-D array of per-point standard deviations
            for E_stor, same length as omega. Used to weight residuals.
        E_loss_std (numpy.ndarray): 1-D array of per-point standard deviations
            for E_loss, same length as omega. Used to weight residuals.
        N (int): Number of relaxation times in the fit grid.
        smoothness (float): Strength of the second-difference penalty on the
            log-coefficients. Pass 0 to disable.
        solid (bool): Whether to include an equilibrium-modulus term.

    Returns:
        tuple: (tau_i, E_i) where tau_i is the 1-D relaxation-time grid of
        length N and E_i is the 1-D coefficient array of length N + bool(solid).
    """
    assert isinstance(omega, np.ndarray) and omega.ndim == 1, \
        "omega must be a 1-D numpy.ndarray"
    assert isinstance(E_stor, np.ndarray) and E_stor.ndim == 1, \
        "E_stor must be a 1-D numpy.ndarray"
    assert isinstance(E_loss, np.ndarray) and E_loss.ndim == 1, \
        "E_loss must be a 1-D numpy.ndarray"
    assert len(omega) == len(E_stor) == len(E_loss), \
        "omega, E_stor, E_loss must all have the same length"
    assert isinstance(E_stor_std, np.ndarray) and E_stor_std.shape == E_stor.shape, \
        "E_stor_std must be a 1-D numpy.ndarray matching E_stor"
    assert isinstance(E_loss_std, np.ndarray) and E_loss_std.shape == E_loss.shape, \
        "E_loss_std must be a 1-D numpy.ndarray matching E_loss"

    tau_max = 1 / np.min(omega)
    tau_min = 1 / np.max(omega)
    tau_i = prony_relaxation_space(tau_min, tau_max, N)

    basis = prony_basis(omega, tau_i, solid)

    y = np.concatenate((E_stor, E_loss))
    y_std = np.concatenate((E_stor_std, E_loss_std))

    # Data-scaled initial guess: spread max(E_stor) evenly across N+solid terms
    # so the initial model prediction matches the data magnitude. A constant
    # like x0=7.0 (E_i ≈ 1097) is many orders of magnitude off when E_stor is
    # large, and then returned coefficients become inf.
    x0 = np.full(N + solid, np.log(E_stor.max() / (N + solid)))
    with np.errstate(over='ignore', invalid='ignore'):
        result = minimize(
            fun=_prony_objective,
            x0=x0,
            args=(y, y_std, basis, smoothness, solid),
            jac=True,
        )
    E_i = np.exp(result.x)

    return tau_i, E_i


# OLD Method
# def wlf_shift(T, T_ref, C1, C2):
#     """Calculate shift factor a_T using the WLF equation."""
#     print(f"T: {T}")
#     print(f"T_ref: {T_ref}")
#     print(f'C1: {C1}')
#     print(f'C2: {C2}')
#     return 10 ** (-C1 * (T - T_ref) / (C2 + (T - T_ref)))

def wlf_log10_shift(T: np.ndarray, T_ref: float, C1: float, C2: float) -> np.ndarray:
    """
    Return log10(a_T) = -C1 * (T - T_ref) / (C2 + (T - T_ref)) directly.

    Computing in log10 space avoids the 10**exponent overflow that occurs for
    cold data (T well below T_ref) when the exponent is large but finite.
    No finiteness guard is applied here; wlf_shift wraps this function and
    raises ValueError via _fp_safe if the result is non-finite.

    Parameters:
        T (numpy.ndarray): 1-D array of temperatures in °C.
        T_ref (float): Reference temperature in °C.
        C1 (float): WLF parameter C1.
        C2 (float): WLF parameter C2.

    Returns:
        numpy.ndarray: 1-D array of log10(a_T) values, same length as T.
    """
    return -C1 * (T - T_ref) / (C2 + (T - T_ref))


def wlf_shift(T, T_ref: float, C1: float, C2: float) -> np.ndarray:
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

    Returns:
        numpy.ndarray: 1-D array of shift factors a_T, same length as T.

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
        a_T = np.power(10.0, wlf_log10_shift(T, T_ref, C1, C2))
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
    preserves the input order.

    Parameters:
        T: Temperatures in °C. Scalars and 0-D arrays are promoted to a
            length-1 1-D array; 1-D arrays of length >= 2 must be monotonically
            sorted.
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
            ascending = bool(np.all(diffs > 0))  # base case from loader utility
            assert ascending or np.all(diffs < 0), "T must be monotonically sorted"
        else:
            ascending = True  # single element; direction irrelevant

    T = T if ascending else T[::-1]
    k = np.searchsorted(T, T_ref + float_correction, side='right')
    a_T_arr = _arr_shift(T[:k], T_ref, Ea)
    a_T_wlf = wlf_shift(T[k:], T_ref, C1, C2)
    result = np.concatenate((a_T_arr, a_T_wlf))
    result *= a_T_ref
    return result if ascending else result[::-1]


def _curve_fit_shift(model, T: np.ndarray, log10_a_T: np.ndarray,
                     p0: list, bounds=(-np.inf, np.inf),
                     log10_space: bool = False) -> np.ndarray:
    """
    Fit shift-model parameters to log10(a_T) data via curve_fit.

    By default wraps model (which returns linear-scale a_T) in a log10
    transform so the optimizer sees uniform weighting across many orders of
    magnitude. When log10_space=True the model already returns log10(a_T)
    directly (avoiding intermediate exponentiation and potential overflow).
    Only free parameters are passed; fixed parameters must already be closed
    over in the model callable.

    Parameters:
        model: Callable with signature model(T, *free_params) -> np.ndarray.
            Returns linear-scale a_T when log10_space=False, or log10(a_T)
            when log10_space=True. Fixed parameters must be captured in the
            closure.
        T (numpy.ndarray): 1-D array of temperatures in °C.
        log10_a_T (numpy.ndarray): 1-D array of log10(a_T) target values,
            same length as T.
        p0 (list): Initial guesses for the free parameters.
        bounds: Bounds for the free parameters forwarded to curve_fit
            (same format as scipy's bounds argument). Defaults to no bounds.
        log10_space (bool): If True, model already returns log10(a_T) and no
            np.log10 wrapping is applied. Defaults to False.

    Returns:
        numpy.ndarray: Fitted values for the free parameters, same length as p0.

    Raises:
        ValueError: If curve_fit fails to converge.
    """
    # TODO(scipy>=1.11): fixed parameters are currently held constant by
    # closure reparametrization (excluded from the fit vector and captured in
    # `model`) because scipy 1.10.1 rejects equal bounds with "Each lower bound
    # must be strictly less than each upper bound". Once the services env is
    # bumped to scipy >= 1.11, this can be revised to pass ALL parameters to
    # curve_fit with bounds, fixing a parameter via lb == ub. That would let the
    # callers (fit_wlf_coefficients / fit_hybrid_coefficients) drop their
    # per-parameter free/fixed branching in favor of one bounds vector.
    if log10_space:
        fit_model = model
    else:
        def fit_model(T_arg, *params):
            return np.log10(model(T_arg, *params))

    try:
        popt, _ = curve_fit(fit_model, T, log10_a_T, p0=p0, bounds=bounds)
    except RuntimeError as exc:
        raise ValueError(
            f"Shift-factor curve fit did not converge: {exc}. "
            "Try supplying better initial guesses or checking the input data."
        ) from exc
    return popt


def fit_wlf_coefficients(
        T: np.ndarray,
        a_T: np.ndarray,
        T_ref: float,
        C1: float = None,
        C2: float = None,
        fix_C1: bool = False,
        fix_C2: bool = False,
) -> tuple:
    """
    Fit WLF shift-model coefficients (C1, C2) to shift-domain data.

    Uses scipy.optimize.curve_fit in log10(a_T) space so that points spanning
    many decades of shift factor receive uniform weight. T_ref is required and
    is never optimized — it is a physical input (e.g. Tg) supplied by the
    caller.

    Individual parameters can be fixed at their supplied values by setting the
    corresponding fix_* flag. A supplied-but-not-fixed value becomes the
    initial guess; otherwise the WLF universal constants are used. Fixed
    parameters are held constant by closing them over inside the model rather
    than passing them to curve_fit.

    When C2 is free, a lower bound c2_min = (T_ref - min(T)) + 1.0 is enforced
    to keep the WLF denominator positive (1 °C margin). The fit uses
    wlf_log10_shift directly (log10_space=True) to avoid the 10**exponent
    overflow that otherwise occurs for cold data (T well below T_ref).

    Parameters:
        T (numpy.ndarray): 1-D array of temperatures in °C, same length as a_T.
        a_T (numpy.ndarray): 1-D array of positive shift factors (linear scale).
        T_ref (float): Reference temperature in °C; passed through to wlf_shift
            and never optimized.
        C1 (float): Initial guess for WLF C1. Defaults to UNIVERSAL_WLF_C1 if
            None.
        C2 (float): Initial guess for WLF C2. Defaults to UNIVERSAL_WLF_C2 if
            None.
        fix_C1 (bool): If True, hold C1 constant at its supplied value.
        fix_C2 (bool): If True, hold C2 constant at its supplied value.

    Returns:
        tuple: (C1_fit, C2_fit) — fitted (or fixed) WLF coefficients.

    Raises:
        ValueError: If any a_T value is non-positive (log10 undefined), or if
            curve_fit does not converge.
    """
    T = np.atleast_1d(T)
    a_T = np.atleast_1d(a_T)
    assert T.ndim == 1 and a_T.ndim == 1, \
        "T and a_T must be 1-D numpy.ndarray or scalar"
    assert len(T) == len(a_T), \
        f"T and a_T must have the same length; got {len(T)} and {len(a_T)}"
    if not np.all(a_T > 0):
        raise ValueError(
            "All shift factors a_T must be positive (log10 is undefined for "
            "non-positive values). Check the input shift-factor data."
        )

    C1_0 = C1 if C1 is not None else UNIVERSAL_WLF_C1
    C2_0 = C2 if C2 is not None else UNIVERSAL_WLF_C2

    # Lower bound for a free C2: keeps denominator C2 + (T - T_ref) >= 1 for
    # all T in the dataset, preventing a WLF pole and keeping the analytic
    # log10 finite for any finite C1.
    c2_min = (T_ref - float(np.min(T))) + 1.0

    # Build a model over only the free parameters; fixed ones are closed over.
    # This avoids passing degenerate lb==ub bounds to curve_fit, which some
    # scipy versions reject.
    if fix_C1 and fix_C2:
        return float(C1_0), float(C2_0)
    elif fix_C1:
        # C2 free: use analytic log10 form and enforce c2_min bound.
        def model(T_arg, C2_p):
            return wlf_log10_shift(T_arg, T_ref, C1_0, C2_p)
        C2_start = max(C2_0, c2_min)
        (C2_fit,) = _curve_fit_shift(
            model, T, np.log10(a_T), p0=[C2_start],
            bounds=([c2_min], [np.inf]), log10_space=True,
        )
        return float(C1_0), float(C2_fit)
    elif fix_C2:
        # C1 free, C2 fixed: no overflow risk (denominator is fixed and positive
        # as long as the fixed C2 was chosen appropriately by the caller).
        def model(T_arg, C1_p):
            return wlf_shift(T_arg, T_ref, C1_p, C2_0)
        (C1_fit,) = _curve_fit_shift(model, T, np.log10(a_T), p0=[C1_0])
        return float(C1_fit), float(C2_0)
    else:
        # Both free: use analytic log10 form directly (avoids 10**exponent
        # overflow for cold data) and enforce c2_min on C2.
        def model(T_arg, C1_p, C2_p):
            return wlf_log10_shift(T_arg, T_ref, C1_p, C2_p)
        C2_start = max(C2_0, c2_min)
        C1_fit, C2_fit = _curve_fit_shift(
            model, T, np.log10(a_T), p0=[C1_0, C2_start],
            bounds=([-np.inf, c2_min], [np.inf, np.inf]), log10_space=True,
        )
        return float(C1_fit), float(C2_fit)


def fit_hybrid_coefficients(
        T: np.ndarray,
        a_T: np.ndarray,
        TL: float,
        C1: float = None,
        C2: float = None,
        Ea: float = None,
        fix_C1: bool = False,
        fix_C2: bool = False,
        fix_Ea: bool = False,
) -> tuple:
    """
    Fit hybrid Arrhenius/WLF shift-model coefficients (C1, C2, Ea) to
    shift-domain data.

    Uses scipy.optimize.curve_fit in log10(a_T) space so that points spanning
    many decades of shift factor receive uniform weight. TL is required and is
    never optimized — it is produced upstream by the E-loss-peak logic in the
    extract step and is a physical input, not a fit parameter.

    Individual parameters can be fixed at their supplied values by setting the
    corresponding fix_* flag. A supplied-but-not-fixed value becomes the
    initial guess; otherwise the WLF universal constants are used for C1/C2 and
    a moderate activation energy (100 kJ/mol) for Ea. Fixed parameters are held
    constant by closing them over inside the model rather than passing them to
    curve_fit.

    Parameters:
        T (numpy.ndarray): 1-D array of temperatures in °C, same length as a_T.
            Must be monotonically sorted (ascending or descending) as required by
            hybrid_shift.
        a_T (numpy.ndarray): 1-D array of positive shift factors (linear scale).
        TL (float): WLF/Arrhenius crossover temperature in °C; passed through
            to hybrid_shift and never optimized.
        C1 (float): Initial guess for WLF C1. Defaults to UNIVERSAL_WLF_C1 if
            None.
        C2 (float): Initial guess for WLF C2. Defaults to UNIVERSAL_WLF_C2 if
            None.
        Ea (float): Initial guess for Arrhenius activation energy in kJ/mol.
            Defaults to 100.0 if None.
        fix_C1 (bool): If True, hold C1 constant at its supplied value.
        fix_C2 (bool): If True, hold C2 constant at its supplied value.
        fix_Ea (bool): If True, hold Ea constant at its supplied value.

    Returns:
        tuple: (C1_fit, C2_fit, Ea_fit, a_T_ref) — fitted (or fixed) hybrid
            coefficients plus the co-fitted reference shift factor a_T_ref (the
            data's shift factor at TL; 1.0 when the data is referenced to TL).

    Raises:
        ValueError: If any a_T value is non-positive (log10 undefined), if TL
            falls outside the data range so a model segment is degenerate, or if
            curve_fit does not converge.
    """
    T = np.atleast_1d(T)
    a_T = np.atleast_1d(a_T)
    assert T.ndim == 1 and a_T.ndim == 1, \
        "T and a_T must be 1-D numpy.ndarray or scalar"
    assert len(T) == len(a_T), \
        f"T and a_T must have the same length; got {len(T)} and {len(a_T)}"
    if not np.all(a_T > 0):
        raise ValueError(
            "All shift factors a_T must be positive (log10 is undefined for "
            "non-positive values). Check the input shift-factor data."
        )
    assert np.all(np.isfinite(T)), "T must contain only finite values"

    _EA_DEFAULT = 100.0  # kJ/mol — broad mid-range starting point
    C1_0 = C1 if C1 is not None else UNIVERSAL_WLF_C1
    C2_0 = C2 if C2 is not None else UNIVERSAL_WLF_C2
    Ea_0 = Ea if Ea is not None else _EA_DEFAULT

    diffs = np.diff(T)
    if len(diffs) > 0:
        ascending = bool(np.all(diffs > 0))  # base case from loader utility
        assert ascending or np.all(diffs < 0), "T must be monotonically sorted"
    else:
        ascending = True  # single element; direction irrelevant

    if not fix_Ea and TL <= T[-(not ascending)]:
        raise ValueError("TL is below the range of the shift factor data, leading"
                         "to a degenerate Arrhenius segment of hybrid fit. Check data "
                         "or supply a different TL.")

    if not (fix_C1 or fix_C2) and TL >= T[-(ascending)]:
        raise ValueError("TL is above the range of the shift factor data, leading"
                         "to a degenerate WLF segment of hybrid fit. Check data or "
                         "supply a different TL.")

    # The shift factors may not be referenced to TL, but hybrid_shift is always 1
    # at TL. So a_T_ref (the data's shift factor at TL) is co-fitted as a vertical
    # offset rather than read off a single interpolated point: interpolating
    # across the WLF/Arrhenius kink at TL biases the estimate (and hence the whole
    # fit) even when the data is referenced exactly to TL. The interp value only
    # seeds the optimizer; np.interp needs ascending samples, so order them.
    log10_a_T = np.log10(a_T)
    T_asc = T if ascending else T[::-1]
    log10_asc = log10_a_T if ascending else log10_a_T[::-1]
    a_T_ref_0 = 10 ** float(np.interp(TL, T_asc, log10_asc))

    # Build a model over only the free parameters; fixed ones are closed over.
    # This avoids passing degenerate lb==ub bounds to curve_fit, which some
    # scipy versions reject. a_T_ref is always free (the co-fitted offset).
    free_names = [n for n, fixed in
                  [('C1', fix_C1), ('C2', fix_C2), ('Ea', fix_Ea), ('a_T_ref', False)]
                  if not fixed]
    p0 = [v for v, fixed in
          [(C1_0, fix_C1), (C2_0, fix_C2), (Ea_0, fix_Ea), (a_T_ref_0, False)]
          if not fixed]

    # C2 floored at 1.0 to stay off the WLF pole; a_T_ref floored just above 0 so
    # the log10 wrapper in _curve_fit_shift stays finite. Hybrid's WLF branch only
    # sees T > TL (not cold data), so the 10**exponent overflow that afflicts
    # fit_wlf_coefficients cannot occur here; log10_space=False is intentional.
    _floor = {'C2': 1.0, 'a_T_ref': np.finfo(float).tiny}
    lb = [_floor.get(n, -np.inf) for n in free_names]
    ub = [np.inf] * len(free_names)

    def model(T_arg, *free_vals):
        vals = dict(zip(free_names, free_vals))
        return hybrid_shift(
            T_arg, TL,
            vals.get('C1', C1_0),
            vals.get('C2', C2_0),
            vals.get('Ea', Ea_0),
            vals.get('a_T_ref', a_T_ref_0),
            ascending,
        )

    fitted = _curve_fit_shift(model, T, log10_a_T, p0=p0, bounds=(lb, ub))
    result = dict(zip(free_names, fitted))
    return (
        float(result.get('C1', C1_0)),
        float(result.get('C2', C2_0)),
        float(result.get('Ea', Ea_0)),
        float(result.get('a_T_ref', a_T_ref_0)),
    )


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


def tts_temperature_to_frequency_V2(temp_sweep_data, shift_model, *,
                                    Tg=None, TL=None, C1=None, C2=None, Ea=None,
                                    shiftData=None):
    """
    Convert temperature-sweep viscoelastic data to frequency-sweep data via TTS.

    Computes a shift factor a_T per row and returns a new DataFrame at the
    reference temperature with shifted frequencies (Frequency * a_T). Rows are
    sorted by Temperature ascending before the shift is applied.

    The reference temperature is selected from shift_model: 'WLF' uses Tg
    (glass transition); 'hybrid' uses TL (WLF/Arrhenius crossover).

    Parameters:
        temp_sweep_data (pd.DataFrame): Input data with columns
            ['Temperature', "E'", "E''"], optionally including 'Frequency'
            for the per-row measurement frequency. If 'Frequency' is absent,
            1.0 Hz is assumed (typical for a fixed-frequency DMA temperature sweep).
        shift_model (str): Which shift function to apply. 'WLF' uses
            wlf_shift across all temperatures; 'hybrid' uses hybrid_shift
            (Arrhenius at or below TL, WLF above); 'manual' requires
            shiftData and uses it directly.
        Tg (float): WLF reference temperature (used when shift_model == 'WLF').
        TL (float): Hybrid WLF/Arrhenius crossover temperature (used when
            shift_model == 'hybrid').
        C1 (float): WLF equation parameter C1.
        C2 (float): WLF equation parameter C2.
        Ea (float): Arrhenius activation energy in kJ/mol; used only when
            shift_model == 'hybrid'.
        shiftData: Optional precomputed shift factors. When falsy (None,
            empty, etc.), shift factors are computed from shift_model with
            the supplied parameters. When truthy, must be convertible to a
            DataFrame with an 'a_T' column whose values are used directly;
            the provided values must align with temp_sweep_data sorted by
            Temperature ascending.

    Returns:
        pd.DataFrame: Frequency-sweep data at T_ref with columns
        ['Frequency', 'Temperature', "E'", "E''"], sorted by Frequency with a
        fresh 0..N-1 index. Input temp_sweep_data is not mutated.

    Raises:
        ValueError: If shift_model is 'manual' without shiftData.
    """
    df = temp_sweep_data.sort_values('Temperature')
    T = df['Temperature'].to_numpy()

    if shiftData:
        a_T_df = pd.DataFrame(shiftData)
        assert 'a_T' in a_T_df.columns, \
            f"shiftData must have an 'a_T' column; got {list(a_T_df.columns)}. " \
            "shiftData should come from upload_init(..., 'shift') which guarantees this."
        a_T = a_T_df['a_T'].to_numpy()
        if len(a_T) != len(T):
            raise ValueError(
                f"Shift file has {len(a_T)} rows but data file has {len(T)} rows. "
                "Make sure both files have the same number of rows."
            )
    elif shift_model == 'WLF':
        a_T = wlf_shift(T, Tg, C1, C2)
    elif shift_model == 'hybrid':
        a_T = hybrid_shift(T, TL, C1, C2, Ea)
    elif shift_model == 'manual':
        raise ValueError(
            "Manual shift model selected but no shift-factor file was provided. "
            "Upload a shift-factor file or pick 'WLF' or 'hybrid'."
        )
    else:
        assert False, (
            f"Unknown shift_model: {shift_model!r}; expected 'WLF', 'hybrid', "
            "or 'manual'. The route must restrict shift_model to this set."
        )

    T_ref = {'WLF': Tg, 'hybrid': TL}.get(shift_model)  # None for 'manual'

    source_omega = df['Frequency'].to_numpy() if 'Frequency' in df.columns else 1.0
    out = df.assign(Frequency=source_omega * a_T, Temperature=T_ref)
    canonical = ['Frequency', 'Temperature', "E'", "E''"]
    extras = [c for c in df.columns if c not in canonical]
    return out[canonical + extras].sort_values('Frequency').reset_index(drop=True)


def tts_frequency_to_temperature(
        freq_sweep_data: pd.DataFrame,
        omega_ref: float,
        T_ref: float,
        C1: float,
        C2: float,
) -> pd.DataFrame:
    """
    Convert frequency-sweep viscoelastic data to temperature-sweep data via TTS.

    For each row computes a_T = Frequency / omega_ref and inverts the WLF
    equation about T_ref to find the temperature that would produce that shift
    factor. The returned DataFrame is at the reference frequency omega_ref.

    Parameters:
        freq_sweep_data (pd.DataFrame): Input data with columns
            ['Frequency', "E'", "E''"].
        omega_ref (float): Reference frequency for shifting.
        T_ref (float): WLF reference temperature.
        C1 (float): WLF parameter C1.
        C2 (float): WLF parameter C2.

    Returns:
        pd.DataFrame: Temperature-sweep data at omega_ref with columns
        ['Frequency', 'Temperature', "E'", "E''"], sorted by Temperature with a
        fresh 0..N-1 index. Input freq_sweep_data is not mutated.

    Raises:
        ValueError: If the inverse-WLF computation hits a singularity.
    """
    omega = freq_sweep_data['Frequency'].to_numpy()
    a_T = omega / omega_ref
    shifted_T = inverse_wlf_shift(a_T, T_ref, C1, C2)

    return pd.DataFrame({
        'Frequency': np.full(len(omega), omega_ref),
        'Temperature': shifted_T,
        "E'": freq_sweep_data["E'"].to_numpy(),
        "E''": freq_sweep_data["E''"].to_numpy(),
    }).sort_values('Temperature').reset_index(drop=True)


def argmax_peak(signal: np.ndarray) -> int:
    """
    Return the index of the most prominent peak in a 1-D signal.

    Uses scipy.signal.find_peaks with prominence=0.01 to locate candidate
    peaks and picks the one with the largest signal value.

    Parameters:
        signal (numpy.ndarray): 1-D array to scan for peaks.

    Returns:
        int: Index of the most prominent peak in signal.

    Raises:
        ValueError: If find_peaks returns no peaks.
    """
    assert isinstance(signal, np.ndarray) and signal.ndim == 1, \
        "signal must be a 1-D numpy.ndarray"
    peaks, _ = find_peaks(signal, prominence=0.01)
    if len(peaks) == 0:
        raise ValueError(
            "No peaks found. Try lowering the prominence parameter or enter the value manually."
        )
    return int(peaks[np.argmax(signal[peaks])])


def _build_temperature_figures(temp_sweep_data: pd.DataFrame) -> tuple:
    """
    Build E vs Temperature and tan-delta vs Temperature figures.

    Parameters:
        temp_sweep_data (pd.DataFrame): Frame with columns
            ['Temperature', "E'", "E''"]; extra columns are ignored.

    Returns:
        tuple: (fig4, fig41) where fig4 is the E' / E'' line plot in
        Temperature and fig41 is the E' / tan-delta line plot in Temperature.
    """
    df_melt = pd.melt(
        temp_sweep_data,
        id_vars=["Temperature"],
        value_vars=["E'", "E''"],
        var_name='Modulus',
        value_name="Young's Modulus (MPa)",
    )
    df_melt["Type"] = "Experiment"

    fig4 = px.line(
        df_melt, x="Temperature", y="Young's Modulus (MPa)",
        log_y=True,
        facet_col='Modulus',
        color="Type", line_dash="Type",
        labels={"Temperature": "Temperature (C)"},
    )

    df41_concat = df_melt.copy()
    df41_tand = pd.DataFrame()
    df41_tand["Temperature"] = df41_concat[df41_concat["Modulus"] == "E''"]["Temperature"]
    df41_tand["Type"] = df41_concat[df41_concat["Modulus"] == "E''"]["Type"]
    df41_tand["Young's Modulus (MPa)"] = (
        df41_concat[df41_concat["Modulus"] == "E''"]["Young's Modulus (MPa)"].to_numpy() /
        df41_concat[df41_concat["Modulus"] == "E'"]["Young's Modulus (MPa)"].to_numpy()
    )
    df41_tand['Modulus'] = 'tan delta'
    df41_concat = pd.concat([df41_concat, df41_tand], ignore_index=True)

    fig41 = px.line(
        df41_concat[df41_concat['Modulus'] != "E''"],
        x="Temperature", y="Young's Modulus (MPa)",
        facet_col='Modulus',
        color="Type", line_dash="Type",
        labels={"Temperature": "Temperature (C)"},
    )
    fig41.update_yaxes(matches=None, showticklabels=True)
    fig41.update_yaxes(type="log", col=1)
    fig4.update_yaxes(exponentformat='power')
    fig41.update_yaxes(exponentformat='power')
    return fig4, fig41


def _build_complex_figures(df: pd.DataFrame, tau_i: np.ndarray, E_i: np.ndarray,
                           N_nz: int) -> tuple:
    """
    Build E vs frequency and tan-delta vs frequency figures with Prony overlay.

    Parameters:
        df (pd.DataFrame): Experimental data with columns
            ['Frequency', 'E Storage', 'E Loss'].
        tau_i (numpy.ndarray): Prony relaxation times.
        E_i (numpy.ndarray): Prony coefficients (length tau_i or tau_i + 1).
        N_nz (int): Number of nonzero Prony coefficients; used in trace names.

    Returns:
        tuple: (fig1, fig11) where fig1 is E' / E'' vs Frequency and fig11 is
        E' / tan-delta vs Frequency.
    """
    complex_df = compute_complex(tau_i, E_i)
    x_col, y_col, z_col = df.columns[0], df.columns[1], df.columns[2]
    df_melt = pd.melt(
        df, id_vars=[x_col], value_vars=[y_col, z_col],
        var_name='Modulus', value_name="Young's Modulus (MPa)",
    )
    df_melt["Type"] = "Experiment"

    cx_x, cx_y, cx_z = complex_df.columns[0], complex_df.columns[1], complex_df.columns[2]
    complex_melt = pd.melt(
        complex_df, id_vars=[cx_x], value_vars=[cx_y, cx_z],
        var_name='Modulus', value_name="Young's Modulus (MPa)",
    )
    complex_melt["Type"] = f"{N_nz}-Term Prony"

    df_concat = pd.concat([df_melt, complex_melt], ignore_index=True)

    fig1 = px.line(
        df_concat, x=cx_x, y="Young's Modulus (MPa)",
        log_x=True, log_y=True,
        facet_col='Modulus',
        color="Type", line_dash="Type",
        line_dash_map={"Experiment": "solid", f"{N_nz}-Term Prony": "dash"},
        labels={"Frequency": "Frequency (Hz)"},
    )

    df11_concat = df_concat.copy()
    df11_tand = pd.DataFrame()
    df11_tand["Frequency"] = df11_concat[df11_concat["Modulus"] == "E Loss"]["Frequency"]
    df11_tand["Type"] = df11_concat[df11_concat["Modulus"] == "E Loss"]["Type"]
    df11_tand["Young's Modulus (MPa)"] = (
        df11_concat[df11_concat["Modulus"] == "E Loss"]["Young's Modulus (MPa)"].to_numpy() /
        df11_concat[df11_concat["Modulus"] == "E Storage"]["Young's Modulus (MPa)"].to_numpy()
    )
    df11_tand['Modulus'] = 'tan delta'
    df11_concat = pd.concat([df11_concat, df11_tand], ignore_index=True)

    fig11 = px.line(
        df11_concat[df11_concat['Modulus'] != "E Loss"],
        x="Frequency", y="Young's Modulus (MPa)",
        log_x=True,
        facet_col='Modulus',
        color="Type", line_dash="Type",
        line_dash_map={"Experiment": "solid", f"{N_nz}-Term Prony": "dash"},
        labels={"Frequency": "Frequency (Hz)"},
    )
    fig11.update_yaxes(matches=None, showticklabels=True)
    fig11.update_yaxes(type="log", col=1)
    for fig in (fig1, fig11):
        fig.update_xaxes(exponentformat='power')
        fig.update_yaxes(exponentformat='power')
    return fig1, fig11


def _build_relaxation_figures(tau_i: np.ndarray, E_i: np.ndarray, N_nz: int,
                              fit_settings: bool) -> tuple:
    """
    Build relaxation-modulus and relaxation-spectrum figures with optional basis overlay.

    Parameters:
        tau_i (numpy.ndarray): Prony relaxation times.
        E_i (numpy.ndarray): Prony coefficients (length tau_i or tau_i + 1).
        N_nz (int): Number of nonzero Prony coefficients; used in trace names.
        fit_settings (bool): If True, overlay the basis scatter on each figure;
            if False, return only the line traces.

    Returns:
        tuple: (fig2, fig3) where fig2 is the time-domain relaxation modulus E(t)
        and fig3 is the relaxation spectrum H(t).
    """
    relax = compute_relaxation_modulus(tau_i, E_i)
    relax["Type"] = f"{N_nz}-Term Prony"
    fig2a = px.line(
        relax, x="Time", y="E",
        log_x=True, log_y=True,
        color="Type", line_dash="Type",
        line_dash_map={"Basis": "solid", f"{N_nz}-Term Prony": "dash"},
        labels={"Time": "Time (s)", "E": "Relaxation Modulus (MPa)"},
    )
    fig2a.update_layout(
        autosize=False, width=800, height=450,
        margin=dict(l=80, r=60, t=60, b=80),
    )

    basis_df = pd.DataFrame({
        "Time": tau_i,
        "E": E_i[len(E_i) - len(tau_i):],
        "Type": f"{N_nz}-Term Basis",
    })
    fig2b = px.scatter(
        basis_df, x="Time", y="E",
        log_x=True, log_y=True,
        symbol="Type",
        labels={"Time": "Time (s)", "E": "Relaxation Modulus (MPa)"},
    )

    fig2 = go.Figure(data=fig2a.data + fig2b.data)
    fig2.update_xaxes(type="log")
    fig2.update_yaxes(type="log")
    fig2.update_layout(
        autosize=False, margin=dict(l=80, r=60, t=60, b=80),
        xaxis_title="Time (s)",
        yaxis_title="Relaxation Modulus (MPa)",
        legend_title="Type",
    )

    rspectrum = compute_relaxation_spectrum(tau_i, E_i)
    rspectrum["Type"] = f"{N_nz}-Term Prony"
    fig3a = px.line(
        rspectrum, x="Time", y="H",
        log_x=True, log_y=True,
        color="Type", line_dash="Type",
        line_dash_map={"Basis": "solid", f"{N_nz}-Term Prony": "dash"},
        labels={"Time": "Time (s)", "H": "Relaxation Spectrum (MPa)"},
    )
    fig3a.update_layout(
        autosize=False, width=800, height=450,
        margin=dict(l=80, r=60, t=60, b=80),
    )

    fig3 = go.Figure(data=fig3a.data + fig2b.data)
    fig3.update_xaxes(type="log")
    fig3.update_yaxes(type="log")
    fig3.update_layout(
        autosize=False, margin=dict(l=80, r=60, t=60, b=80),
        xaxis_title="Time (s)",
        yaxis_title="Relaxation Spectrum (MPa)",
        legend_title="Type",
    )

    if not fit_settings:
        fig2, fig3 = fig2a, fig3a

    for fig in (fig2, fig3):
        fig.update_xaxes(exponentformat='power')
        fig.update_yaxes(exponentformat='power')
    return fig2, fig3


def _build_coef_records(tau_i: np.ndarray, E_i: np.ndarray) -> list:
    """
    Build the Prony coefficient table as a list of records.

    Parameters:
        tau_i (numpy.ndarray): Prony relaxation times.
        E_i (numpy.ndarray): Prony coefficients (length tau_i or tau_i + 1).

    Returns:
        list: List of dicts with keys 'i', 'tau_i', 'E_i' — one per nonzero
        coefficient, with 'i' the original (pre-filter) index.
    """
    coef_df = pd.DataFrame({"tau_i": tau_i, "E_i": E_i[len(E_i) - len(tau_i):]})
    coef_df = coef_df[coef_df.E_i != 0].reset_index(drop=False)
    coef_df = coef_df.rename(columns={'index': 'i'})
    return coef_df.to_dict("records")


EXPECTED_DOMAIN_COLUMNS = {
    'frequency':   ('Frequency', 'E Storage', 'E Loss'),
    'temperature': ('Temperature', 'E Storage', 'E Loss'),
}


@log_errors
def update_line_chart(uploadData, number_of_prony, smoothness, fit_settings, domain,
                      Tg=None, C1=None, C2=None, Ea=None, TL=None, shift_model=None, shiftData=None,
                      relative_error=0.2):
    """
    Update the dynamfit figures and Prony coefficient table for an uploaded dataset.

    Parameters:
        uploadData (dict[str, np.ndarray]): Output of upload_init() for the
            chosen domain. Keys must be ('Frequency', 'E Storage', 'E Loss')
            for frequency domain or ('Temperature', 'E Storage', 'E Loss') for
            temperature domain.
        number_of_prony (int): Number of terms in the Prony series.
        smoothness (float): Smoothing regularization for the fit.
        fit_settings (bool): If True, overlay the basis scatter on the
            relaxation modulus and spectrum figures.
        domain (str): 'frequency' or 'temperature'.
        Tg, C1, C2, Ea, TL: Shift-model parameters (temperature domain only).
        shift_model (str): 'WLF' or 'hybrid' (temperature domain only).
        shiftData: Optional precomputed shift factors {'Temperature': ..., 'a_T': ...}.

    Returns:
        fig1 (plotly.graph_objects.Figure): The line chart.
        fig11 (plotly.graph_objects.Figure): The updated line chart.
        fig2 (plotly.graph_objects.Figure): The scatter plot.
        fig3 (plotly.graph_objects.Figure): The updated scatter plot.
        fig4 (plotly.graph_objects.Figure): The temperature line chart.
        fig41 (plotly.graph_objects.Figure): The tandelta temperature updated line chart.
        coef_df (List[Dict[str, Union[float, int]]]): The coefficients.

    Raises:
        ValueError: If the uploaded data is empty, contains non-finite values,
            or has non-positive frequency values where positives are required.
        AssertionError: If domain or uploadData keys do not match the contract;
            this signals a server bug, not user-fixable input.
    """
    assert domain in EXPECTED_DOMAIN_COLUMNS, \
        f"Unknown domain {domain!r}; expected one of {list(EXPECTED_DOMAIN_COLUMNS)}."
    expected_cols = EXPECTED_DOMAIN_COLUMNS[domain]
    assert isinstance(uploadData, dict) and all(k in uploadData for k in expected_cols), \
        f"uploadData must contain {expected_cols} for domain {domain!r}; got " \
        f"{tuple(uploadData.keys()) if isinstance(uploadData, dict) else type(uploadData).__name__}."

    df = pd.DataFrame(uploadData)

    if len(df) == 0:
        raise ValueError("Uploaded file has no data rows.")
    if not np.all(np.isfinite(df.to_numpy())):
        raise ValueError(
            "Uploaded file contains non-finite values (NaN or Inf). "
            "Check for blank entries or text in numeric columns."
        )

    if domain == "frequency":
        if np.any(df['Frequency'].to_numpy() <= 0):
            raise ValueError(
                "All Frequency values in the uploaded file must be positive. "
                "Remove rows with zero or negative frequencies."
            )
        freq_sweep_data = df.rename(columns={'E Storage': "E'", 'E Loss': "E''"})
        # TODO: update this when reverse hybrid TTSP becomes available
        temp_sweep_data = tts_frequency_to_temperature(
            freq_sweep_data,
            omega_ref=VIS_REF_FREQUENCY_HZ, T_ref=VIS_REF_TEMPERATURE_C,
            C1=UNIVERSAL_WLF_C1, C2=UNIVERSAL_WLF_C2,
        )
        fig4, fig41 = _build_temperature_figures(temp_sweep_data)

    elif domain == "temperature":
        temp_sweep_data = df.rename(columns={'E Storage': "E'", 'E Loss': "E''"})
        fig4, fig41 = _build_temperature_figures(temp_sweep_data)

        # `is not None` rather than truthy checks: Tg = 0 °C is a valid
        # reference, and the route default-fills numeric estimates that may
        # legitimately be zero. Tg is required only for WLF (used as T_ref);
        # hybrid_shift uses TL as the WLF/Arrhenius crossover and never reads Tg.
        has_shift_params = (
            shiftData is not None
            or (shift_model == "WLF"
                and Tg is not None and C1 is not None and C2 is not None)
            or (shift_model == "hybrid"
                and TL is not None and C1 is not None and C2 is not None
                and Ea is not None)
        )
        if not has_shift_params:
            # No way to bring temperature data onto a master curve, so the
            # frequency-domain figures and coefficient table are not produced.
            empty = go.Figure()
            return (
                empty, empty, empty, empty, fig4, fig41,
                pd.DataFrame(columns=["tau_i", "E_i"]).to_dict("records"),
            )

        freq_sweep_data = tts_temperature_to_frequency_V2(
            temp_sweep_data, shift_model,
            Tg=Tg, TL=TL, C1=C1, C2=C2, Ea=Ea, shiftData=shiftData,
        )
        df = freq_sweep_data.rename(
            columns={"E'": 'E Storage', "E''": 'E Loss'},
        )

    E_stor_arr = df['E Storage'].to_numpy()
    E_loss_arr = df['E Loss'].to_numpy()
    if 'E Storage Error' in df.columns and 'E Loss Error' in df.columns:
        E_stor_std = df['E Storage Error'].to_numpy()
        E_loss_std = df['E Loss Error'].to_numpy()
    elif 'Error' in df.columns:
        E_stor_std = df['Error'].to_numpy()
        E_loss_std = E_stor_std
    else:
        E_stor_std = np.abs(E_stor_arr + 1.0j * E_loss_arr) * relative_error
        E_loss_std = E_stor_std
    tau_i, E_i = smooth_prony_fit(
        omega=df['Frequency'].to_numpy(),
        E_stor=E_stor_arr,
        E_loss=E_loss_arr,
        E_stor_std=E_stor_std,
        E_loss_std=E_loss_std,
        N=number_of_prony, smoothness=smoothness,
    )
    N_nz = np.count_nonzero(E_i)

    # Downstream figure builders assume df's first three columns are
    # exactly (Frequency, E Storage, E Loss); drop any extras now that
    # the std arrays have been pulled out.
    df = df[['Frequency', 'E Storage', 'E Loss']]
    fig1, fig11 = _build_complex_figures(df, tau_i, E_i, N_nz)
    fig2, fig3 = _build_relaxation_figures(tau_i, E_i, N_nz, fit_settings)
    coef_records = _build_coef_records(tau_i, E_i)

    return fig1, fig11, fig2, fig3, fig4, fig41, coef_records
