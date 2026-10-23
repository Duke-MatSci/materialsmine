"""
Shared helpers for the Tri-VE grid-suggestion tests (test_update_line_chart,
test_grid_suggestion_recall). Underscore-prefixed so it is never collected.

The oracle, exact_probe_terms, is what the suggestion is scored against: the
exact-Hessian MacKay effective-terms count of a flat-seed smoothed fit on the
probe grid reduction.prony_resolution uses. Live code never computes it.
"""
import os
os.environ['OPENBLAS_NUM_THREADS'] = '1'
import sys
from unittest.mock import patch

import numpy as np
from scipy.linalg import cho_solve

# Append the directory above 'tests' to sys.path to find the 'app' module
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))

from app.trive import fit as fit_module
from app.trive.chart import update_line_chart
from app.trive.objective import (
    _penalty_gram, _penalty_trace, _scaled_smoothness,
)
from app.trive.quality import _cholesky_or_none
from app.trive.reduction import _probe_reduce


SUGGESTION = ('if the error profile is accurate, the data can support more '
              'terms; try a relaxation grid size of ')

# The oracle's Newton budget, in seconds: well above production's 1 s so the
# slowest bundled fits (agilus30 master curve at low smoothness) are scored.
ORACLE_BUDGET = 10.0


def suggestions(fig):
    """Grid-suggestion captions stamped on fig."""
    return [a.text for a in fig.layout.annotations
            if a.text and a.text.startswith(SUGGESTION)]


def fires(result):
    """Whether update_line_chart's result carries the suggestion on both
    complex figures."""
    return bool(suggestions(result[0])) and bool(suggestions(result[1]))


def run_chart(uploadData, N, smoothness, relative_error, domain='frequency',
              **kwargs):
    """
    One update_line_chart call with its fit recorded.

    Returns:
        tuple: (result, fit kwargs, grid size the fit ran with).
    """
    fits = []

    def recording_fit(*args, **fit_kwargs):
        out = fit_module.smooth_prony_fit(*args, **fit_kwargs)
        fits.append((fit_kwargs, out))
        return out

    with patch('app.trive.chart.smooth_prony_fit', side_effect=recording_fit):
        result = update_line_chart(
            uploadData, number_of_prony=N, smoothness=smoothness,
            fit_settings=False, domain=domain,
            relative_error=relative_error, **kwargs,
        )
    (fit, (tau_i, _, _)), = fits
    return result, fit, len(tau_i)


def exact_probe_terms(fit, smoothness):
    """
    The oracle: MacKay's effective-terms count, from the exact Hessian, of a
    flat-seed smoothed fit on the probe grid, for the arrays in `fit` (the
    kwargs smooth_prony_fit received).

    Returns:
        float or None: None when the solve times out under ORACLE_BUDGET,
        diverges, or ends at a Hessian that is not positive definite.
    """
    omega, E_stor = fit['omega'], fit['E_stor']
    tau_p, R, z = _probe_reduce(
        omega, E_stor, fit['E_loss'], fit['E_stor_std'], fit['E_loss_std'],
        True, fit['std_scale'])
    P = len(tau_p)
    m = P + 1
    R, z = R[:m], z[:m]
    lam_sqrt = _scaled_smoothness(
        smoothness, P, 2 * len(omega) - m, np.log(tau_p[-1] / tau_p[0]))
    problem = fit_module._PlateauProjectedProblem(
        z, R, lam_sqrt, np.log(E_stor.max()) + np.log(1e3))
    try:
        with fit_module._newton_watchdog(ORACLE_BUDGET), \
                np.errstate(over='ignore', invalid='ignore'):
            res = fit_module._restarting_minimize(
                fun=problem.fun, x0=np.full(P, np.log(E_stor.max() / m)),
                jac=problem.jac,
                hess=fit_module._shifted_hessian(
                    problem.hess, fit_module._NEWTON_HESSIAN_SHIFT_EPS),
                method='trust-exact')
    except (fit_module._NewtonBudgetExceeded, ValueError):
        return None
    c = problem.coefficients(res.x)
    solid = c[0] > 0
    if not solid:
        # Clamped plateau: score the solid=False problem it converged on.
        R, c = R[:, 1:], c[1:]
    k = len(c)
    H = ((R.T @ R) * c * c[:, None] + np.diag(c * (R.T @ (R @ c - z)))
         + lam_sqrt ** 2 * _penalty_gram(k, solid))
    chol = _cholesky_or_none(H)
    if chol is None:
        return None
    H_inv = cho_solve((chol, True), np.eye(k))
    return float(P - lam_sqrt ** 2 * _penalty_trace(H_inv, solid))
