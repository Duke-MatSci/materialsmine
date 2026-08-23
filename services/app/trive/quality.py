"""
Scoring a converged Prony fit: the numbers the figure captions report.

Reads the objective it is scoring from `objective` rather than restating it, so
the penalty convention cannot drift between the fit and its score. `fit` is the
only caller; `figures._annotate_fit_quality` formats what comes out.
"""

from collections import namedtuple

import numpy as np

from .objective import (
    _log_curvature,
    _mean_sq_curvature,
    _PronyLoss,
    _scaled_smoothness,
)


# Fit-quality readout for a converged smooth_prony_fit. chi2_reduced is the data
# misfit alone; neg_log_posterior is the Laplace-approximated negative log
# posterior of lam = smoothness**2; curvature is the roughness of the fitted log
# spectrum. All three are "lower is better", and any may be None — see
# _prony_fit_quality for the conditions.
#
# chi2_reduced and curvature are the two coordinates of the classical L-curve:
# sweep smoothness, plot one against the other, and the corner nearest the
# lower left is the regularization trade-off worth taking. Both are means, not
# sums — chi2_reduced per degree of freedom, curvature per unit ln(tau) — so
# the pair stays comparable across upload size, across N, and across crops of
# the same data. curvature is deliberately the UNWEIGHTED roughness rather than
# the lam-weighted penalty term, so that it does not move with the knob being
# swept.
#
# curvature is mean (d2 lnE / d(ln tau)**2)**2, NOT the mean squared second
# DIFFERENCE: see _mean_sq_curvature for why the distinction decides whether
# the number survives a change of N. Its square root is an RMS bend in nepers
# per (ln tau)**2.
_FitQuality = namedtuple(
    '_FitQuality', 'chi2_reduced neg_log_posterior curvature'
)


def _cholesky_or_none(H: np.ndarray):
    """
    Cholesky factor of H, or None if H is not a positive-definite finite matrix.

    Cholesky succeeding IS the positive-definiteness test, i.e. the test that a
    candidate optimum is a local minimum at all — slogdet's sign is +1 for an
    indefinite H with two negative eigenvalues, and eigvalsh costs 10-30x. It
    does NOT raise on NaN/Inf, it returns a NaN factor, and smooth_prony_fit
    runs minimize under errstate(invalid='ignore'), so an overflowed coefficient
    would otherwise escape as a NaN score.

    Parameters:
        H (numpy.ndarray): 2-D symmetric matrix.

    Returns:
        numpy.ndarray or None: the lower-triangular factor, or None.
    """
    try:
        chol = np.linalg.cholesky(H)
    except np.linalg.LinAlgError:
        return None
    return chol if np.all(np.isfinite(chol)) else None


def _prony_fit_quality(
        logcoefs: np.ndarray,
        data: np.ndarray,
        basis: np.ndarray,
        smoothness: float,
        solid: bool,
        n_resid: int,
        log_range: float,
) -> _FitQuality:
    """
    Score a converged Prony fit: reduced chi-squared and the log posterior of lam.

    The second number is a Laplace (saddle-point) approximation of

        log pi_lam = -V(H) + 0.5 * (log|A| + n_tau * log(lam))
                     + 0.5 * m * log(2 pi) - 0.5 * log|Hess V| - lam0

    with H = logcoefs, lam = _scaled_smoothness(smoothness, ...)**2,
    V = rho^2 + lam * eta^2 (the _PronyLoss loss), A = L.T @ L for the
    second-difference operator L behind the penalty, and Hess V the exact
    second derivative 2 * (lam * A + J.T @ J + diag(r.T @ J)) — taken straight
    from _PronyLoss.hess, the same array the Newton solver in fit converges
    on, so there is no separate curvature convention here to drift from it
    (an older form of this function carried C = 0.5 * Hess V and a matching
    pi-for-2pi in the constants). The trailing -lam0 is a unit-rate
    exponential prior, charged against the UNSCALED lam0 = smoothness**2: the
    prior belongs on the user-facing knob, not on the internally normalized
    weight, which would punish a large or finely-gridded upload far harder than
    a small one for identical physical smoothing and so undo the very
    normalization _scaled_smoothness applies.

    Two details that are easy to get wrong:

    * A is singular. L is the (npen - 2) x m second-difference stencil, so A has
      a null space of dimension 2 + solid (a constant, a linear ramp, and the
      unpenalized equilibrium term). The determinant the formula needs is the
      PSEUDO-determinant, and the exponent of lam is rank(A) = npen - 2, not
      n_tau. Inflating that exponent to the full dimension adds a spurious
      0.5 * (m - rank) * log(lam) drift that biases the result toward
      oversmoothing. Conveniently pdet(L.T @ L) == det(L @ L.T) ==
      npen**2 * (npen**2 - 1) / 12 exactly, so no decomposition of A is needed.
    * The null directions carry a flat prior whose normalizer, together with the
      Laplace prefactor and the Gaussian normalizer of the penalty over its
      rank(A) directions, contributes a constant 0.5 * (m * log(2) + (2 + solid)
      * log(pi)). It is included, so the result is comparable across
      smoothness, N, row count, AND solid.

    This is an approximation, not an identity — expect ~0.1 nat of Laplace error
    — and it assumes logcoefs is a CONVERGED, INTERIOR minimum of V. At a
    non-stationary point the expansion has an unaccounted linear term.

    Expects the QR-REDUCED system from smooth_prony_fit (basis=R, data=z), which
    the route's N <= 100 cap bounds at ~102 rows; peak allocation is then two
    m x m arrays. That system is already weighted by 1/std, so residuals here are
    unweighted — see _prony_objective — and it carries the orthogonal residual
    the fit cannot reach as its own row, so both numbers come out on the
    full-problem scale and stay comparable across N with nothing to add back.

    Parameters:
        logcoefs (numpy.ndarray): 1-D array of log-coefficients at the optimum.
        data (numpy.ndarray): 1-D array of target values, pre-weighted.
        basis (numpy.ndarray): 2-D basis matrix, pre-weighted to match data;
            basis @ exp(logcoefs) is the model.
        smoothness (float): The user-facing knob, UNSCALED. The weight the
            fit ran with is rebuilt here through _scaled_smoothness, whose other
            three inputs (npen, dof, log_range) are all already on hand — so
            lam * A matches the fitted V by construction rather than by the
            caller remembering which of two values to pass where.
        solid (bool): Whether the leading coefficient is an equilibrium term
            excluded from the smoothness penalty.
        n_resid (int): Residual count of the FULL problem (2 * len(omega)), used
            for the chi-squared degrees of freedom. It cannot be read off `data`,
            whose length is the reduced m + 1 for any upload size.
        log_range (float): ln(tau_max / tau_min) of the fit grid, for the
            curvature normalization. Also unavailable from the reduced system.

    Returns:
        _FitQuality: (chi2_reduced, neg_log_posterior, curvature), all floats and
        all "lower is better". chi2_reduced is None when the fit has no degrees
        of freedom left; neg_log_posterior is None when the posterior is
        undefined (no penalty, or fewer than 3 penalized terms) or when the
        Laplace expansion does not apply (Hess V not positive definite, or
        non-finite); curvature is None when fewer than 3 penalized terms leave
        no second difference to take. The two reported quantities are means —
        chi-squared per degree of freedom, squared log-spectrum curvature per
        unit ln(tau) — while the algebra below works in raw sums, so every
        normalization happens once, at the single return.
    """
    m = len(logcoefs)
    npen = m - solid
    # Data misfit only — the smoothness penalty is not part of chi-squared.
    # Regularization means the effective parameter count is below m, so this
    # dof understates nu and chi2_reduced reads as an upper bound.
    dof = n_resid - m

    # The weight the fit was actually run with, so that V and its Hessian below
    # belong to the fit that ran. Falls back to the raw knob when the penalty
    # is empty (npen < 3), which is harmless: the penalty is then identically
    # zero and no posterior is computed.
    scaled = _scaled_smoothness(smoothness, npen, dof, log_range)
    # One _PronyLoss, one evaluation of the shared intermediates: the residual
    # for chi-squared, V, and the Hessian all come from it, so the misfit, the
    # mode and the curvature cannot drift apart from one another or from what
    # the Newton solver in fit converged on.
    loss = _PronyLoss(data, basis, scaled, solid)
    resid = loss.residual(logcoefs)
    chi2 = resid @ resid

    # Roughness of the fitted log spectrum, independent of the penalty weight:
    # the other L-curve coordinate. Available whenever a second difference
    # exists, including at smoothness == 0 where there is no posterior.
    curve = _log_curvature(logcoefs, solid)

    # No penalty (lam = 0 -> log(lam) = -inf) or too few penalized terms for a
    # second difference to exist means there is no prior on lam to be posterior
    # about. npen < 3 would also reach log(npen - 1) = log(0) below.
    neg_log_posterior = None
    if len(curve) and smoothness:
        # Note V is NOT a marginal likelihood: it is the unnormalized negative
        # log JOINT density at the mode (misfit+penalty). hess() returns a
        # fresh array, so nothing cached is at stake in the factorization.
        V = loss.fun(logcoefs)
        chol = _cholesky_or_none(loss.hess(logcoefs))
        if chol is not None:
            logdet_hess = 2 * np.log(np.diag(chol)).sum()
            logpdetA = (
                2 * np.log(npen) + np.log(npen - 1) + np.log(npen + 1)
                - np.log(12.0)
            )
            # abs(): the penalty is sign-agnostic in smoothness (it enters
            # squared) and nothing upstream rejects a negative value. The
            # scale factor is positive, so it carries that sign through.
            loglam = 2 * np.log(abs(scaled))
            # Negated so that lower is better. This is a log DENSITY, so
            # positivity is not guaranteed — it holds in practice because V
            # dominates for any real upload. Deliberately not clamped.
            neg_log_posterior = (
                V
                - 0.5 * (logpdetA + (npen - 2) * loglam - logdet_hess)
                - 0.5 * (m * np.log(2.0) + (2 + solid) * np.log(np.pi))
                + smoothness * smoothness
            )

    return _FitQuality(
        chi2 / dof if dof > 0 else None,
        neg_log_posterior,
        _mean_sq_curvature(curve, npen, log_range),
    )
