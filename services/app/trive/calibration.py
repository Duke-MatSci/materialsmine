"""
Deriving shift-model parameters from measured data: the C1/C2/Ea curve fits
behind the /fit-shift/ route, and the peak finder the /extract/ route uses to
estimate Tg (tan-δ peak) and TL (E'' peak).

The inverse of `shift`: that module evaluates a_T given coefficients, this one
recovers coefficients given a_T. Everything here fits in log10(a_T) space so
that points spanning many decades of shift factor carry equal weight.
"""

import numpy as np
from scipy.optimize import curve_fit
from scipy.signal import find_peaks

from .shift import hybrid_shift, UNIVERSAL_WLF_C1, UNIVERSAL_WLF_C2, wlf_log10_shift


def _curve_fit_shift(model, T: np.ndarray, log10_a_T: np.ndarray,
                     p0: list, bounds=(-np.inf, np.inf),
                     log10_space: bool = False,
                     sigma: np.ndarray = None) -> np.ndarray:
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
        sigma (numpy.ndarray): Per-point standard deviations of log10(a_T),
            forwarded to curve_fit with absolute_sigma=True. None (the
            default) is curve_fit's own implicit unit sigma, so passing an
            all-ones array reproduces the unweighted fit exactly.

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
        popt, _ = curve_fit(fit_model, T, log10_a_T, p0=p0, bounds=bounds,
                            sigma=sigma, absolute_sigma=sigma is not None)
    except RuntimeError as exc:
        raise ValueError(
            f"Shift-factor curve fit did not converge: {exc}. "
            "Try supplying better initial guesses or checking the input data."
        ) from exc
    return popt


def _sigma_log10(a_T: np.ndarray, sigma_a_T) -> np.ndarray:
    """
    Convert absolute standard deviations on a_T to log10 space.

    First-order error propagation: sigma_log10 = sigma_a_T / (a_T * ln 10).
    When sigma_a_T is None there is no uncertainty information, so every
    point gets unit sigma in log10 space — one decade — which weights the
    fit uniformly (curve_fit's own implicit default) and makes the reported
    chi-squared a mean squared residual in decades².

    Parameters:
        a_T (numpy.ndarray): 1-D array of positive shift factors.
        sigma_a_T: 1-D array of absolute standard deviations on a_T, same
            length, or None.

    Returns:
        numpy.ndarray: 1-D array of log10-space standard deviations.
    """
    if sigma_a_T is None:
        return np.ones_like(a_T)
    sigma_a_T = np.asarray(sigma_a_T, dtype=float)
    assert sigma_a_T.shape == a_T.shape, \
        f"sigma_a_T must match a_T in shape; got {sigma_a_T.shape} and {a_T.shape}"
    if not np.all(sigma_a_T > 0):
        raise ValueError(
            "All shift-factor Error values must be positive. Error columns "
            "are absolute standard deviations of a_T and are used as 1/sigma "
            "fit weights, so zero or negative entries are undefined."
        )
    return sigma_a_T / (a_T * np.log(10.0))


def _shift_chi2_reduced(log10_resid: np.ndarray, sigma_log10: np.ndarray,
                        n_free: int):
    """
    Reduced chi-squared of a shift-model fit, in log10(a_T) space.

    chi² = Σ (resid/σ)² over the fitted points, divided by ν = n − n_free.
    Follows _prony_fit_quality's convention: None when ν ≤ 0, since χ²/ν is
    undefined there. With unit sigma (no Error column) this is the mean
    squared log10 residual per degree of freedom — residuals in decades².

    Parameters:
        log10_resid (numpy.ndarray): model − data residuals in log10(a_T).
        sigma_log10 (numpy.ndarray): per-point σ in log10 space, same length.
        n_free (int): number of parameters the optimizer actually varied.

    Returns:
        float or None: χ²/ν, or None when the degrees of freedom are not
        positive.
    """
    dof = len(log10_resid) - n_free
    if dof <= 0:
        return None
    scaled = log10_resid / sigma_log10
    return float(scaled @ scaled / dof)


def fit_wlf_coefficients(
        T: np.ndarray,
        a_T: np.ndarray,
        T_ref: float,
        C1: float = None,
        C2: float = None,
        fix_C1: bool = False,
        fix_C2: bool = False,
        *,
        sigma_a_T: np.ndarray = None,
        return_quality: bool = False,
) -> tuple:
    """
    Fit WLF shift-model coefficients (C1, C2) to shift-domain data, co-fitting
    the vertical reference offset a_T_ref.

    Uses scipy.optimize.curve_fit in log10(a_T) space so that points spanning
    many decades of shift factor receive uniform weight. T_ref is required and
    is never optimized — it is a physical input (e.g. Tg) supplied by the
    caller.

    The bare WLF equation is 1 at T_ref, but measured shift factors need not be
    referenced there: a master curve built at 150 °C carries a_T == 1 at 150 °C,
    not at Tg. Anchoring the curve at 1 anyway makes C1 and C2 absorb the
    offset, so a_T_ref — the data's shift factor at T_ref — is always co-fitted,
    exactly as fit_hybrid_coefficients does at TC. It is carried through the
    optimizer as log10(a_T_ref): that is the space the fit and the data live in,
    it needs no positivity bound, and data referenced decades away stays as well
    scaled as data referenced at T_ref.

    Individual parameters can be fixed at their supplied values by setting the
    corresponding fix_* flag. A supplied-but-not-fixed value becomes the
    initial guess; otherwise the WLF universal constants are used. Fixed
    parameters are held constant by closing them over inside the model rather
    than passing them to curve_fit.

    When C2 is free, a lower bound c2_min = (T_ref - min(T)) + 1.0 is enforced
    to keep the WLF denominator positive (1 °C margin). The fit uses
    wlf_log10_shift directly (log10_space=True) to avoid the 10**exponent
    overflow that otherwise occurs for cold data (T well below T_ref).

    Fixing both C1 and C2 no longer leaves nothing to optimize — the offset is
    still fitted against the supplied curve, which is a one-parameter linear
    least squares the optimizer solves at once.

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
        sigma_a_T (numpy.ndarray): Optional absolute standard deviations on
            a_T (the shift file's Error column), same length as a_T. Converted
            to log10 space and used as 1/sigma weights in the fit and in the
            chi-squared. None weights every point equally (see _sigma_log10).
        return_quality (bool): If True, append the reduced chi-squared of the
            fit to the return tuple (see _shift_chi2_reduced; None when the
            degrees of freedom are not positive).

    Returns:
        tuple: (C1_fit, C2_fit, a_T_ref) — fitted (or fixed) WLF coefficients
        plus the co-fitted reference shift factor a_T_ref (the data's shift
        factor at T_ref; 1.0 when the data is referenced to T_ref) — with
        chi2_reduced appended when return_quality is True.

    Raises:
        ValueError: If any a_T value is non-positive (log10 undefined), if any
            sigma_a_T value is non-positive, if curve_fit does not converge, or
            if fixed parameters put a data point at the WLF pole.
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
    sigma = _sigma_log10(a_T, sigma_a_T)

    C1_0 = C1 if C1 is not None else UNIVERSAL_WLF_C1
    C2_0 = C2 if C2 is not None else UNIVERSAL_WLF_C2

    # Lower bound for a free C2: keeps denominator C2 + (T - T_ref) >= 1 for
    # all T in the dataset, preventing a WLF pole and keeping the analytic
    # log10 finite for any finite C1.
    c2_min = (T_ref - float(np.min(T))) + 1.0

    log10_a_T = np.log10(a_T)
    # A free C2 starts no closer to the pole than the bound allows; a fixed one
    # is the caller's to get right, and the guard below reports it if they did not.
    C2_start = C2_0 if fix_C2 else max(C2_0, c2_min)

    # Seed the offset at its conditional optimum given the starting C1/C2 — the
    # sigma-weighted mean residual, which is the exact least-squares solution for
    # a lone additive term. Seeding at a_T == 1 (or at an interpolated point, as
    # the hybrid fit must because of its kink at TC) is wrong by whole decades
    # for a file referenced away from T_ref, and costs iterations from the start.
    with np.errstate(divide='ignore', invalid='ignore'):
        resid_0 = log10_a_T - wlf_log10_shift(T, T_ref, C1_0, C2_start)
    if not np.all(np.isfinite(resid_0)):
        # Only a fixed C2 can put a data point on the pole; every fitted path
        # bounds C2 away from it. Same message wlf_shift raises for this case.
        raise ValueError(
            "divide by zero detected when calculating WLF. "
            "Please adjust parameters or manually provide shift factors."
        )
    weights = 1.0 / sigma ** 2
    log10_a_T_ref_0 = float(weights @ resid_0 / weights.sum())

    # Build a model over only the free parameters; fixed ones are closed over.
    # This avoids passing degenerate lb==ub bounds to curve_fit, which some
    # scipy versions reject. The offset is always free.
    free_names = [n for n, fixed in
                  [('C1', fix_C1), ('C2', fix_C2), ('log10_a_T_ref', False)]
                  if not fixed]
    p0 = [v for v, fixed in
          [(C1_0, fix_C1), (C2_start, fix_C2), (log10_a_T_ref_0, False)]
          if not fixed]
    lb = [c2_min if n == 'C2' else -np.inf for n in free_names]
    ub = [np.inf] * len(free_names)

    def model(T_arg, *free_vals):
        vals = dict(zip(free_names, free_vals))
        return wlf_log10_shift(
            T_arg, T_ref,
            vals.get('C1', C1_0),
            vals.get('C2', C2_0),
        ) + vals['log10_a_T_ref']

    fitted = _curve_fit_shift(model, T, log10_a_T, p0=p0, bounds=(lb, ub),
                              log10_space=True, sigma=sigma)
    result = dict(zip(free_names, fitted))
    C1_fit = float(result.get('C1', C1_0))
    C2_fit = float(result.get('C2', C2_0))
    a_T_ref_fit = 10.0 ** float(result['log10_a_T_ref'])

    if not return_quality:
        return C1_fit, C2_fit, a_T_ref_fit

    log10_model = wlf_log10_shift(T, T_ref, C1_fit, C2_fit, a_T_ref_fit)
    if not np.all(np.isfinite(log10_model)):
        # The pole is ruled out above, so this catches only an offset that
        # under/overflowed the 10** round-trip on its way out of the optimizer.
        raise ValueError(
            "divide by zero detected when calculating WLF. "
            "Please adjust parameters or manually provide shift factors."
        )
    n_free = 3 - int(fix_C1) - int(fix_C2)  # a_T_ref always free
    chi2 = _shift_chi2_reduced(log10_model - log10_a_T, sigma, n_free)
    return C1_fit, C2_fit, a_T_ref_fit, chi2


def fit_hybrid_coefficients(
        T: np.ndarray,
        a_T: np.ndarray,
        TC: float,
        C1: float = None,
        C2: float = None,
        Ea: float = None,
        fix_C1: bool = False,
        fix_C2: bool = False,
        fix_Ea: bool = False,
        *,
        sigma_a_T: np.ndarray = None,
        return_quality: bool = False,
) -> tuple:
    """
    Fit hybrid Arrhenius/WLF shift-model coefficients (C1, C2, Ea) to
    shift-domain data.

    Uses scipy.optimize.curve_fit in log10(a_T) space so that points spanning
    many decades of shift factor receive uniform weight. TC is required and is
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
        TC (float): WLF/Arrhenius crossover temperature in °C; passed through
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
        sigma_a_T (numpy.ndarray): Optional absolute standard deviations on
            a_T (the shift file's Error column), same length as a_T. Converted
            to log10 space and used as 1/sigma weights in the fit and in the
            chi-squared. None weights every point equally (see _sigma_log10).
        return_quality (bool): If True, append the reduced chi-squared of the
            fit to the return tuple (see _shift_chi2_reduced; None when the
            degrees of freedom are not positive).

    Returns:
        tuple: (C1_fit, C2_fit, Ea_fit, a_T_ref) — fitted (or fixed) hybrid
            coefficients plus the co-fitted reference shift factor a_T_ref (the
            data's shift factor at TC; 1.0 when the data is referenced to TC) —
            with chi2_reduced appended when return_quality is True.

    Raises:
        ValueError: If any a_T value is non-positive (log10 undefined), if any
            sigma_a_T value is non-positive, if TC falls outside the data range
            so a model segment is degenerate, or if curve_fit does not converge.
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
    sigma = _sigma_log10(a_T, sigma_a_T)

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

    if not fix_Ea and TC <= T[-(not ascending)]:
        raise ValueError("Tc is below the range of the shift factor data, leading"
                         "to a degenerate Arrhenius segment of hybrid fit. Check data "
                         "or supply a different Tc.")

    if not (fix_C1 or fix_C2) and TC >= T[-(ascending)]:
        raise ValueError("Tc is above the range of the shift factor data, leading"
                         "to a degenerate WLF segment of hybrid fit. Check data or "
                         "supply a different Tc.")

    # The shift factors may not be referenced to TC, but hybrid_shift is always 1
    # at TC. So a_T_ref (the data's shift factor at TC) is co-fitted as a vertical
    # offset rather than read off a single interpolated point: interpolating
    # across the WLF/Arrhenius kink at TC biases the estimate (and hence the whole
    # fit) even when the data is referenced exactly to TC. The interp value only
    # seeds the optimizer; np.interp needs ascending samples, so order them.
    log10_a_T = np.log10(a_T)
    T_asc = T if ascending else T[::-1]
    log10_asc = log10_a_T if ascending else log10_a_T[::-1]
    a_T_ref_0 = 10 ** float(np.interp(TC, T_asc, log10_asc))

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
    # sees T > TC (not cold data), so the 10**exponent overflow that afflicts
    # fit_wlf_coefficients cannot occur here; log10_space=False is intentional.
    _floor = {'C2': 1.0, 'a_T_ref': np.finfo(float).tiny}
    lb = [_floor.get(n, -np.inf) for n in free_names]
    ub = [np.inf] * len(free_names)

    def model(T_arg, *free_vals):
        vals = dict(zip(free_names, free_vals))
        return hybrid_shift(
            T_arg, TC,
            vals.get('C1', C1_0),
            vals.get('C2', C2_0),
            vals.get('Ea', Ea_0),
            vals.get('a_T_ref', a_T_ref_0),
            ascending,
        )

    fitted = _curve_fit_shift(model, T, log10_a_T, p0=p0, bounds=(lb, ub),
                              sigma=sigma)
    result = dict(zip(free_names, fitted))
    C1_fit = float(result.get('C1', C1_0))
    C2_fit = float(result.get('C2', C2_0))
    Ea_fit = float(result.get('Ea', Ea_0))
    a_T_ref_fit = float(result.get('a_T_ref', a_T_ref_0))
    if not return_quality:
        return C1_fit, C2_fit, Ea_fit, a_T_ref_fit

    # Same failure modes as the fit itself: hybrid_shift raises ValueError at a
    # pole or on overflow, which the route already maps to HTTP 400.
    log10_model = np.log10(hybrid_shift(
        T, TC, C1_fit, C2_fit, Ea_fit, a_T_ref_fit, ascending,
    ))
    n_free = 4 - int(fix_C1) - int(fix_C2) - int(fix_Ea)  # a_T_ref always free
    chi2 = _shift_chi2_reduced(log10_model - log10_a_T, sigma, n_free)
    return C1_fit, C2_fit, Ea_fit, a_T_ref_fit, chi2


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


def peak_edge_warning(peak_T: float, T: np.ndarray, label: str,
                      margin: float = 5.0):
    """
    Warn when an estimated peak temperature sits near the data's edge.

    A tan-δ or E-loss peak within margin °C of the measured range's end is
    suspect: the true peak may lie beyond the range, or the "peak" may be a
    boundary/instrument artifact (the failure mode that motivated this check —
    the bundled Agilus30 ramp's since-cropped tail rows spiked tan δ at the
    hot edge and dragged the Tg estimate 21 °C hot). The estimate itself is
    still used by the caller; this only produces the user-facing caution.

    Parameters:
        peak_T (float): Estimated peak temperature in °C.
        T (numpy.ndarray): 1-D array of the data's temperatures in °C.
        label (str): Display name for the message ('Tg' or 'Tc').
        margin (float): Proximity threshold in °C. Defaults to 5.

    Returns:
        str | None: Warning message, or None when the peak is comfortably
        interior.
    """
    T = np.asarray(T, dtype=float)
    lo, hi = float(T.min()), float(T.max())
    if min(peak_T - lo, hi - peak_T) < margin:
        return (
            f"Estimated {label} = {peak_T:g} °C is within {margin:g} °C of the "
            f"edge of the data's temperature range ({lo:g} to {hi:g} °C); the "
            "true peak may lie outside the measured range or be an edge "
            f"artifact. Consider supplying {label} manually."
        )
    return None
