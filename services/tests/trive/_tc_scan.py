"""
Shared checks for the hybrid Tc search tests (test_coefficient_fits,
test_routes_e2e): the search's grid and objective, rebuilt from
fit_hybrid_coefficients at fixed Tc, and the properties a searched result must
have against that scan. Underscore-prefixed so it is never collected as a test
module.
"""
import os
os.environ['OPENBLAS_NUM_THREADS'] = '1'
import sys
import numpy as np

# Append the directory above 'tests' to sys.path to find the 'app' module
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))

from app.trive.calibration import fit_hybrid_coefficients
from app.trive.shift import hybrid_shift

# Room for a search that reaches a candidate by another solver path: relative,
# plus the solver's floor on noiseless data, where the objective is roundoff.
OBJECTIVE_SLACK = 1e-6
OBJECTIVE_FLOOR = 1e-16


def chi2_sum(T, a_T, TC, C1, C2, Ea, a_T_ref, sigma_a_T=None):
    """Sigma-weighted chi-squared sum of a hybrid curve in log10(a_T), with
    the fit's unit sigma when there is no Error column."""
    resid = (np.log10(hybrid_shift(T, TC, C1, C2, Ea)) + np.log10(a_T_ref)
             - np.log10(a_T))
    if sigma_a_T is not None:
        resid = resid * a_T * np.log(10.0) / sigma_a_T
    return float(resid @ resid)


def candidate_grid(T):
    """The measured temperatures with two points on either side of them
    (T <= Tc is cold), ascending."""
    return np.sort(T)[1:len(T) - 2]


def grid_neighbours(T, TC):
    """(low, high) ends of the refinement interval around candidate TC: the
    adjacent candidates, however they scored, or TC itself at an end of the
    grid."""
    grid = candidate_grid(T)
    i = int(np.flatnonzero(grid == TC)[0])
    return float(grid[max(i - 1, 0)]), float(grid[min(i + 1, len(grid) - 1)])


def scan_candidates(T, a_T, sigma_a_T=None, **hold):
    """(objective, Tc) of each candidate, best first, skipping candidates whose
    fit raises."""
    scan = []
    for TC in candidate_grid(T):
        try:
            C1, C2, Ea, a_T_ref = fit_hybrid_coefficients(
                T, a_T, TC, sigma_a_T=sigma_a_T, **hold)
        except (ValueError, RuntimeError):
            continue
        objective = chi2_sum(T, a_T, TC, C1, C2, Ea, a_T_ref, sigma_a_T)
        scan.append((objective, float(TC)))
    return sorted(scan)


def assert_search_properties(test, T, a_T, result, sigma_a_T=None, **hold):
    """A searched (TC, C1, C2, Ea, a_T_ref, chi2_reduced) lies between the best
    candidate's grid neighbours, beats or ties every candidate, keeps two
    points on either side, and reports chi-squared with Tc counted as a free
    parameter."""
    TC, C1, C2, Ea, a_T_ref, chi2_reduced = result
    best, best_TC = scan_candidates(T, a_T, sigma_a_T, **hold)[0]
    low, high = grid_neighbours(T, best_TC)
    objective = chi2_sum(T, a_T, TC, C1, C2, Ea, a_T_ref, sigma_a_T)

    test.assertGreaterEqual(TC, low)
    test.assertLessEqual(TC, high)
    test.assertLessEqual(
        objective, best * (1.0 + OBJECTIVE_SLACK) + OBJECTIVE_FLOOR)
    test.assertGreaterEqual(int(np.sum(T <= TC)), 2)
    test.assertGreaterEqual(int(np.sum(T > TC)), 2)

    n_free = 5 - sum(bool(hold.get(f'fix_{name}'))
                     for name in ('C1', 'C2', 'Ea'))
    dof = len(T) - n_free
    if dof <= 0:
        test.assertIsNone(chi2_reduced)
    else:
        np.testing.assert_allclose(
            chi2_reduced, objective / dof, rtol=1e-9, atol=1e-12)

    for name, value in (('C1', C1), ('C2', C2), ('Ea', Ea)):
        if hold.get(f'fix_{name}'):
            test.assertEqual(value, hold[name])
    if not hold.get('fix_Ea'):
        test.assertGreaterEqual(Ea, 100.0)
        test.assertLessEqual(Ea, 400.0)
