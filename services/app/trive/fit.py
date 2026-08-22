"""
The smoothed Prony fit: the one entry point that turns measured complex-modulus
data into (tau_i, E_i).

Composes the rest of the fitting stack — `prony` for the grid, `reduction` for
the exact QR compression, `objective` for the penalized loss, `quality` for the
score — and owns the two decisions that need all four in view: how the
user-facing smoothness knob is normalized, and which slice of the reduced
system each solver may see.
"""

import numpy as np
from scipy.optimize import minimize, nnls

from .prony import prony_relaxation_space
from .objective import (
    _log_curvature,
    _mean_sq_curvature,
    _prony_objective,
    _scaled_smoothness,
)
from .reduction import _prony_reduce
from .quality import _FitQuality, _prony_fit_quality


def smooth_prony_fit(
        omega: np.ndarray,
        E_stor: np.ndarray,
        E_loss: np.ndarray,
        E_stor_std: np.ndarray,
        E_loss_std: np.ndarray,
        N: int,
        smoothness: float,
        solid: bool = True,
        return_fit_quality: bool = False,
        std_scale: float = 1.0,
) -> tuple:
    """
    Fit a Prony series to complex-modulus data with coefficient smoothing.

    Builds a log-spaced relaxation-time grid spanning 1/max(omega) to
    1/min(omega) and solves for non-negative Prony coefficients that minimize
    the weighted squared residuals, plus an optional second-difference
    smoothness penalty on the log-coefficients (see _prony_objective).

    Numerics: the weighted data term is first compressed EXACTLY by a chunked
    QR factorization of the weighted basis (see _prony_reduce) —
        ||(y - B c) / std||^2 = ||R c - z||^2
    — so the reduced system has at most N + solid + 1 rows regardless of how many
    data rows the upload carries. Householder QR accumulates the residual
    information backward-stably (no explicit sums of squares), memory stays
    O(_QR_CHUNK_ROWS * N), and every subsequent solver operation costs O(N^2)
    independent of the input row count.

    With smoothness == 0 the reduced problem is exactly non-negative least
    squares and is solved directly by scipy.optimize.nnls: finite,
    deterministic, no line search, no initial guess. Coefficients may then be
    EXACTLY zero (downstream consumers already filter E_i != 0). With
    smoothness > 0 the log-space penalty is nonlinear in the coefficients, so
    _prony_objective is minimized on the reduced system (basis=R, data=z, which
    the reduction has already weighted by 1/std) with L-BFGS-B, seeded from the
    NNLS solution and bounded above in log-space — without that bound the line
    search was measured to run exp(logcoefs) into overflow on broadband
    (many-decade) master curves.

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
        smoothness (float): Strength of the smoothing prior on the
            log-coefficients. Pass 0 to disable. Normalized internally by
            sqrt(dof / h**3) (see _scaled_smoothness), h being the log-tau grid
            spacing, which makes it the exchange rate between the two numbers
            the fit-quality readout reports: V/dof = chi2_reduced +
            smoothness**2 * (log_range * curvature). A given value therefore
            produces comparable smoothing whether the file has 400 rows or
            40,000, whether it is fit with 20 terms or 100, and whether it
            covers 4 decades or 20.
        solid (bool): Whether to include an equilibrium-modulus term.
        return_fit_quality (bool): Append a _FitQuality to the return tuple.
            Off by default so existing two-value unpacking keeps working.
        std_scale (float): Uniform positive multiplier on both std arrays,
            equivalent to passing E_stor_std * std_scale but held out of the
            reduction so a caller that varies ONLY this factor — the
            relative-error widget — reuses one cached reduction across every
            value instead of redoing the O(rows) QR per move. See _prony_reduce.

    Returns:
        tuple: (tau_i, E_i) where tau_i is the 1-D relaxation-time grid of
        length N and E_i is the 1-D non-negative coefficient array of length
        N + bool(solid). Entries can be exactly zero (NNLS active set). With
        return_fit_quality, (tau_i, E_i, quality); quality.neg_log_posterior is
        None unless the fit converged to an INTERIOR minimum with smoothing on,
        since the Laplace approximation behind it assumes a stationary point,
        and quality.curvature is None on the unsmoothed path, where the NNLS
        active set makes log-coefficients (and so their roughness) undefined.
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
    # Not merely "non-zero": a negative scale would flip the sign of every
    # weighted residual, and the route already rejects relative_error <= 0
    # and error_scale <= 0 (whichever feeds std_scale).
    assert std_scale > 0, "std_scale must be positive"

    tau_max = 1 / np.min(omega)
    tau_min = 1 / np.max(omega)
    tau_i = prony_relaxation_space(tau_min, tau_max, N)

    m = N + solid
    n_res = 2 * len(omega)
    dof = n_res - m

    R, z = _prony_reduce(
        omega, E_stor, E_loss, E_stor_std, E_loss_std, tau_i, solid, std_scale
    )
    # (R, z) carries the unreachable orthogonal residual as its last row, which
    # is what puts every score on the full-problem scale. L-BFGS-B must NOT see
    # it: its ftol is RELATIVE to f, so a constant the fit cannot reduce makes
    # the stopping test lazier by exactly the factor it inflates f — measured at
    # 13x the reducible residual on a 200-row upload, costing ~1e-5 in the
    # converged coefficients. nnls is immune (finite active set, no tolerance)
    # and wants the full norm, so only the minimize call takes the slice.
    R_fit, z_fit = R[:m], z[:m]

    # Reduced problem with smoothness == 0 is exactly non-negative least
    # squares — solve it directly (finite algorithm, no iteration budget).
    E_nnls, rnorm = nnls(R, z)
    if smoothness == 0:
        if not return_fit_quality:
            return tau_i, E_nnls
        # No penalty means no posterior over lam to report, but the misfit is
        # still meaningful — and nnls already handed us ||R c - z||, which the
        # reduction's residual row makes a full-problem quantity. Curvature is
        # genuinely undefined here, not merely unavailable: NNLS's active set
        # leaves coefficients EXACTLY zero, whose logs are -inf.
        return tau_i, E_nnls, _FitQuality(
            rnorm ** 2 / dof if dof > 0 else None, None, None,
        )

    # smoothness > 0: the second-difference penalty acts on log-coefficients,
    # so run _prony_objective on the reduced system. Seed from the NNLS
    # solution (clipping exact zeros so log stays finite); if NNLS zeroed
    # everything, fall back to the data-scaled flat guess.
    pos = E_nnls[E_nnls > 0]
    if pos.size:
        x0 = np.log(np.maximum(E_nnls, pos.min() * 1e-3))
    else:
        x0 = np.full(m, np.log(E_stor.max() / m))
    # Normalize the knob so it means the same thing on any upload; see
    # _scaled_smoothness, which _prony_fit_quality re-derives from the same
    # inputs so the reported score belongs to the fit that was actually run.
    log_range = np.log(tau_i[-1] / tau_i[0])
    smoothness_scaled = _scaled_smoothness(smoothness, N, dof, log_range)
    # Upper bound on log-coefficients: no single Prony term should exceed
    # ~1000x the data maximum. Without this, the line search was measured to
    # push exp(logcoefs) into overflow on broadband master curves.
    ub = np.log(E_stor.max()) + np.log(1e3)
    with np.errstate(over='ignore', invalid='ignore'):
        result = minimize(
            fun=_prony_objective,
            x0=x0,
            args=(z_fit, R_fit, smoothness_scaled, solid),
            jac=True,
            method='L-BFGS-B',
            bounds=[(None, ub)] * m,
        )
    E_i = np.exp(result.x)
    if not return_fit_quality:
        return tau_i, E_i

    if np.any(result.x >= ub):
        # The optimum sits on the log-space bound, so grad(V) != 0 there and the
        # Laplace expansion behind neg_log_posterior does not apply. The misfit
        # and the roughness need no stationarity, so both are still reported;
        # the reduced residual is already a full-problem quantity.
        resid = (z - R @ E_i)
        return tau_i, E_i, _FitQuality(
            resid @ resid / dof if dof > 0 else None,
            None,
            _mean_sq_curvature(_log_curvature(result.x, solid), N, log_range),
        )

    quality = _prony_fit_quality(
        result.x, z, R, smoothness, solid,
        n_resid=n_res,
        log_range=log_range,
    )
    return tau_i, E_i, quality
