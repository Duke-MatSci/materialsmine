"""
Prony-series core math: basis construction, the relaxation grid, the forward
transforms (complex modulus / relaxation modulus / relaxation spectrum), the
fit objective, the smooth Prony fit, and the argmax peak helper.

Pure functions — no Flask app, and no disk access beyond the bundled master
curves TestSurprisalOnBundledMasterCurves reads — so this is the fastest subset
and the one to run while iterating on the Prony math.

    python -m unittest tests.trive.test_prony
"""
import unittest
import os
os.environ['OPENBLAS_NUM_THREADS'] = '1'
import sys
import json
from unittest import mock
import numpy as np
import pandas as pd
import scipy.linalg
from scipy.optimize import minimize, minimize_scalar, nnls

# Append the directory above 'tests' to sys.path to find the 'app' module
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))

import app.trive.reduction as reduction
import app.trive.objective as objective
import app.trive.fit as prony_fit
from app.trive.prony import (
    prony_basis,
    prony_relaxation_space,
    prony_terms_for_span,
    PRONY_TERMS_MIN,
    PRONY_TERMS_MAX,
    compute_complex,
    compute_relaxation_modulus,
)
from app.trive.objective import (
    _PronyLoss,
    _prony_hessian,
    _prony_objective,
    _scaled_smoothness,
)
from app.trive.reduction import _prony_reduce
from app.trive.quality import _FitQuality, _prony_fit_quality
from app.trive.fit import smooth_prony_fit, _PlateauProjectedProblem
from app.trive.calibration import argmax_peak
from app.trive.figures import _build_coef_records
from app.trive.uncertainty import _SIGMA_DISPLAY_CAP
from app.config import Config
from app.utils.util import upload_init


# Arbitrary positive log-tau span for the algebraic _prony_fit_quality tests,
# which build random bases rather than real relaxation grids. Both the curvature
# normalization and _scaled_smoothness read it, so every helper and test in that
# group has to use the SAME value or they stop describing one fit.
LOG_RANGE = float(np.log(1e6))

TAU = np.array([0.1, 1.0, 10.0])
# Coefficient magnitudes within a decade of each other and of max(E_stor)/m,
# the solver's flat seed, so the round-trip recovery test in
# TestSmoothPronyFit converges from it.
VISCOUS_E = np.array([1000.0, 2000.0, 3000.0])
SOLID_E = np.array([500.0, 1000.0, 2000.0, 3000.0])  # one extra leading equilibrium term


class TestPronyBasis(unittest.TestCase):
    def test_shape_solid_false(self):
        freq = np.array([1.0, 2.0, 3.0])
        tau = np.array([0.1, 1.0])
        result = prony_basis(freq, tau, solid=False)
        self.assertEqual(result.shape, (6, 2))

    def test_shape_solid_true(self):
        freq = np.array([1.0, 2.0, 3.0])
        tau = np.array([0.1, 1.0])
        result = prony_basis(freq, tau, solid=True)
        self.assertEqual(result.shape, (6, 3))

    def test_values_at_omega_tau_unity(self):
        # ωτ = 1 → storage = loss = 1/2 exactly.
        freq = np.array([1.0])
        tau = np.array([1.0])
        result = prony_basis(freq, tau, solid=False)
        self.assertEqual(result.tolist(), [[0.5], [0.5]])

    def test_values_at_zero_frequency(self):
        # ω = 0 → storage = loss = 0 exactly.
        freq = np.array([0.0, 0.0])
        tau = np.array([1.0, 2.0])
        result = prony_basis(freq, tau, solid=False)
        np.testing.assert_array_equal(result, np.zeros((4, 2)))

    def test_solid_prepends_one_and_zero_columns(self):
        freq = np.array([2.0, 3.0])
        tau = np.array([1.0, 5.0])
        result = prony_basis(freq, tau, solid=True)
        # Top half (storage): first column is ones.
        np.testing.assert_array_equal(result[:2, 0], np.ones(2))
        # Bottom half (loss): first column is zeros.
        np.testing.assert_array_equal(result[2:, 0], np.zeros(2))

    def test_matches_direct_formula_over_a_grid(self):
        # The blocks are built in place in one preallocated array, each ufunc
        # overwriting an operand of the last. Check every cell against the
        # textbook dt²/(1+dt²), dt/(1+dt²) over a range where that form is safe,
        # so any aliasing between the storage and loss halves shows up.
        freq = np.logspace(-4, 4, 37)
        tau = np.logspace(-3, 3, 11)
        result = prony_basis(freq, tau, solid=True)
        dt = np.outer(freq, tau)
        n = len(freq)
        np.testing.assert_allclose(result[:n, 1:], dt ** 2 / (1 + dt ** 2), rtol=1e-14)
        np.testing.assert_allclose(result[n:, 1:], dt / (1 + dt ** 2), rtol=1e-14)

    def test_basis_is_fortran_ordered_with_unchanged_values(self):
        """The basis comes back column-major, so each column's ufunc pass is
        one contiguous run, and its values are bit-identical to the
        reciprocal forms computed elementwise."""
        freq = np.logspace(-4, 4, 37)
        tau = np.logspace(-3, 3, 11)
        dt = np.multiply.outer(freq, tau)
        with np.errstate(over='ignore', divide='ignore'):
            inv = 1.0 / dt
            ep = 1.0 / (1.0 + inv * inv)
            epp = 1.0 / (dt + inv)
        relax = np.vstack((ep, epp))
        n = len(freq)
        eq = np.concatenate((np.ones(n), np.zeros(n)))[:, None]
        for solid, expected in ((False, relax),
                                (True, np.hstack((eq, relax)))):
            with self.subTest(solid=solid):
                result = prony_basis(freq, tau, solid=solid)
                self.assertTrue(result.flags.f_contiguous)
                np.testing.assert_array_equal(result, expected)

    def test_rejects_non_ndarray_freq(self):
        with self.assertRaises(AssertionError):
            prony_basis([1.0, 2.0], np.array([1.0]), solid=False)

    def test_rejects_non_ndarray_relaxations(self):
        with self.assertRaises(AssertionError):
            prony_basis(np.array([1.0]), [1.0], solid=False)

    def test_rejects_2d_freq(self):
        with self.assertRaises(AssertionError):
            prony_basis(np.array([[1.0], [2.0]]), np.array([1.0]), solid=False)

    def test_rejects_2d_relaxations(self):
        with self.assertRaises(AssertionError):
            prony_basis(np.array([1.0]), np.array([[1.0]]), solid=False)

    def test_extreme_omega_tau_stays_finite(self):
        # A wide TTSP shift can push ωτ past the float64 range. The old
        # dt²/(1+dt²) form overflowed to inf, then inf/inf → NaN; the stable
        # form must stay finite everywhere, with storage → 1 and loss → 0 as
        # ωτ → ∞ and both → 0 as ωτ → 0.
        # ωτ up to 1e300 keeps the np.outer product finite while dt² (1e600)
        # overflows inside prony_basis — exactly the path the stable form guards.
        freq = np.array([1e-150, 1.0, 1e150])
        tau = np.array([1.0, 1e150])
        result = prony_basis(freq, tau, solid=False)
        self.assertTrue(np.all(np.isfinite(result)),
                        "prony_basis produced non-finite values for extreme ωτ")
        n = len(freq)  # rows 0..n-1 = storage, n..2n-1 = loss; [i, j] uses freq[i]*tau[j]
        # huge ωτ (1e150 · 1e150): storage → 1, loss → 0
        self.assertAlmostEqual(result[2, 1], 1.0, places=6)
        self.assertAlmostEqual(result[n + 2, 1], 0.0, places=6)
        # tiny ωτ (1e-200 · 1.0): storage → 0, loss → 0
        self.assertAlmostEqual(result[0, 0], 0.0, places=6)
        self.assertAlmostEqual(result[n + 0, 0], 0.0, places=6)


class TestPronyRelaxationSpace(unittest.TestCase):
    def test_length(self):
        result = prony_relaxation_space(1e-3, 1e3, 7)
        self.assertEqual(len(result), 7)

    def test_endpoints(self):
        result = prony_relaxation_space(1e-3, 1e3, 5)
        np.testing.assert_allclose(result[0], 1e-3)
        np.testing.assert_allclose(result[-1], 1e3)


class TestPronyTermsForSpan(unittest.TestCase):
    """
    prony_terms_for_span sizes the series from the span it will be fitted over.
    Row counts below are chosen to leave the point-count ceiling slack unless a
    test is specifically exercising it.
    """

    def test_terms_per_decade(self):
        # 10 decades, 200 points: well clear of both ceilings.
        omega = np.logspace(-4, 6, 200)
        self.assertEqual(prony_terms_for_span(omega), 30)

    def test_rounds_to_nearest_term(self):
        # 3.5 decades * 3 = 10.5 terms.
        omega = np.logspace(0, 3.5, 200)
        self.assertEqual(prony_terms_for_span(omega), 10)

    def test_narrow_span_holds_at_the_floor(self):
        omega = np.logspace(0, 0.2, 200)  # 0.6 terms
        self.assertEqual(prony_terms_for_span(omega), PRONY_TERMS_MIN)

    def test_broad_span_holds_at_the_route_limit(self):
        omega = np.logspace(-20, 20, 500)  # 120 terms
        self.assertEqual(prony_terms_for_span(omega), PRONY_TERMS_MAX)

    def test_point_count_ceiling_beats_the_span(self):
        # 12 decades wants 36 terms, but 13 complex points cannot carry more
        # than 12 (the 13th parameter is the equilibrium term).
        omega = np.logspace(0, 12, 13)
        self.assertEqual(prony_terms_for_span(omega), 12)

    def test_point_count_ceiling_beats_the_floor(self):
        # Fewer points than PRONY_TERMS_MIN: the ceiling is a hard limit, the
        # floor only a preference, so the ceiling wins.
        omega = np.logspace(0, 6, 4)
        self.assertEqual(prony_terms_for_span(omega), 3)

    def test_leaves_positive_degrees_of_freedom(self):
        # The point of the ceiling: nu = 2 * len(omega) - (N + 1) must stay
        # positive or _prony_fit_quality has no chi-squared to report.
        for n in (2, 3, 5, 13, 40, 200):
            omega = np.logspace(-6, 6, n)
            N = prony_terms_for_span(omega)
            self.assertGreater(2 * n - (N + 1), 0, f"no dof left at {n} points")

    def test_degenerate_span_falls_back_to_the_floor(self):
        # A single distinct frequency has no decades to count, but the caller
        # still needs a usable grid.
        omega = np.full(50, 3.0)
        self.assertEqual(prony_terms_for_span(omega), PRONY_TERMS_MIN)

    def test_single_row_stays_positive(self):
        # len(omega) - 1 == 0 would leave an empty relaxation grid.
        self.assertEqual(prony_terms_for_span(np.array([1.0])), 1)


class TestComputeComplex(unittest.TestCase):
    def test_shape_and_columns_viscous(self):
        result = compute_complex(TAU, VISCOUS_E)
        self.assertIsInstance(result, pd.DataFrame)
        self.assertEqual(len(result), 1000)
        self.assertListEqual(list(result.columns), ['Frequency', 'E Storage', 'E Loss'])

    def test_shape_and_columns_solid(self):
        result = compute_complex(TAU, SOLID_E)
        self.assertIsInstance(result, pd.DataFrame)
        self.assertEqual(len(result), 1000)
        self.assertListEqual(list(result.columns), ['Frequency', 'E Storage', 'E Loss'])

    def test_num_pts_kwarg(self):
        result = compute_complex(TAU, VISCOUS_E, num_pts=50)
        self.assertEqual(len(result), 50)

    def test_storage_modulus_monotonic_in_frequency(self):
        # Positive E_i, no equilibrium term → storage modulus is non-decreasing in ω.
        result = compute_complex(TAU, VISCOUS_E)
        self.assertTrue(np.all(np.diff(result['E Storage'].values) >= -1e-12))

    def test_rejects_non_ndarray_tau(self):
        with self.assertRaises(AssertionError):
            compute_complex([0.1, 1.0, 10.0], VISCOUS_E)

    def test_rejects_non_ndarray_E(self):
        with self.assertRaises(AssertionError):
            compute_complex(TAU, [1.0, 2.0, 3.0])

    def test_rejects_2d_tau(self):
        with self.assertRaises(AssertionError):
            compute_complex(TAU.reshape(1, -1), VISCOUS_E)

    def test_rejects_2d_E(self):
        with self.assertRaises(AssertionError):
            compute_complex(TAU, VISCOUS_E.reshape(1, -1))

    def test_default_extension_is_the_classic_window_bit_for_bit(self):
        """extend_decades=0 (the default) evaluates on exactly the grid
        1/max(tau) .. 1/min(tau) it always has."""
        for E_i in (VISCOUS_E, SOLID_E):
            omega = np.logspace(-np.log10(np.max(TAU)),
                                -np.log10(np.min(TAU)), 1000)
            solid = len(E_i) != len(TAU)
            real, imag = (prony_basis(omega, TAU, solid) @ E_i).reshape(2, -1)
            for result in (compute_complex(TAU, E_i),
                           compute_complex(TAU, E_i, extend_decades=0.0)):
                np.testing.assert_array_equal(result['Frequency'], omega)
                np.testing.assert_array_equal(result['E Storage'], real)
                np.testing.assert_array_equal(result['E Loss'], imag)

    def test_extend_decades_widens_the_grid_on_both_sides(self):
        """omega spans 10^-d / max(tau) .. 10^d / min(tau), num_pts in all,
        and the moduli are the same series evaluated there."""
        for d in (1.0, 2.5):
            for E_i in (VISCOUS_E, SOLID_E):
                result = compute_complex(TAU, E_i, num_pts=300,
                                         extend_decades=d)
                omega = result['Frequency'].to_numpy()
                self.assertEqual(len(omega), 300)
                np.testing.assert_allclose(
                    omega[[0, -1]],
                    [10 ** -d / np.max(TAU), 10 ** d / np.min(TAU)],
                    rtol=1e-12)
                steps = np.diff(np.log10(omega))
                np.testing.assert_allclose(steps, steps[0], rtol=1e-9)
                solid = len(E_i) != len(TAU)
                real, imag = (prony_basis(omega, TAU, solid) @ E_i
                              ).reshape(2, -1)
                np.testing.assert_allclose(result['E Storage'], real,
                                           rtol=1e-12)
                np.testing.assert_allclose(result['E Loss'], imag,
                                           rtol=1e-12)


class TestComputeRelaxationModulus(unittest.TestCase):
    def test_shape_and_columns_viscous(self):
        result = compute_relaxation_modulus(TAU, VISCOUS_E)
        self.assertIsInstance(result, pd.DataFrame)
        self.assertEqual(len(result), 1000)
        self.assertListEqual(list(result.columns), ['Time', 'E'])

    def test_shape_and_columns_solid(self):
        result = compute_relaxation_modulus(TAU, SOLID_E)
        self.assertEqual(len(result), 1000)
        self.assertListEqual(list(result.columns), ['Time', 'E'])

    def test_num_pts_kwarg(self):
        result = compute_relaxation_modulus(TAU, VISCOUS_E, num_pts=50)
        self.assertEqual(len(result), 50)

    def test_modulus_decreasing_in_time(self):
        # Positive E_i, no equilibrium term → E(t) is non-increasing in t.
        result = compute_relaxation_modulus(TAU, VISCOUS_E)
        self.assertTrue(np.all(np.diff(result['E'].values) <= 1e-12))

    def test_rejects_non_ndarray_tau(self):
        with self.assertRaises(AssertionError):
            compute_relaxation_modulus([0.1, 1.0, 10.0], VISCOUS_E)

    def test_rejects_non_ndarray_E(self):
        with self.assertRaises(AssertionError):
            compute_relaxation_modulus(TAU, [1.0, 2.0, 3.0])

    def test_rejects_2d_tau(self):
        with self.assertRaises(AssertionError):
            compute_relaxation_modulus(TAU.reshape(1, -1), VISCOUS_E)

    def test_rejects_2d_E(self):
        with self.assertRaises(AssertionError):
            compute_relaxation_modulus(TAU, VISCOUS_E.reshape(1, -1))

    def test_default_extension_is_the_classic_window_bit_for_bit(self):
        """extend_decades=0 (the default) evaluates on exactly the grid
        min(tau) .. max(tau) it always has."""
        for E_i in (VISCOUS_E, SOLID_E):
            t = np.logspace(np.log10(np.min(TAU)), np.log10(np.max(TAU)),
                            1000)
            solid = len(E_i) != len(TAU)
            E_eq = E_i[0] if solid else 0.0
            E = E_eq + np.exp(-np.outer(t, 1 / TAU)) @ E_i[solid:]
            for result in (compute_relaxation_modulus(TAU, E_i),
                           compute_relaxation_modulus(TAU, E_i,
                                                      extend_decades=0.0)):
                np.testing.assert_array_equal(result['Time'], t)
                np.testing.assert_allclose(result['E'], E, rtol=1e-12)

    def test_extend_decades_widens_the_grid_on_both_sides(self):
        """t spans min(tau) 10^-d .. max(tau) 10^d, num_pts in all, and E is
        the same series evaluated there."""
        for d in (1.0, 2.5):
            for E_i in (VISCOUS_E, SOLID_E):
                result = compute_relaxation_modulus(TAU, E_i, num_pts=300,
                                                    extend_decades=d)
                t = result['Time'].to_numpy()
                self.assertEqual(len(t), 300)
                np.testing.assert_allclose(
                    t[[0, -1]],
                    [np.min(TAU) * 10 ** -d, np.max(TAU) * 10 ** d],
                    rtol=1e-12)
                steps = np.diff(np.log10(t))
                np.testing.assert_allclose(steps, steps[0], rtol=1e-9)
                solid = len(E_i) != len(TAU)
                E_eq = E_i[0] if solid else 0.0
                np.testing.assert_allclose(
                    result['E'],
                    E_eq + np.exp(-np.outer(t, 1 / TAU)) @ E_i[solid:],
                    rtol=1e-12)

    def test_equilibrium_modulus_is_the_long_time_plateau(self):
        """E(t) = E_eq + sum_i E_i exp(-t / tau_i): far past max(tau) every
        term has decayed and E is E_eq; far before min(tau) none has, and E
        is E_eq + sum(E_i)."""
        result = compute_relaxation_modulus(TAU, SOLID_E, num_pts=200,
                                            extend_decades=6.0)
        E = result['E'].to_numpy()
        E_eq, E_terms = SOLID_E[0], SOLID_E[1:]
        self.assertAlmostEqual(E[-1], E_eq, delta=1e-12 * E_eq)
        # exp(-1e-6) misses 1 by 1e-6 at the first point.
        self.assertAlmostEqual(E[0], E_eq + E_terms.sum(),
                               delta=1e-5 * (E_eq + E_terms.sum()))

    def test_equilibrium_modulus_shifts_the_whole_curve_by_a_constant(self):
        """Prepending E_eq adds exactly E_eq at every t; a clamped E_eq = 0
        gives the curve of the decaying terms alone."""
        viscous = compute_relaxation_modulus(TAU, VISCOUS_E, extend_decades=1.0)
        for E_eq in (0.0, 500.0, 7e4):
            with self.subTest(E_eq=E_eq):
                solid = compute_relaxation_modulus(
                    TAU, np.concatenate(([E_eq], VISCOUS_E)),
                    extend_decades=1.0)
                np.testing.assert_array_equal(solid['Time'], viscous['Time'])
                np.testing.assert_allclose(
                    solid['E'] - viscous['E'], E_eq,
                    atol=1e-12 * (E_eq + VISCOUS_E.sum()))


class TestPronyObjective(unittest.TestCase):
    def setUp(self):
        # Small viscous problem: 10 frequencies, 3 relaxation times.
        self.omega = np.logspace(np.log10(0.5), np.log10(2.0), 10)
        self.tau_i = np.array([0.1, 1.0, 10.0])
        self.basis = prony_basis(self.omega, self.tau_i, solid=False)
        self.logcoefs = np.log(np.array([1.0, 2.0, 3.0]))
        # Construct data so that the model fits exactly at self.logcoefs.
        self.data = self.basis @ np.exp(self.logcoefs)

    def test_returns_scalar_loss_and_gradient_shape(self):
        loss, grad = _prony_objective(
            self.logcoefs, self.data, self.basis,
            smoothness=0.0, solid=False,
        )
        self.assertTrue(np.isscalar(loss) or np.ndim(loss) == 0)
        self.assertEqual(grad.shape, self.logcoefs.shape)

    def test_exact_fit_zero_loss_and_zero_gradient(self):
        loss, grad = _prony_objective(
            self.logcoefs, self.data, self.basis,
            smoothness=0.0, solid=False,
        )
        self.assertEqual(loss, 0.0)
        np.testing.assert_array_equal(grad, np.zeros_like(grad))

    def test_smoothness_penalty_increases_loss(self):
        # Use non-smooth (zig-zag) logcoefs so the second-difference is nonzero.
        logcoefs = np.array([0.0, 5.0, 0.0, 5.0, 0.0])
        tau_i = prony_relaxation_space(0.1, 10.0, 5)
        basis = prony_basis(self.omega, tau_i, solid=False)
        data = np.zeros(basis.shape[0])
        loss_unsmoothed, _ = _prony_objective(
            logcoefs, data, basis, smoothness=0.0, solid=False,
        )
        loss_smoothed, _ = _prony_objective(
            logcoefs, data, basis, smoothness=1.0, solid=False,
        )
        self.assertGreater(loss_smoothed, loss_unsmoothed)

    def test_returns_exactly_loss_and_gradient(self):
        # scipy's jac=True contract is a 2-tuple. An earlier revision appended a
        # third element, which only worked because MemoizeJac happens to index
        # rather than unpack; pin the documented shape.
        result = _prony_objective(
            self.logcoefs, self.data, self.basis,
            smoothness=1.0, solid=False,
        )
        self.assertEqual(len(result), 2)


def _dense_fit_quality(logcoefs, data, basis, smoothness, solid,
                       n_resid, log_range, prior_lam=None):
    """Straightforward dense reference for _prony_fit_quality.

    Materializes L, A, J and C and uses eigvalsh/slogdet — everything the
    production code avoids via a closed-form pseudo-determinant and banded
    in-place accumulation. Takes the same pre-weighted system and the same
    UNSCALED smoothness the production function does, and re-derives the
    lam = smoothness**2 * dof / ((npen - 2) * ell**4) normalization,
    ell = log_range / (npen - 1), independently rather than importing it.
    Returns (chi2, neg_log_posterior, gamma) with the posterior None exactly
    when C is not positive definite, matching the contract. gamma is MacKay's
    npen - lam * tr(A inv(C)) when there is a penalty and C is positive
    definite, else None; chi2 is then per n_resid - (gamma + solid), and per
    the classical n_resid - m otherwise. The likelihood is exp(-V/2),
    so the weighted residuals are unit-variance and the stated errors are
    standard deviations; with C = Hess(V/2) the Laplace prefactor and the
    Gaussian prior's normalizer leave only the (2 + solid) null directions'
    log(2 pi) behind.

    prior_lam exists only here, so one test can show that production charges the
    exponential prior at the unscaled knob rather than at the scaled weight; the
    production signature has no such override.
    """
    m = len(logcoefs)
    npen = m - solid
    dof = n_resid - m
    ell = log_range / (npen - 1)
    lam = smoothness ** 2 * max(dof, 1) / ((npen - 2) * ell ** 4)
    coefs = np.exp(logcoefs)
    resid = data - basis @ coefs
    L = np.zeros((npen - 2, m))
    rows = np.arange(npen - 2)
    L[rows, solid + rows] = 1.0
    L[rows, solid + rows + 1] = -2.0
    L[rows, solid + rows + 2] = 1.0
    A = L.T @ L
    V = resid @ resid + lam * (logcoefs @ A @ logcoefs)
    J = -(basis * coefs)
    C = lam * A + J.T @ J + np.diag(resid @ J)
    if np.linalg.eigvalsh(C).min() <= 0:
        chi2 = (resid @ resid) / dof if dof > 0 else None
        return chi2, None, None
    gamma = None
    nu = dof
    if smoothness:
        # inv(C) is the covariance 2 * inv(Hess V), C being Hess V / 2.
        gamma = npen - lam * np.trace(A @ np.linalg.inv(C))
        nu = n_resid - (gamma + solid)
    chi2 = (resid @ resid) / nu if nu > 0 else None
    eigs = np.linalg.eigvalsh(A)
    nonzero = eigs > eigs.max() * 1e-10
    neg_log_posterior = (
        0.5 * V
        - 0.5 * (np.log(eigs[nonzero]).sum()
                 + nonzero.sum() * np.log(lam)
                 - np.linalg.slogdet(C)[1])
        - 0.5 * (2 + solid) * np.log(2 * np.pi)
        + (smoothness * smoothness if prior_lam is None else prior_lam)
    )
    return chi2, neg_log_posterior, gamma


def _random_fit_problem(rng, N, solid, n_rows=None):
    """Random (basis, data, logcoefs) of the right shapes for N terms.

    basis and data come back already weighted by 1/std, which is the form
    _prony_objective and _prony_fit_quality take — dividing both by the same std
    leaves the residuals, and therefore every score, unchanged.

    The point returned is NOT a minimum, so C is often indefinite there and
    neg_log_posterior legitimately comes back None — fine for shape and
    reference-agreement checks, not for tests that need an actual value.
    """
    m = N + solid
    n = 3 * m + 5 if n_rows is None else n_rows
    basis = np.abs(rng.normal(size=(n, m))) + 0.3
    data = basis @ np.exp(rng.normal(size=m)) + 0.01 * rng.normal(size=n)
    std = np.full(n, 0.04)
    return basis / std[:, None], data / std, rng.normal(size=m) * 0.25


def _dense_half_hessian(x, data, basis, smoothness, solid):
    """C = 0.5 * Hess(V) built the obvious dense way: lam * L.T @ L + J.T @ J
    + diag(r.T @ J). The reference _prony_hessian's banded accumulation and
    in-place scalings are checked against."""
    N = len(x) - solid
    m = len(x)
    coefs = np.exp(x)
    resid = data - basis @ coefs
    L = np.zeros((max(N - 2, 0), m))
    rows = np.arange(max(N - 2, 0))
    L[rows, solid + rows] = 1.0
    L[rows, solid + rows + 1] = -2.0
    L[rows, solid + rows + 2] = 1.0
    J = -(basis * coefs)
    return smoothness * smoothness * (L.T @ L) + J.T @ J + np.diag(resid @ J)


def _converged_fit_problem(rng, N=10, smoothness=1.0):
    """A well-posed problem minimized to convergence.

    The Laplace approximation assumes a stationary point, so tests that need a
    real neg_log_posterior must evaluate at a genuine minimum rather than at an
    arbitrary point. Errors are set to the noise actually injected, which puts
    reduced chi-squared near 1. basis and data come back weighted by 1/std, the
    form the scoring functions take.

    smoothness is the user-facing knob, and the minimize call is given the
    SCALED weight, exactly as smooth_prony_fit does — otherwise the point would
    be stationary for a different V than the one _prony_fit_quality rebuilds
    from the same knob, and the posterior it returned would be meaningless.
    Callers must score with n_resid=2*len(data) and log_range=LOG_RANGE to match.
    """
    omega = np.logspace(-2, 2, 60)
    tau_i = prony_relaxation_space(1 / omega.max(), 1 / omega.min(), N)
    basis = prony_basis(omega, tau_i, True)
    truth = np.exp(np.linspace(2.0, 0.5, N + 1))
    clean = basis @ truth
    std = np.abs(clean) * 0.02
    data = clean + std * rng.normal(size=len(clean))
    basis, data = basis / std[:, None], data / std
    scaled = _scaled_smoothness(smoothness, N, 2 * len(data) - (N + 1), LOG_RANGE)
    result = minimize(
        _prony_objective, np.log(truth),
        args=(data, basis, scaled, True),
        jac=True, method='L-BFGS-B',
    )
    return basis, data, result.x


class TestPronyFitQuality(unittest.TestCase):
    def setUp(self):
        self.rng = np.random.default_rng(4)

    def test_none_posterior_when_smoothness_zero(self):
        # lam = 0 gives log(lam) = -inf: there is no prior on lam to be
        # posterior about. The misfit is still well defined.
        basis, data, x = _random_fit_problem(self.rng, 8, True)
        quality = _prony_fit_quality(
            x, data, basis, 0.0, True, n_resid=2 * len(data), log_range=LOG_RANGE,
        )
        self.assertIsNone(quality.neg_log_posterior)
        self.assertIsNotNone(quality.chi2_reduced)

    def test_none_posterior_when_fewer_than_three_taus(self):
        # A second difference needs 3 penalized terms; npen == 1 would also
        # reach log(npen - 1) = log(0).
        for N in (1, 2):
            with self.subTest(N=N):
                basis, data, x = _random_fit_problem(self.rng, N, True)
                quality = _prony_fit_quality(
                    x, data, basis, 1.5, True, n_resid=2 * len(data), log_range=LOG_RANGE,
                )
                self.assertIsNone(quality.neg_log_posterior)
                self.assertIsNone(quality.curvature)
                self.assertIsNotNone(quality.chi2_reduced)

    def test_curvature_is_the_mean_squared_second_derivative(self):
        # Against an explicit dense L: ||L x||^2 / ((npen - 2) * ell**4), the
        # mean squared d2(lnE)/d(ln tau)**2 over the npen - 2 interior nodes
        # with the leading equilibrium term excluded. The ell**4 is what
        # separates this from the mean squared second DIFFERENCE — see
        # _mean_sq_curvature.
        for N, solid in [(8, 1), (8, 0), (3, 1), (12, 0)]:
            with self.subTest(N=N, solid=solid):
                basis, data, x = _random_fit_problem(self.rng, N, solid)
                m = N + solid
                npen = m - solid
                L = np.zeros((npen - 2, m))
                rows = np.arange(npen - 2)
                L[rows, solid + rows] = 1.0
                L[rows, solid + rows + 1] = -2.0
                L[rows, solid + rows + 2] = 1.0
                Lx = L @ x
                ell = LOG_RANGE / (npen - 1)
                quality = _prony_fit_quality(
                    x, data, basis, 1.0, solid, n_resid=2 * len(data), log_range=LOG_RANGE,
                )
                self.assertAlmostEqual(
                    quality.curvature, Lx @ Lx / ((npen - 2) * ell ** 4),
                    places=12,
                )

    def test_curvature_is_reported_without_smoothing(self):
        # Unlike the posterior, roughness needs no penalty to be defined — it is
        # a property of the coefficients alone. _prony_fit_quality must report
        # it at smoothness == 0 (smooth_prony_fit's nnls shortcut is the one
        # place it cannot, and that is about exact zeros, not about lam).
        basis, data, x = _random_fit_problem(self.rng, 8, True)
        quality = _prony_fit_quality(
            x, data, basis, 0.0, True, n_resid=2 * len(data), log_range=LOG_RANGE,
        )
        self.assertIsNone(quality.neg_log_posterior)
        self.assertIsNotNone(quality.curvature)

    def test_curvature_is_mesh_independent(self):
        # The whole point of the ell**4 in the normalization: sample ONE fixed
        # log-spectrum at several N over the same span and the
        # reported curvature must not move. A per-term mean fails this badly,
        # because sampling a fixed curve more finely shrinks every second
        # difference (d2 ~ ell**2), so it decays like N**-4.
        def spectrum(N):
            x = np.linspace(0.0, LOG_RANGE, N)
            return 3.0 * np.exp(-((x - LOG_RANGE / 2) / (LOG_RANGE / 6)) ** 2)

        reported, per_term = [], []
        for N in (20, 40, 80):
            logcoefs = spectrum(N)
            basis, data, _ = _random_fit_problem(self.rng, N, 0)
            quality = _prony_fit_quality(
                logcoefs, data, basis, 1.0, 0,
                n_resid=2 * len(data), log_range=LOG_RANGE,
            )
            reported.append(quality.curvature)
            curve = np.diff(logcoefs, n=2)
            per_term.append(curve @ curve / len(curve))
        # Mesh-independent to within discretization error: measured 0.195,
        # 0.202, 0.202 against a continuum mean over the span of 0.201, i.e.
        # 2.8% low at N=20 and within 1% from N=40 on.
        self.assertLess(max(reported) / min(reported), 1.10,
                        msg=f'curvature moved with N: {reported}')
        self.assertLess(reported[-1] / reported[-2], 1.02,
                        msg=f'not converging with mesh: {reported}')
        # ...where the quantity it replaced moves by orders of magnitude over
        # the same 4x change in N, which is why it could not be compared.
        self.assertGreater(per_term[0] / per_term[-1], 100)

    def test_curvature_is_exact_for_a_constant_second_derivative(self):
        # H = c * x**2 / 2 + b * x + a has H'' = c at every node, so the mean
        # of H''**2 over the npen - 2 interior nodes is c**2 on any grid; a
        # mean over the node span would read (npen - 2) / (npen - 1) of it,
        # half at npen = 3. Exactness is what makes the readout, and the
        # weight normalized the same way, carry across a crop: the same
        # spectrum on a sub-span at the same spacing, or on a finer grid over
        # the same span, reports the same number.
        c, b, a = 0.7, -1.3, 2.0

        def curvature(x, solid):
            logcoefs = c * x ** 2 / 2 + b * x + a
            if solid:
                logcoefs = np.concatenate([[0.5], logcoefs])
            basis, data, _ = _random_fit_problem(self.rng, len(x), solid)
            return _prony_fit_quality(
                logcoefs, data, basis, 1.0, solid,
                n_resid=2 * len(data), log_range=x[-1] - x[0],
            ).curvature

        for npen in (3, 4, 7, 20, 41):
            for log_range in (np.log(10.0), LOG_RANGE, np.log(1e20)):
                for solid in (0, 1):
                    with self.subTest(npen=npen, log_range=log_range,
                                      solid=solid):
                        x = np.linspace(-0.3, 0.7, npen) * log_range
                        full = curvature(x, solid)
                        np.testing.assert_allclose(full, c ** 2, rtol=1e-9)
                        fine = np.linspace(x[0], x[-1], 2 * npen - 1)
                        np.testing.assert_allclose(
                            curvature(fine, solid), full, rtol=1e-9)
                        if npen > 3:
                            crop = x[(npen - 1) // 2:]
                            np.testing.assert_allclose(
                                curvature(crop, solid), full, rtol=1e-9)

    def test_closed_form_pseudo_determinant_matches_eigendecomposition(self):
        # The production code never builds A; it uses
        # pdet(L.T @ L) == npen**2 * (npen**2 - 1) / 12 and rank == npen - 2.
        # Nothing at runtime cross-checks that, so check it here.
        for npen in range(3, 16):
            for solid in (0, 1):
                with self.subTest(npen=npen, solid=solid):
                    m = npen + solid
                    L = np.zeros((npen - 2, m))
                    rows = np.arange(npen - 2)
                    L[rows, solid + rows] = 1.0
                    L[rows, solid + rows + 1] = -2.0
                    L[rows, solid + rows + 2] = 1.0
                    eigs = np.linalg.eigvalsh(L.T @ L)
                    nonzero = eigs > eigs.max() * 1e-10
                    self.assertEqual(nonzero.sum(), npen - 2)
                    closed_form = (
                        2 * np.log(npen) + np.log(npen - 1)
                        + np.log(npen + 1) - np.log(12.0)
                    )
                    self.assertAlmostEqual(
                        np.log(eigs[nonzero]).sum(), closed_form, places=9,
                    )

    def test_matches_dense_reference(self):
        # Guards the banded L.T @ L accumulation and the in-place coefs
        # scalings against a dense build. N=3 is included deliberately: there
        # the two boundary corrections of L.T @ L collide.
        for N in (3, 4, 8, 20, 40):
            for solid in (0, 1):
                for smoothness in (0.2, 1.7, 11.0):
                    with self.subTest(N=N, solid=solid, smoothness=smoothness):
                        basis, data, x = _random_fit_problem(
                            self.rng, N, solid,
                        )
                        kwargs = dict(n_resid=2 * len(data),
                                      log_range=LOG_RANGE)
                        got = _prony_fit_quality(
                            x, data, basis, smoothness, solid, **kwargs,
                        )
                        chi2, nlp, gamma = _dense_fit_quality(
                            x, data, basis, smoothness, solid, **kwargs,
                        )
                        self.assertAlmostEqual(got.chi2_reduced, chi2, places=9)
                        if gamma is None:
                            self.assertIsNone(got.effective_terms)
                        else:
                            self.assertAlmostEqual(
                                got.effective_terms, gamma, places=9)
                        if nlp is None:
                            self.assertIsNone(got.neg_log_posterior)
                        else:
                            self.assertAlmostEqual(
                                got.neg_log_posterior, nlp,
                                delta=1e-9 * abs(nlp),
                            )

    def test_reference_hessian_matches_finite_differences(self):
        # Validates the reference that test_matches_dense_reference trusts:
        # C must be 0.5 * Hess(V). The second-derivative term diag(r.T @ J) is
        # exact (not Gauss-Newton) because the coefficients are exp(logcoefs).
        for N, solid, smoothness in [(7, 1, 0.9), (12, 0, 2.5), (3, 1, 0.4)]:
            with self.subTest(N=N, solid=solid):
                m = N + solid
                basis, data, x = _random_fit_problem(
                    self.rng, N, solid, n_rows=30,
                )

                def loss_at(point):
                    return _prony_objective(
                        point, data, basis, smoothness, solid,
                    )[0]

                h = 1e-5
                hessian = np.zeros((m, m))
                for i in range(m):
                    for j in range(m):
                        e_i, e_j = np.zeros(m), np.zeros(m)
                        e_i[i] = h
                        e_j[j] = h
                        hessian[i, j] = (
                            loss_at(x + e_i + e_j) - loss_at(x + e_i - e_j)
                            - loss_at(x - e_i + e_j) + loss_at(x - e_i - e_j)
                        ) / (4 * h * h)
                C = _dense_half_hessian(x, data, basis, smoothness, solid)
                np.testing.assert_allclose(
                    C, 0.5 * hessian, rtol=1e-3, atol=1e-4 * np.abs(C).max(),
                )

    def test_prony_hessian_matches_dense_reference(self):
        # The one Hessian the Newton solver steps on and the Laplace score is
        # charged for. N=3 collides the two boundary corrections of L.T @ L;
        # N=2 with solid leaves no second difference at all (empty band).
        for N in (2, 3, 4, 8, 20, 40):
            for solid in (0, 1):
                for smoothness in (0.0, 0.7, 11.0):
                    with self.subTest(N=N, solid=solid, smoothness=smoothness):
                        basis, data, x = _random_fit_problem(
                            self.rng, N, solid,
                        )
                        got = _prony_hessian(x, data, basis, smoothness, solid)
                        want = 2 * _dense_half_hessian(
                            x, data, basis, smoothness, solid,
                        )
                        np.testing.assert_allclose(got, want, rtol=1e-12,
                                                   atol=1e-12 * np.abs(want).max())
                        np.testing.assert_allclose(got, got.T)

    def test_prony_loss_shares_one_evaluation_between_fun_and_hess(self):
        # The solver calls fun, jac and hess separately at each point; the
        # intermediates must be computed once, whichever arrives first. np.exp
        # runs exactly once per fresh evaluation, so it counts evaluations.
        basis, data, x = _random_fit_problem(self.rng, 9, 1)
        loss = _PronyLoss(data, basis, 0.6, True)
        with mock.patch.object(np, 'exp', wraps=np.exp) as exp:
            H = loss.hess(x)
            V = loss.fun(x)
            g = loss.jac(x)
            self.assertEqual(exp.call_count, 1)
            V2, g2 = loss.fun_jac(x.copy())   # equal point, different array
            self.assertEqual(exp.call_count, 1)
        np.testing.assert_array_equal(
            H, _prony_hessian(x, data, basis, 0.6, True))
        V_ref, g_ref = _prony_objective(x, data, basis, 0.6, True)
        self.assertEqual(V, V_ref)
        np.testing.assert_array_equal(g, g_ref)
        self.assertEqual(V2, V_ref)
        np.testing.assert_array_equal(g2, g_ref)

    def test_prony_loss_cache_is_keyed_on_the_point_not_call_order(self):
        # scipy evaluates the loss alone at rejected proposals and the Hessian
        # first at accepted ones, so neither "fun fills, hess reuses" nor the
        # reverse is safe. f(x1), f(x2), H(x1): the Hessian must belong to x1.
        basis, data, x1 = _random_fit_problem(self.rng, 7, 0)
        x2 = x1 + 0.3
        loss = _PronyLoss(data, basis, 1.1, False)
        loss.fun(x1)
        loss.fun(x2)
        np.testing.assert_array_equal(
            loss.hess(x1), _prony_hessian(x1, data, basis, 1.1, False))
        np.testing.assert_array_equal(
            loss.hess(x2), _prony_hessian(x2, data, basis, 1.1, False))

    def test_prony_loss_is_immune_to_the_caller_mutating_x(self):
        # A point is stored by value; editing the caller's array in place
        # must not turn a changed point into a cache hit.
        basis, data, x = _random_fit_problem(self.rng, 6, 1)
        loss = _PronyLoss(data, basis, 0.4, True)
        V1 = loss.fun(x)
        x += 0.5
        V2 = loss.fun(x)
        self.assertEqual(V2, _prony_objective(x, data, basis, 0.4, True)[0])
        self.assertNotEqual(V1, V2)

    def test_prony_loss_returns_fresh_arrays(self):
        # Gradient and Hessian are handed to scipy, which may keep or scale
        # them; they must not alias the cached intermediates or the Gram.
        basis, data, x = _random_fit_problem(self.rng, 6, 1)
        loss = _PronyLoss(data, basis, 0.4, True)
        g = loss.jac(x)
        H = loss.hess(x)
        g[:] = 0
        H[:] = 0
        g2 = loss.jac(x)
        np.testing.assert_array_equal(g2, _prony_objective(x, data, basis, 0.4, True)[1])
        np.testing.assert_array_equal(
            loss.hess(x), _prony_hessian(x, data, basis, 0.4, True))

    def test_prony_hessian_leaves_the_basis_untouched(self):
        # _prony_reduce hands out read-only cached arrays; the in-place
        # scalings must land on the Gram product, never on the input.
        basis, data, x = _random_fit_problem(self.rng, 6, 1)
        basis.setflags(write=False)
        before = basis.copy()
        _prony_hessian(x, data, basis, 0.5, True)
        np.testing.assert_array_equal(basis, before)

    def test_prony_loss_builds_the_penalty_once(self):
        """lam * L.T @ L is built once per loss, on the first Hessian, and
        reused at every later point; a caller mutating a returned Hessian
        must not poison it."""
        # The single build goes through _add_penalty_inplace. allclose, not
        # equality: adding one prebuilt matrix rounds differently from nine
        # band passes.
        basis, data, x1 = _random_fit_problem(self.rng, 9, 1)
        points = (x1, x1 + 0.3, x1 - 0.2)
        loss = _PronyLoss(data, basis, 0.6, True)
        flat = _PronyLoss(data, basis, 0.0, True)
        with mock.patch.object(objective, '_add_penalty_inplace',
                               wraps=objective._add_penalty_inplace) as build:
            loss.fun(x1)
            loss.jac(x1)
            self.assertEqual(build.call_count, 0)
            got = []
            for x in points:
                H = loss.hess(x)
                got.append(H.copy())
                H += 1.0
            self.assertEqual(build.call_count, 1)
            got_flat = [flat.hess(x) for x in points[:2]]
            self.assertEqual(build.call_count, 1)
        for x, H in zip(points, got):
            want = 2 * _dense_half_hessian(x, data, basis, 0.6, True)
            np.testing.assert_allclose(H, want, rtol=1e-12,
                                       atol=1e-12 * np.abs(want).max())
        for x, H in zip(points, got_flat):
            want = 2 * _dense_half_hessian(x, data, basis, 0.0, True)
            np.testing.assert_allclose(H, want, rtol=1e-12,
                                       atol=1e-12 * np.abs(want).max())

    def test_reduced_system_scores_on_the_full_problem_scale(self):
        # The reduction keeps its orthogonal-residual row, so chi2 taken from
        # (R, z) is ALREADY the full problem's misfit — nothing to add back.
        # Score a reduced system and compare against the long-hand weighted
        # residual over every data row.
        omega = np.logspace(-2, 2, 120)
        tau_i = prony_relaxation_space(1 / omega.max(), 1 / omega.min(), 8)
        basis = prony_basis(omega, tau_i, True)
        truth = np.exp(np.linspace(3.0, 1.0, len(tau_i) + 1))
        clean = basis @ truth
        std = np.abs(clean) * 0.05
        y = clean + std * self.rng.normal(size=len(clean))
        n = len(omega)
        R, z = _prony_reduce(omega, y[:n], y[n:], std[:n], std[n:], tau_i, True)

        n_resid = 2 * n
        quality = _prony_fit_quality(
            np.log(truth), z, R, 1.0, True, n_resid=n_resid, log_range=LOG_RANGE,
        )
        resid = (y - clean) / std
        # Per effective degree of freedom (gamma plus the free equilibrium
        # term); the numerator is what this test is about.
        expected = resid @ resid / (n_resid - (quality.effective_terms + 1))
        self.assertAlmostEqual(
            quality.chi2_reduced, expected, delta=1e-9 * expected,
        )

    def test_prior_is_charged_on_the_unscaled_knob(self):
        # lam in the Laplace expansion is the SCALED weight, but the exponential
        # prior is charged at the raw knob: against the scaled lam it would
        # punish a large or finely-gridded upload far harder than a small one
        # for identical physical smoothing, undoing the normalization. Nothing
        # else in the expression separates the two, so pin it here.
        smoothness = 2.0
        basis, data, x = _converged_fit_problem(self.rng, smoothness=smoothness)
        m = basis.shape[1]
        n_resid = 2 * len(data)
        scaled = _scaled_smoothness(smoothness, m - 1, n_resid - m, LOG_RANGE)
        # The test is only meaningful while the two candidates are far apart.
        self.assertGreater(scaled, 2 * smoothness)

        kwargs = dict(n_resid=n_resid, log_range=LOG_RANGE)
        got = _prony_fit_quality(x, data, basis, smoothness, True, **kwargs)
        self.assertIsNotNone(got.neg_log_posterior)
        _, on_knob, _ = _dense_fit_quality(
            x, data, basis, smoothness, True,
            prior_lam=smoothness ** 2, **kwargs)
        _, on_weight, _ = _dense_fit_quality(
            x, data, basis, smoothness, True,
            prior_lam=scaled ** 2, **kwargs)
        self.assertAlmostEqual(got.neg_log_posterior, on_knob,
                               delta=1e-9 * abs(on_knob))
        self.assertAlmostEqual(on_weight - on_knob,
                               scaled ** 2 - smoothness ** 2, places=6)

    def test_surprisal_is_the_laplace_evidence_of_exp_minus_half_V(self):
        # The stated errors are standard deviations, so the likelihood is
        # exp(-rho**2 / 2) and the posterior exp(-V / 2): the same noise level
        # chi2_reduced is judged against. Laplace over exp(-V/2) gives
        # (4 pi)**(m/2) * det(Hess V)**-0.5, and the Gaussian prior's
        # normalizer (lam / 2 pi)**(r/2) * pdet(A)**0.5 cancels all but the
        # (2 + solid) null directions' 2 pi. Rebuilt here from the fit's own
        # reduced system, for both values of solid, since that count differs.
        omega, E_stor, E_loss, std = _broadband_master_curve(600)
        N, smoothness = 20, 0.1
        for solid in (True, False):
            with self.subTest(solid=solid):
                tau_i, E_i, quality = smooth_prony_fit(
                    omega, E_stor, E_loss, E_stor_std=std, E_loss_std=std,
                    N=N, smoothness=smoothness, solid=solid,
                    return_fit_quality=True,
                )
                # Interior optimum, so the full system is the one scored.
                self.assertTrue(np.all(E_i > 0))
                R, z = _prony_reduce(
                    omega, E_stor, E_loss, std, std, tau_i, solid)
                x = np.log(E_i)
                m = N + solid
                r = N - 2
                dof = 2 * len(omega) - m
                lam = _scaled_smoothness(
                    smoothness, N, dof, np.log(tau_i[-1] / tau_i[0])) ** 2
                loss = _PronyLoss(z, R, np.sqrt(lam), solid)
                V = loss.fun(x)
                sign, logdet_hess = np.linalg.slogdet(loss.hess(x))
                self.assertEqual(sign, 1.0)
                logpdetA = np.log(N ** 2 * (N ** 2 - 1) / 12)
                expected = (
                    V / 2
                    - 0.5 * (logpdetA + r * np.log(lam) - logdet_hess)
                    - 0.5 * (m * np.log(2) + (2 + solid) * np.log(2 * np.pi))
                    + smoothness ** 2
                )
                self.assertIsNotNone(quality.neg_log_posterior)
                np.testing.assert_allclose(
                    quality.neg_log_posterior, expected, rtol=1e-9)

    def test_scaled_smoothness_falls_back_when_the_penalty_is_empty(self):
        # Fewer than 3 penalized terms leaves np.diff(..., n=2) empty and a
        # degenerate span leaves ell undefined; the penalty is identically zero
        # either way, so the knob passes through rather than dividing by zero.
        self.assertEqual(_scaled_smoothness(0.4, 2, 100, LOG_RANGE), 0.4)
        self.assertEqual(_scaled_smoothness(0.4, 20, 100, 0.0), 0.4)
        # And the live branch is the smoothness-weight definition,
        # lam = smoothness**2 * dof
        # / ((npen - 2) * ell**4), ell = log_range / (npen - 1), with dof
        # floored at 1.
        ell = LOG_RANGE / 19
        self.assertAlmostEqual(
            _scaled_smoothness(0.4, 20, 100, LOG_RANGE) ** 2,
            0.4 ** 2 * 100 / (18 * ell ** 4), places=12,
        )
        self.assertAlmostEqual(
            _scaled_smoothness(0.4, 20, 0, LOG_RANGE) ** 2,
            0.4 ** 2 / (18 * ell ** 4), places=12,
        )

    def test_none_posterior_when_not_positive_definite(self):
        # C not positive definite means this is not a local minimum, so the
        # Laplace expansion does not apply. Coefficients driven far below the
        # data make diag(r.T @ J), which is O(coefs) and negative, dominate
        # J.T @ J, which is O(coefs**2) — so C picks up negative eigenvalues.
        basis, data, _ = _converged_fit_problem(self.rng)
        x = np.full(basis.shape[1], -10.0)
        quality = _prony_fit_quality(
            x, data, basis, 0.5, True, n_resid=2 * len(data), log_range=LOG_RANGE,
        )
        self.assertIsNone(quality.neg_log_posterior)

    def test_none_posterior_when_coefficients_non_finite(self):
        # np.linalg.cholesky does NOT raise on NaN, it returns a NaN factor, so
        # without the isfinite guard an overflowed coefficient would escape as a
        # NaN score. smooth_prony_fit runs minimize under invalid='ignore'.
        basis, data, x = _random_fit_problem(self.rng, 8, True)
        x[0] = np.inf
        with np.errstate(over='ignore', invalid='ignore'):
            quality = _prony_fit_quality(
                x, data, basis, 0.5, True, n_resid=2 * len(data), log_range=LOG_RANGE,
            )
        self.assertIsNone(quality.neg_log_posterior)

    def test_chi2_none_when_no_degrees_of_freedom(self):
        # A 3-frequency upload gives 6 residuals against m = 21 parameters.
        basis, data, x = _random_fit_problem(self.rng, 20, True, n_rows=6)
        quality = _prony_fit_quality(x, data, basis, 1.0, True, n_resid=6, log_range=LOG_RANGE)
        self.assertIsNone(quality.chi2_reduced)

    def test_penalty_helpers_match_the_dense_operator(self):
        # _add_penalty_inplace and _penalty_trace are the banded forms of
        # lam * L.T @ L and tr(L.T @ L @ sigma). npen == 3 collides the two
        # boundary corrections; npen == 2 leaves the band empty.
        for solid in (True, False):
            for npen in (2, 3, 4, 10):
                with self.subTest(solid=solid, npen=npen):
                    m = npen + solid
                    L = np.zeros((max(npen - 2, 0), m))
                    rows = np.arange(max(npen - 2, 0))
                    L[rows, solid + rows] = 1.0
                    L[rows, solid + rows + 1] = -2.0
                    L[rows, solid + rows + 2] = 1.0
                    A = L.T @ L
                    G = self.rng.normal(size=(m, m))
                    sigma = G @ G.T + np.eye(m)
                    dense = np.trace(A @ sigma)
                    self.assertAlmostEqual(
                        objective._penalty_trace(sigma, solid), dense,
                        delta=1e-12 * (1 + abs(dense)))
                    base = self.rng.normal(size=(m, m))
                    H = base.copy()
                    objective._add_penalty_inplace(H, 0.7, solid)
                    np.testing.assert_allclose(H, base + 0.7 * A,
                                               rtol=0, atol=1e-12)
                    if npen < 3:
                        self.assertEqual(
                            objective._penalty_trace(sigma, solid), 0.0)
                        np.testing.assert_array_equal(H, base)

    def test_chi2_is_per_effective_degree_of_freedom(self):
        # chi2_reduced divides by n_resid - (gamma + 1): the decaying terms
        # count for what the data determined of them (MacKay's gamma =
        # npen - lam * tr(L.T @ L @ Sigma)), the free equilibrium term for
        # one. lam is the weight the fit ran with, which keeps the classical
        # n_resid - m in _scaled_smoothness.
        smoothness, N = 1.0, 10
        basis, data, x = _converged_fit_problem(
            self.rng, N=N, smoothness=smoothness)
        m = N + 1
        n_resid = 2 * len(data)
        quality = _prony_fit_quality(
            x, data, basis, smoothness, True,
            n_resid=n_resid, log_range=LOG_RANGE,
        )
        lam = _scaled_smoothness(smoothness, N, n_resid - m, LOG_RANGE) ** 2
        L = np.zeros((N - 2, m))
        rows = np.arange(N - 2)
        L[rows, 1 + rows] = 1.0
        L[rows, 2 + rows] = -2.0
        L[rows, 3 + rows] = 1.0
        gamma = N - lam * np.trace(L.T @ L @ quality.covariance)
        self.assertAlmostEqual(quality.effective_terms, gamma,
                               delta=1e-9 * N)
        self.assertGreater(quality.effective_terms, 0.0)
        self.assertLess(quality.effective_terms, N)
        resid = data - basis @ np.exp(x)
        rr = resid @ resid
        self.assertAlmostEqual(
            quality.chi2_reduced * (n_resid - (gamma + 1)), rr,
            delta=1e-9 * rr)
        # Below the classical quotient, which charges every grid node.
        self.assertLess(quality.chi2_reduced, rr / (n_resid - m))

    def test_effective_terms_none_without_covariance(self):
        # Same availability as the covariance it is read from; the misfit
        # then falls back to the classical n_resid - m.
        basis, data, x = _random_fit_problem(self.rng, 8, True)
        n_resid = 2 * len(data)
        quality = _prony_fit_quality(
            x, data, basis, 0.0, True, n_resid=n_resid, log_range=LOG_RANGE,
        )
        self.assertIsNone(quality.effective_terms)
        resid = data - basis @ np.exp(x)
        self.assertAlmostEqual(quality.chi2_reduced,
                               resid @ resid / (n_resid - 9),
                               delta=1e-12 * quality.chi2_reduced)
        basis, data, _ = _converged_fit_problem(self.rng)
        x = np.full(basis.shape[1], -10.0)
        n_resid = 2 * len(data)
        quality = _prony_fit_quality(
            x, data, basis, 0.5, True, n_resid=n_resid, log_range=LOG_RANGE,
        )
        self.assertIsNone(quality.covariance)
        self.assertIsNone(quality.effective_terms)
        resid = data - basis @ np.exp(x)
        self.assertAlmostEqual(quality.chi2_reduced,
                               resid @ resid / (n_resid - len(x)),
                               delta=1e-12 * quality.chi2_reduced)

    def test_scan_has_interior_minimum(self):
        # The payoff: -log posterior should trade misfit against roughness and
        # land on an interior smoothness, not run to either end of the scan.
        # Data is a peaked master curve with 3% noise and matching error bars.
        rng = np.random.default_rng(1)
        tau = np.logspace(-3.0, 3.0, 7)
        E_input = np.concatenate(([500.0], np.exp(
            -(np.log10(tau)) ** 2 / 4.0) * 3000.0))
        df = compute_complex(tau, E_input, num_pts=200)
        omega = df['Frequency'].to_numpy()
        E_stor = df['E Storage'].to_numpy()
        E_loss = df['E Loss'].to_numpy()
        std = np.abs(E_stor + 1.0j * E_loss) * 0.03
        noise = rng.normal(size=len(omega))
        E_stor = E_stor + std * noise
        E_loss = E_loss + std * rng.normal(size=len(omega))

        # Decade-spaced around the corner this fixture actually has. The useful
        # range moved down ~30x when the penalty picked up its 1/ell**3 factor;
        # the scan grid is calibration, not physics, so it moves with it.
        grid = [3e-5, 1e-4, 3e-4, 1e-3, 3e-3, 0.01, 0.03, 0.1]
        scores = []
        for smoothness in grid:
            _, _, quality = smooth_prony_fit(
                omega, E_stor, E_loss,
                E_stor_std=std, E_loss_std=std,
                N=24, smoothness=smoothness, solid=True,
                return_fit_quality=True,
            )
            self.assertIsNotNone(
                quality.neg_log_posterior,
                msg=f'no posterior at smoothness={smoothness}',
            )
            scores.append(quality.neg_log_posterior)
        best = int(np.argmin(scores))
        self.assertGreater(best, 0, msg=f'argmin at grid floor: {scores}')
        self.assertLess(best, len(grid) - 1,
                        msg=f'argmin at grid ceiling: {scores}')

    def test_return_fit_quality_leaves_default_shape_alone(self):
        # 26 call sites unpack two values; the flag must be strictly additive.
        omega = np.logspace(-1, 1, 40)
        df = compute_complex(TAU, VISCOUS_E, num_pts=40)
        omega = df['Frequency'].values
        E_stor, E_loss = df['E Storage'].values, df['E Loss'].values
        std = np.ones_like(E_stor)
        kwargs = dict(E_stor_std=std, E_loss_std=std, N=5, solid=True)
        self.assertEqual(
            len(smooth_prony_fit(omega, E_stor, E_loss,
                                 smoothness=1.0, **kwargs)), 2,
        )
        smoothed = smooth_prony_fit(omega, E_stor, E_loss, smoothness=1.0,
                                    return_fit_quality=True, **kwargs)
        self.assertEqual(len(smoothed), 3)
        self.assertIsNotNone(smoothed[2].chi2_reduced)
        # smoothness == 0 takes the NNLS path: misfit yes, posterior no.
        unsmoothed = smooth_prony_fit(omega, E_stor, E_loss, smoothness=0.0,
                                      return_fit_quality=True, **kwargs)
        self.assertEqual(len(unsmoothed), 3)
        self.assertIsNotNone(unsmoothed[2].chi2_reduced)
        self.assertIsNone(unsmoothed[2].neg_log_posterior)

    def test_nnls_path_chi2_matches_explicit_residual(self):
        # The smoothness == 0 branch takes chi2 straight from nnls's returned
        # residual norm, never touching the full basis. Check that shortcut
        # against the residual computed the long way. The denominator counts
        # the active set only: a coefficient NNLS pinned at zero is not a
        # parameter the data determined.
        omega, E_stor, E_loss, std = _broadband_master_curve(600)
        tau_i, E_i, quality = smooth_prony_fit(
            omega, E_stor, E_loss, E_stor_std=std, E_loss_std=std,
            N=12, smoothness=0.0, solid=True, return_fit_quality=True,
        )
        active = np.count_nonzero(E_i)
        self.assertLess(active, len(E_i))  # the active set is a real subset
        self.assertIsNone(quality.effective_terms)
        expected = _chi2_per_point(
            omega, E_stor, E_loss, std, tau_i, E_i,
        ) * (2 * len(omega)) / (2 * len(omega) - active)
        self.assertAlmostEqual(
            quality.chi2_reduced, expected, delta=1e-6 * expected,
        )

    def test_covariance_and_effective_terms_fields_default_to_none(self):
        """_FitQuality carries covariance and effective_terms after the three
        scores, both defaulting to None so three- and four-positional
        construction keeps working."""
        self.assertEqual(
            _FitQuality._fields,
            ('chi2_reduced', 'neg_log_posterior', 'curvature', 'covariance',
             'effective_terms'),
        )
        self.assertIsNone(_FitQuality(1.0, None, None).covariance)
        self.assertIsNone(_FitQuality(1.0, None, None).effective_terms)
        self.assertIsNone(
            _FitQuality(1.0, None, None, np.eye(2)).effective_terms)

    def test_covariance_is_two_inverse_hessians(self):
        """Sigma = 2 inv(Hess V) at the optimum, for the V the solver
        minimizes: exactly symmetric and positive definite."""
        smoothness = 1.0
        basis, data, x = _converged_fit_problem(self.rng, smoothness=smoothness)
        m = len(x)
        n_resid = 2 * len(data)
        quality = _prony_fit_quality(
            x, data, basis, smoothness, True,
            n_resid=n_resid, log_range=LOG_RANGE,
        )
        cov = quality.covariance
        self.assertIsNotNone(cov)
        self.assertEqual(cov.shape, (m, m))
        np.testing.assert_array_equal(cov, cov.T)
        np.linalg.cholesky(cov)  # raises unless positive definite
        scaled = _scaled_smoothness(smoothness, m - 1, n_resid - m, LOG_RANGE)
        H = _PronyLoss(data, basis, scaled, True).hess(x)
        err = np.abs(cov @ H - 2 * np.eye(m)).max()
        self.assertLess(err, 1e-10 * np.linalg.norm(H) * np.linalg.norm(cov))

    def test_covariance_approaches_classical_least_squares(self):
        """As smoothness -> 0+ at an exact fit, Sigma -> inv(J.T @ J) with
        J = basis * coefs, the weighted least-squares covariance of the
        log-parameters."""
        basis = np.abs(self.rng.normal(size=(30, 9))) + 0.3
        truth = np.exp(self.rng.normal(size=9))
        data = basis @ truth
        quality = _prony_fit_quality(
            np.log(truth), data, basis, 1e-8, True,
            n_resid=len(data), log_range=LOG_RANGE,
        )
        J = basis * truth
        np.testing.assert_allclose(
            quality.covariance, np.linalg.inv(J.T @ J), rtol=1e-3,
        )

    def test_covariance_none_when_smoothness_zero(self):
        """No penalty, no log-space posterior: covariance is None."""
        basis, data, x = _random_fit_problem(self.rng, 8, True)
        quality = _prony_fit_quality(
            x, data, basis, 0.0, True, n_resid=2 * len(data),
            log_range=LOG_RANGE,
        )
        self.assertIsNone(quality.covariance)

    def test_covariance_none_when_hessian_not_positive_definite(self):
        """Away from a local minimum there is no Laplace posterior."""
        basis, data, _ = _converged_fit_problem(self.rng)
        x = np.full(basis.shape[1], -10.0)
        quality = _prony_fit_quality(
            x, data, basis, 0.5, True, n_resid=2 * len(data),
            log_range=LOG_RANGE,
        )
        self.assertIsNone(quality.neg_log_posterior)
        self.assertIsNone(quality.covariance)

    def test_covariance_present_with_fewer_than_three_penalized_terms(self):
        """Not gated on a second difference existing: a 2-term smoothed fit
        has a covariance even though neg_log_posterior is None."""
        basis = np.abs(self.rng.normal(size=(10, 3))) + 0.3
        truth = np.exp(self.rng.normal(size=3))
        data = basis @ truth
        quality = _prony_fit_quality(
            np.log(truth), data, basis, 1.5, True,
            n_resid=len(data), log_range=LOG_RANGE,
        )
        self.assertIsNone(quality.neg_log_posterior)
        self.assertIsNotNone(quality.covariance)
        self.assertEqual(quality.covariance.shape, (3, 3))


def _row_pass_spy():
    """Patch reduction's prony_basis with a counting wrapper: one call per
    chunk of the O(rows) pass, none on a cache hit."""
    return mock.patch.object(reduction, 'prony_basis', wraps=prony_basis)


def _legacy_reduce(omega, E_stor, E_loss, E_stor_std, E_loss_std, tau_i,
                   solid, chunk_rows):
    """The reduction as first written: np.linalg.qr on a fresh
    concatenation of the running triangle and each weighted chunk."""
    m = len(tau_i) + solid
    Rz = np.empty((0, m + 1))
    for start in range(0, len(omega), chunk_rows):
        chunk = slice(start, start + chunk_rows)
        basis = prony_basis(omega[chunk], tau_i, solid)
        y = np.concatenate((E_stor[chunk], E_loss[chunk]))
        y_std = np.concatenate((E_stor_std[chunk], E_loss_std[chunk]))
        block = np.concatenate(
            (basis / y_std[:, None], (y / y_std)[:, None]), axis=1
        )
        Rz = np.linalg.qr(
            np.concatenate((Rz, block), axis=0), mode='r'
        )[:m + 1]
    return Rz[:, :m], Rz[:, m]


def _owner_nbytes(arr):
    """Bytes of the allocation that ultimately owns arr's memory."""
    while isinstance(arr.base, np.ndarray):
        arr = arr.base
    return arr.nbytes


class TestPronyReduce(unittest.TestCase):
    """The extracted QR reduction and its content-addressed LRU cache."""

    def setUp(self):
        reduction._REDUCE_CACHE.clear()
        self.omega = np.logspace(-2, 2, 200)
        tau = np.logspace(-2, 2, 5)
        df = compute_complex(tau, np.array([100.0, 1e3, 2e3, 1e3, 500.0, 200.0]),
                             num_pts=200)
        self.omega = df['Frequency'].to_numpy()
        self.E_stor = df['E Storage'].to_numpy()
        self.E_loss = df['E Loss'].to_numpy()
        self.std = np.abs(self.E_stor + 1.0j * self.E_loss) * 0.05
        self.tau_i = prony_relaxation_space(
            1 / self.omega.max(), 1 / self.omega.min(), 8,
        )

    def _reduce(self, **overrides):
        args = dict(
            omega=self.omega, E_stor=self.E_stor, E_loss=self.E_loss,
            E_stor_std=self.std, E_loss_std=self.std, tau_i=self.tau_i,
            solid=True,
        )
        args.update(overrides)
        return _prony_reduce(**args)

    def test_identical_inputs_hit_the_cache(self):
        # A smoothness sweep re-calls with the same arrays; the pass over the
        # rows must run once.
        with _row_pass_spy() as passes:
            first = self._reduce()
            after_first = passes.call_count
            second = self._reduce()
        self.assertGreater(after_first, 0)
        self.assertEqual(passes.call_count, after_first,
                         msg='cache miss on repeat')
        # Equal values, not the same object: every call divides by std_scale and
        # so hands back a fresh array (see test_returned_arrays_are_private).
        np.testing.assert_array_equal(first[0], second[0])
        np.testing.assert_array_equal(first[1], second[1])

    def test_modified_content_misses_the_cache(self):
        # The key is a content digest, not id() — a mutated copy at the same
        # address (or a distinct array with the same values) must not collide.
        first = self._reduce()
        bumped = self.E_stor.copy()
        bumped[3] *= 1.01
        second = self._reduce(E_stor=bumped)
        # R is the triangle of the weighted basis, which does not depend on the
        # moduli at all — only z carries the data, so that is what must change.
        np.testing.assert_allclose(first[0], second[0])
        self.assertFalse(np.array_equal(first[1], second[1]))
        # ...while an equal-valued copy still hits, and hits mean equal values.
        third = self._reduce(E_stor=self.E_stor.copy())
        np.testing.assert_array_equal(first[1], third[1])

    def test_cache_entries_are_read_only(self):
        # Entries are shared across every later hit, so a stray write would
        # poison all of them. scipy doesn't write to what it is handed today;
        # make it raise if it ever does rather than corrupting results silently.
        self._reduce()
        R, z = next(iter(reduction._REDUCE_CACHE.values()))
        with self.assertRaises(ValueError):
            R[0, 0] = 1.0
        with self.assertRaises(ValueError):
            z[0] = 1.0

    def test_returned_arrays_are_private(self):
        # What the caller gets is scaled off the entry, so writing to it must not
        # be visible to the next call — this is what makes the read-only entry a
        # backstop rather than the only line of defence.
        R, z = self._reduce()
        R[0, 0] = 12345.0
        z[0] = 12345.0
        again = self._reduce()
        self.assertNotEqual(again[0][0, 0], 12345.0)
        self.assertNotEqual(again[1][0], 12345.0)

    def test_evicts_least_recently_used(self):
        for extra in range(reduction._REDUCE_CACHE_SIZE + 2):
            bumped = self.E_stor.copy()
            bumped[0] += extra + 1
            self._reduce(E_stor=bumped)
        self.assertEqual(
            len(reduction._REDUCE_CACHE), reduction._REDUCE_CACHE_SIZE,
        )

    def test_std_scale_matches_folding_the_factor_into_std(self):
        # The whole point: passing the factor separately must fit the same
        # problem as multiplying it in, so the relative-error widget can reuse
        # one reduction. Exact to QR rounding, not bitwise — the two orderings
        # round differently.
        for scale in (0.05, 0.5, 4.0):
            with self.subTest(scale=scale):
                reduction._REDUCE_CACHE.clear()
                folded = self._reduce(E_stor_std=self.std * scale,
                                      E_loss_std=self.std * scale)
                reduction._REDUCE_CACHE.clear()
                held_out = self._reduce(std_scale=scale)
                np.testing.assert_allclose(held_out[0], folded[0], rtol=1e-9)
                np.testing.assert_allclose(held_out[1], folded[1], rtol=1e-9)

    def test_std_scale_is_not_part_of_the_cache_key(self):
        # Sweeping the relative-error widget must not re-run the O(rows) QR.
        with _row_pass_spy() as passes:
            base = self._reduce(std_scale=1.0)
            after_first = passes.call_count
            scaled = self._reduce(std_scale=8.0)
        self.assertGreater(after_first, 0)
        self.assertEqual(passes.call_count, after_first,
                         msg='std_scale forced a re-reduce')
        # Cached, but still actually scaled — a hit that ignored std_scale would
        # silently fit the wrong weighting.
        np.testing.assert_allclose(scaled[0], base[0] / 8.0, rtol=1e-12)
        np.testing.assert_allclose(scaled[1], base[1] / 8.0, rtol=1e-12)

    def test_reduced_loss_equals_the_full_loss_with_no_offset(self):
        # ||(y - Bc)/std||^2 == ||Rc - z||^2 exactly, for ANY c. The reduction
        # keeps the orthogonal-residual row instead of returning it separately,
        # so there is no constant left for callers to add back.
        R, z = self._reduce()
        basis = prony_basis(self.omega, self.tau_i, True)
        y = np.concatenate((self.E_stor, self.E_loss))
        y_std = np.concatenate((self.std, self.std))
        for scale in (1.0, 0.4, 2.5):
            with self.subTest(scale=scale):
                coefs = scale * np.exp(
                    np.linspace(3.0, 1.0, len(self.tau_i) + 1)
                )
                full = (y - basis @ coefs) / y_std
                reduced = R @ coefs - z
                self.assertAlmostEqual(
                    full @ full, reduced @ reduced,
                    delta=1e-8 * (full @ full),
                )

    def test_residual_row_is_exactly_zero_across_the_basis(self):
        # What makes keeping the row safe: R is upper triangular, so its last
        # row contributes z[-1]**2 to every loss and nothing to any gradient.
        R, z = self._reduce()
        m = len(self.tau_i) + 1
        self.assertEqual(R.shape, (m + 1, m))
        np.testing.assert_array_equal(R[m], np.zeros(m))
        self.assertNotEqual(z[m], 0.0)

    def test_short_uploads_have_no_residual_row_at_all(self):
        # Fewer data rows than m leaves a shorter triangle: nothing is
        # unreachable, so the identity above holds with a wide R too.
        R, z = self._reduce(
            omega=self.omega[:3], E_stor=self.E_stor[:3],
            E_loss=self.E_loss[:3], E_stor_std=self.std[:3],
            E_loss_std=self.std[:3],
        )
        m = len(self.tau_i) + 1
        self.assertEqual(R.shape, (6, m))  # 3 frequencies -> 6 residuals < m
        basis = prony_basis(self.omega[:3], self.tau_i, True)
        coefs = np.exp(np.linspace(3.0, 1.0, m))
        y = np.concatenate((self.E_stor[:3], self.E_loss[:3]))
        y_std = np.concatenate((self.std[:3], self.std[:3]))
        full = (y - basis @ coefs) / y_std
        reduced = R @ coefs - z
        self.assertAlmostEqual(
            full @ full, reduced @ reduced, delta=1e-8 * (full @ full),
        )

    def test_factors_each_chunk_with_scipy_qr_in_place(self):
        """Every chunk is factored by reduction.qr (scipy.linalg.qr) in
        R-only mode, overwriting its input and skipping the finiteness scan;
        np.linalg.qr is not used."""
        n_chunks = -(-len(self.omega) // 7)  # 28 full chunks + one of 4 rows
        with mock.patch.object(reduction, '_QR_CHUNK_ROWS', 7), \
                mock.patch.object(reduction, 'qr',
                                  wraps=scipy.linalg.qr) as qr, \
                mock.patch.object(np.linalg, 'qr',
                                  wraps=np.linalg.qr) as legacy_qr:
            self._reduce()
        legacy_qr.assert_not_called()
        self.assertEqual(qr.call_count, n_chunks)
        for call in qr.call_args_list:
            self.assertEqual(call.kwargs.get('mode'), 'r')
            self.assertIs(call.kwargs.get('overwrite_a'), True)
            self.assertIs(call.kwargs.get('check_finite'), False)

    def test_reduce_matches_the_legacy_concatenated_qr_bitwise(self):
        """(R, z) equal the concatenate-and-np.linalg.qr reduction exactly,
        row signs included, over several chunks with a short last one, a
        single chunk, and a short upload whose triangle is wide."""
        # Bitwise because numpy and scipy run the same LAPACK geqrf here on
        # the same stacked matrix.
        short = slice(0, 3)  # 3 frequencies -> 6 rows < m
        cases = (
            ('many chunks', slice(None), 7),
            ('one chunk', slice(None), 10 ** 9),
            ('short upload, two chunks', short, 2),
        )
        for label, rows, chunk_rows in cases:
            for solid in (True, False):
                with self.subTest(label, solid=solid):
                    reduction._REDUCE_CACHE.clear()
                    args = (self.omega[rows], self.E_stor[rows],
                            self.E_loss[rows], self.std[rows],
                            self.std[rows], self.tau_i, solid)
                    with mock.patch.object(
                            reduction, '_QR_CHUNK_ROWS', chunk_rows):
                        R, z = _prony_reduce(*args)
                    R_ref, z_ref = _legacy_reduce(*args, chunk_rows)
                    self.assertEqual(R.shape, R_ref.shape)
                    np.testing.assert_array_equal(R, R_ref)
                    np.testing.assert_array_equal(z, z_ref)

    def test_cache_entry_owns_only_the_triangle(self):
        """A cached (R, z) holds no more memory than the (m + 1) x (m + 1)
        triangle, never the chunk-sized buffer it was factored in."""
        m = len(self.tau_i) + 1
        with mock.patch.object(reduction, '_QR_CHUNK_ROWS', 64):
            self._reduce()
        R, z = next(iter(reduction._REDUCE_CACHE.values()))
        limit = (m + 1) ** 2 * R.itemsize
        self.assertLessEqual(_owner_nbytes(R), limit)
        self.assertLessEqual(_owner_nbytes(z), limit)


def _debye_window(decades, n_per_decade=30):
    """(omega, E_stor, E_loss, std) of a noise-free single Debye relaxation
    over `decades` of frequency from omega = 1, with a small plateau."""
    omega = np.logspace(0.0, decades, max(60, int(n_per_decade * decades)))
    E_stor = 1e3 + 1e6 * omega ** 2 / (1 + omega ** 2)
    E_loss = 1e6 * omega / (1 + omega ** 2) + 1e2
    return omega, E_stor, E_loss, np.abs(E_stor + 1.0j * E_loss)


class TestPronyRankLimit(unittest.TestCase):
    """reduction.prony_rank_limit: the number of relaxation terms the data
    can carry, the sqrt(eps) numerical rank of a fixed probe basis."""

    def setUp(self):
        reduction._REDUCE_CACHE.clear()

    @staticmethod
    def _limit(decades=4, **overrides):
        omega, E_stor, E_loss, std = _debye_window(decades)
        args = dict(omega=omega, E_stor=E_stor, E_loss=E_loss,
                    E_stor_std=std, E_loss_std=std)
        args.update(overrides)
        return reduction.prony_rank_limit(**args)

    @staticmethod
    def _probe_counts(omega, E_stor, E_loss, std, solid):
        """Singular-value counts above sqrt(eps) and eps on the probe grid,
        rebuilt here from its definition."""
        tau = prony_relaxation_space(
            1 / omega.max(), 1 / omega.min(), PRONY_TERMS_MAX + 8)
        R, _ = _prony_reduce(omega, E_stor, E_loss, std, std, tau, solid)
        sigma = np.linalg.svd(R, compute_uv=False)
        eps = np.finfo(np.result_type(E_stor, E_loss)).eps
        return (int(np.count_nonzero(sigma > np.sqrt(eps) * sigma[0])),
                int(np.count_nonzero(sigma > eps * sigma[0])))

    def test_returns_a_plain_int_within_the_route_range(self):
        # The extract route serializes with stdlib json, which rejects numpy
        # integer scalars.
        max_prony = self._limit()
        self.assertIs(type(max_prony), int)
        self.assertGreaterEqual(max_prony, 1)
        self.assertLessEqual(max_prony, PRONY_TERMS_MAX)

    def test_uniform_std_scale_does_not_move_the_count(self):
        counts = {self._limit(std_scale=s) for s in (0.01, 1.0, 100.0)}
        self.assertEqual(len(counts), 1)

    def test_wider_span_supports_more_terms(self):
        narrow = self._limit(decades=2)
        wide = self._limit(decades=4)
        self.assertLess(wide, PRONY_TERMS_MAX)  # compare counts, not clips
        self.assertLess(narrow, wide)

    def test_very_wide_span_is_clipped_to_the_route_limit(self):
        omega, E_stor, E_loss, std = _debye_window(16)
        sqrt_count, _ = self._probe_counts(
            omega, E_stor, E_loss, std, solid=True)
        self.assertGreater(sqrt_count - 1, PRONY_TERMS_MAX)  # precondition
        max_prony = reduction.prony_rank_limit(
            omega, E_stor, E_loss, std, std)
        self.assertEqual(max_prony, PRONY_TERMS_MAX)

    def test_float32_moduli_lower_the_count(self):
        omega, E_stor, E_loss, std = _debye_window(4)
        full = reduction.prony_rank_limit(omega, E_stor, E_loss, std, std)
        low = reduction.prony_rank_limit(
            omega, E_stor.astype(np.float32), E_loss.astype(np.float32),
            std, std)
        self.assertLess(low, full)

    def test_threshold_is_sqrt_eps_not_eps(self):
        # On a noise-free 2-decade window the sqrt(eps) rank is about half
        # the eps rank; the equilibrium column is not a relaxation term.
        omega, E_stor, E_loss, std = _debye_window(2)
        max_prony = reduction.prony_rank_limit(
            omega, E_stor, E_loss, std, std, solid=True)
        sqrt_count, eps_count = self._probe_counts(
            omega, E_stor, E_loss, std, solid=True)
        self.assertEqual(max_prony, sqrt_count - 1)
        self.assertLess(max_prony, eps_count - 1)

    def test_viscous_count_drops_no_equilibrium_column(self):
        omega, E_stor, E_loss, std = _debye_window(2)
        max_prony = reduction.prony_rank_limit(
            omega, E_stor, E_loss, std, std, solid=False)
        sqrt_count, _ = self._probe_counts(
            omega, E_stor, E_loss, std, solid=False)
        self.assertEqual(max_prony, sqrt_count)

    def test_tiny_upload_is_limited_by_its_row_count(self):
        # Two frequencies give four weighted rows, one of them spent on the
        # equilibrium column.
        omega = np.array([1.0, 10.0])
        E_stor = np.array([2e5, 8e5])
        E_loss = np.array([1e5, 2e5])
        std = np.abs(E_stor + 1.0j * E_loss)
        max_prony = reduction.prony_rank_limit(
            omega, E_stor, E_loss, std, std, std_scale=0.01)
        self.assertIs(type(max_prony), int)
        self.assertGreaterEqual(max_prony, 1)
        self.assertLessEqual(max_prony, 2 * len(omega) - 1)

    def test_repeat_call_reuses_its_own_cached_reduction(self):
        # The probe has its own cache entry: a fit on the same data needs a
        # pass of its own, and neither a repeat call nor a new std_scale
        # redoes the pass over the rows.
        omega, E_stor, E_loss, std = _debye_window(4)
        with _row_pass_spy() as passes:
            first = reduction.prony_rank_limit(
                omega, E_stor, E_loss, std, std)
            after_probe = passes.call_count
            smooth_prony_fit(omega, E_stor, E_loss, std, std,
                             N=8, smoothness=0.0)
            after_fit = passes.call_count
            second = reduction.prony_rank_limit(
                omega, E_stor, E_loss, std, std)
            rescaled = reduction.prony_rank_limit(
                omega, E_stor, E_loss, std, std, std_scale=0.05)
        self.assertGreater(after_probe, 0)
        self.assertGreater(after_fit, after_probe,
                           msg='fit grid should not collide with the probe')
        self.assertEqual(passes.call_count, after_fit, msg='probe cache miss')
        self.assertEqual(first, second)
        self.assertEqual(first, rescaled)


class TestSmoothPronyFit(unittest.TestCase):
    def setUp(self):
        # Small problem so the fit runs quickly; synthesize from a known Prony series.
        df = compute_complex(TAU, VISCOUS_E, num_pts=25)
        self.omega = df['Frequency'].values
        self.E_stor = df['E Storage'].values
        self.E_loss = df['E Loss'].values
        # Flat uniform weights — same loss landscape as unweighted least-squares.
        self.E_stor_std = np.ones_like(self.E_stor)
        self.E_loss_std = np.ones_like(self.E_loss)

    def test_shape_viscous(self):
        tau_i, E_i = smooth_prony_fit(
            self.omega, self.E_stor, self.E_loss,
            E_stor_std=self.E_stor_std, E_loss_std=self.E_loss_std,
            N=5, smoothness=1.0, solid=False,
        )
        self.assertEqual(tau_i.shape, (5,))
        self.assertEqual(E_i.shape, (5,))

    def test_shape_solid(self):
        tau_i, E_i = smooth_prony_fit(
            self.omega, self.E_stor, self.E_loss,
            E_stor_std=self.E_stor_std, E_loss_std=self.E_loss_std,
            N=5, smoothness=1.0, solid=True,
        )
        self.assertEqual(tau_i.shape, (5,))
        self.assertEqual(E_i.shape, (6,))

    def test_recovers_input_coefficients(self):
        # When N matches the source grid size and smoothing is off, the fit
        # should recover the input coefficients.
        tau_i, E_i = smooth_prony_fit(
            self.omega, self.E_stor, self.E_loss,
            E_stor_std=self.E_stor_std, E_loss_std=self.E_loss_std,
            N=len(TAU), smoothness=0.0, solid=False,
        )
        np.testing.assert_allclose(tau_i, TAU)
        np.testing.assert_allclose(E_i, VISCOUS_E, rtol=1e-3)

    def test_N_controls_tau_grid_size(self):
        tau_i, E_i = smooth_prony_fit(
            self.omega, self.E_stor, self.E_loss,
            E_stor_std=self.E_stor_std, E_loss_std=self.E_loss_std,
            N=8, smoothness=1.0, solid=False,
        )
        self.assertEqual(tau_i.shape, (8,))
        self.assertEqual(E_i.shape, (8,))

    def test_std_arrays_weight_residuals(self):
        # Under-parameterized fit (N=1 against a 3-term source) so the model
        # cannot match both moduli exactly. Tiny std on the storage side,
        # huge on the loss side → the storage residuals dominate the loss,
        # so the fit tracks E_stor better than E_loss; reversing the weights
        # should swap which side tracks well.
        n = len(self.omega)
        small = np.full(n, 1e-3)
        big = np.full(n, 1e3)
        tau_i, E_i = smooth_prony_fit(
            self.omega, self.E_stor, self.E_loss,
            E_stor_std=small, E_loss_std=big,
            N=1, smoothness=0.0, solid=False,
        )
        basis = prony_basis(self.omega, tau_i, solid=False)
        model = basis @ E_i
        stor_err = np.linalg.norm(self.E_stor - model[:n])
        loss_err = np.linalg.norm(self.E_loss - model[n:])
        self.assertLess(stor_err, loss_err)

        tau_i_r, E_i_r = smooth_prony_fit(
            self.omega, self.E_stor, self.E_loss,
            E_stor_std=big, E_loss_std=small,
            N=1, smoothness=0.0, solid=False,
        )
        basis_r = prony_basis(self.omega, tau_i_r, solid=False)
        model_r = basis_r @ E_i_r
        stor_err_r = np.linalg.norm(self.E_stor - model_r[:n])
        loss_err_r = np.linalg.norm(self.E_loss - model_r[n:])
        self.assertGreater(stor_err_r, loss_err_r)

    def test_rejects_non_ndarray_omega(self):
        with self.assertRaises(AssertionError):
            smooth_prony_fit(
                list(self.omega), self.E_stor, self.E_loss,
                E_stor_std=self.E_stor_std, E_loss_std=self.E_loss_std,
                N=5, smoothness=1.0, solid=False,
            )

    def test_rejects_non_ndarray_E_stor(self):
        with self.assertRaises(AssertionError):
            smooth_prony_fit(
                self.omega, list(self.E_stor), self.E_loss,
                E_stor_std=self.E_stor_std, E_loss_std=self.E_loss_std,
                N=5, smoothness=1.0, solid=False,
            )

    def test_rejects_non_ndarray_E_loss(self):
        with self.assertRaises(AssertionError):
            smooth_prony_fit(
                self.omega, self.E_stor, list(self.E_loss),
                E_stor_std=self.E_stor_std, E_loss_std=self.E_loss_std,
                N=5, smoothness=1.0, solid=False,
            )

    def test_rejects_2d_omega(self):
        with self.assertRaises(AssertionError):
            smooth_prony_fit(
                self.omega.reshape(1, -1), self.E_stor, self.E_loss,
                E_stor_std=self.E_stor_std, E_loss_std=self.E_loss_std,
                N=5, smoothness=1.0, solid=False,
            )

    def test_rejects_2d_E_stor(self):
        with self.assertRaises(AssertionError):
            smooth_prony_fit(
                self.omega, self.E_stor.reshape(1, -1), self.E_loss,
                E_stor_std=self.E_stor_std, E_loss_std=self.E_loss_std,
                N=5, smoothness=1.0, solid=False,
            )

    def test_rejects_2d_E_loss(self):
        with self.assertRaises(AssertionError):
            smooth_prony_fit(
                self.omega, self.E_stor, self.E_loss.reshape(1, -1),
                E_stor_std=self.E_stor_std, E_loss_std=self.E_loss_std,
                N=5, smoothness=1.0, solid=False,
            )

    def test_rejects_length_mismatch(self):
        with self.assertRaises(AssertionError):
            smooth_prony_fit(
                self.omega, self.E_stor[:-1], self.E_loss,
                E_stor_std=self.E_stor_std[:-1], E_loss_std=self.E_loss_std,
                N=5, smoothness=1.0, solid=False,
            )

    def test_rejects_E_stor_std_wrong_length(self):
        with self.assertRaises(AssertionError):
            smooth_prony_fit(
                self.omega, self.E_stor, self.E_loss,
                E_stor_std=self.E_stor_std[:-1], E_loss_std=self.E_loss_std,
                N=5, smoothness=1.0, solid=False,
            )

    def test_rejects_E_loss_std_wrong_length(self):
        with self.assertRaises(AssertionError):
            smooth_prony_fit(
                self.omega, self.E_stor, self.E_loss,
                E_stor_std=self.E_stor_std, E_loss_std=self.E_loss_std[:-1],
                N=5, smoothness=1.0, solid=False,
            )

    def test_handles_data_scale_orders_of_magnitude(self):
        # Regression: a constant initial guess (x0 = 7 → E_i ≈ 1097 each) sent
        # BFGS' first line search into logcoefs > 700 whenever the data
        # magnitude was many orders of magnitude away from ~1e3, and exp()
        # overflowed to inf. The data-scaled x0 keeps the initial step inside
        # float64 range regardless of dataset scale.
        # Use a peak-shaped Prony series over 16 decades of tau — closer to
        # real master-curve structure than the narrow TAU/VISCOUS_E fixture,
        # which doesn't trip the bug.
        tau = np.logspace(-8.0, 8.0, 17)
        E_shape = np.exp(-(np.log10(tau)) ** 2 / 4.0)  # peaked at tau=1
        for scale in [1e3, 1e6, 1e9, 1e12]:
            E_input = np.concatenate(([0.1 * scale], E_shape * scale))
            df = compute_complex(tau, E_input, num_pts=400)
            omega = df['Frequency'].to_numpy()
            E_stor = df['E Storage'].to_numpy()
            E_loss = df['E Loss'].to_numpy()
            mag = np.abs(E_stor + 1.0j * E_loss) * 0.2
            for N in [10, 20, 50]:
                with self.subTest(scale=scale, N=N):
                    _, E_i = smooth_prony_fit(
                        omega, E_stor, E_loss,
                        E_stor_std=mag, E_loss_std=mag,
                        N=N, smoothness=0.0, solid=True,
                    )
                    self.assertTrue(
                        np.all(np.isfinite(E_i)),
                        msg=f'non-finite E_i at scale={scale:g}, N={N}: {E_i}',
                    )


def _broadband_master_curve(num_pts):
    """Synthetic peaked Prony source over ~16 decades of tau — the shape (and
    scale, ~1e9 Pa) of a real chirp/broadband master curve like the DI-ST
    dataset that motivated the QR-reduced solver."""
    tau = np.logspace(-8.0, 8.0, 17)
    E_input = np.concatenate(([1e8], np.exp(-(np.log10(tau)) ** 2 / 4.0) * 1e9))
    df = compute_complex(tau, E_input, num_pts=num_pts)
    omega = df['Frequency'].to_numpy()
    E_stor = df['E Storage'].to_numpy()
    E_loss = df['E Loss'].to_numpy()
    std = np.abs(E_stor + 1.0j * E_loss) * 0.2
    return omega, E_stor, E_loss, std


def _chi2_per_point(omega, E_stor, E_loss, std, tau_i, E_i):
    basis = prony_basis(omega, tau_i, solid=len(E_i) != len(tau_i))
    resid = (np.concatenate((E_stor, E_loss)) - basis @ E_i) / np.concatenate((std, std))
    return (resid @ resid) / (2 * len(omega))


class TestSmoothPronyFitReducedSolver(unittest.TestCase):
    """The chunked-QR + NNLS solver: row-count independence, chunking
    equivalence, and the reduced smoothness path."""

    def test_large_broadband_input_fits_fast_and_finite(self):
        # 40k points over ~16 decades at N=100 — the configuration that made
        # the previous full-basis BFGS solver exceed any request timeout. The
        # wall-time bound is deliberately generous (CI machines vary); the
        # old solver needed minutes, the reduced solver needs seconds.
        import time
        omega, E_stor, E_loss, std = _broadband_master_curve(40000)
        start = time.monotonic()
        tau_i, E_i = smooth_prony_fit(
            omega, E_stor, E_loss,
            E_stor_std=std, E_loss_std=std,
            N=100, smoothness=0.0, solid=True,
        )
        elapsed = time.monotonic() - start
        self.assertLess(elapsed, 30.0)
        self.assertTrue(np.all(np.isfinite(E_i)))
        self.assertTrue(np.all(E_i >= 0))
        # Data synthesized from a Prony series with 20% relative std → the
        # fit should sit far below chi2/pt = 1.
        chi2 = _chi2_per_point(omega, E_stor, E_loss, std, tau_i, E_i)
        self.assertLess(chi2, 0.1)

    def test_chunked_reduction_matches_single_chunk(self):
        # Force many chunks vs one chunk; the accumulated triangle carries the
        # same least-squares information, so the fits must agree.
        omega, E_stor, E_loss, std = _broadband_master_curve(2000)
        kwargs = dict(E_stor_std=std, E_loss_std=std,
                      N=20, smoothness=0.0, solid=True)
        original = reduction._QR_CHUNK_ROWS
        try:
            reduction._QR_CHUNK_ROWS = 64
            _, E_many = smooth_prony_fit(omega, E_stor, E_loss, **kwargs)
            reduction._QR_CHUNK_ROWS = 10 ** 9
            _, E_one = smooth_prony_fit(omega, E_stor, E_loss, **kwargs)
        finally:
            reduction._QR_CHUNK_ROWS = original
        np.testing.assert_allclose(
            E_many, E_one, rtol=1e-6, atol=1e-6 * E_one.max(),
        )

    def test_negative_loss_values_tolerated(self):
        # Real broadband data carries negative E'' noise on the plateaus (877
        # such points in the motivating DI-ST file). The non-negative model
        # can't reach them, but the fit must stay finite and sane.
        omega, E_stor, E_loss, std = _broadband_master_curve(3000)
        rng = np.random.default_rng(42)
        noisy = np.where(
            rng.random(len(E_loss)) < 0.05, -np.abs(E_loss), E_loss,
        )
        tau_i, E_i = smooth_prony_fit(
            omega, E_stor, noisy,
            E_stor_std=std, E_loss_std=std,
            N=50, smoothness=0.0, solid=True,
        )
        self.assertTrue(np.all(np.isfinite(E_i)))
        self.assertTrue(np.all(E_i >= 0))

    def test_smoothness_effect_is_row_count_invariant(self):
        # The data term sums over all residuals while the penalty does not, so
        # without normalization a given smoothness weakens ~1/n_res as uploads
        # grow (a 41k-row file needed ~100x the value a 400-row file needs).
        # The weight carries a dof factor, so the SAME curve sampled at very
        # different densities must smooth to a comparable log-space roughness
        # at the same smoothness value.
        def log_roughness(E, solid=True):
            lE = np.log(np.maximum(E[solid:], E[E > 0].min() * 1e-3))
            d2 = np.diff(lE, n=2)
            return d2 @ d2

        rough = []
        for n in (500, 20000):
            omega, E_stor, E_loss, std = _broadband_master_curve(n)
            _, E_i = smooth_prony_fit(
                omega, E_stor, E_loss,
                E_stor_std=std, E_loss_std=std,
                N=50, smoothness=0.01, solid=True,
            )
            rough.append(log_roughness(E_i))
        lo, hi = sorted(rough)
        # Unnormalized, the 40x density gap gives a ~40x penalty-weight gap and
        # wildly different roughness; normalized they agree closely (measured
        # 1.08). Factor 2 is a loose bound for discretization differences.
        #
        # Measure in the regime where the spectrum still HAS structure. Push the
        # smoothness far past the L-curve corner and both fits collapse toward a
        # straight line, at which point this compares two near-zero roughnesses
        # and the ratio is meaningless noise (13x at smoothness=0.1 here).
        self.assertLess(hi, 2.0 * lo)

    def test_smoothness_path_converges_near_unsmoothed_optimum(self):
        # A mild penalty must not degrade the data term much relative to the
        # exact NNLS optimum — this exercises the Newton path on the reduced
        # system.
        omega, E_stor, E_loss, std = _broadband_master_curve(1000)
        kwargs = dict(E_stor_std=std, E_loss_std=std, N=50, solid=True)
        tau_i, E_exact = smooth_prony_fit(
            omega, E_stor, E_loss, smoothness=0.0, **kwargs)
        _, E_smooth = smooth_prony_fit(
            omega, E_stor, E_loss, smoothness=0.01, **kwargs)
        self.assertTrue(np.all(np.isfinite(E_smooth)))
        chi2_exact = _chi2_per_point(omega, E_stor, E_loss, std, tau_i, E_exact)
        chi2_smooth = _chi2_per_point(omega, E_stor, E_loss, std, tau_i, E_smooth)
        self.assertLess(chi2_smooth, chi2_exact + 0.1)

    def test_smoothness_effect_is_term_count_invariant(self):
        # The 1/ell**4 in the penalty normalization, end to end. One dataset, one
        # smoothness, four term counts: the RECOVERED SPECTRUM must come out
        # equally rough, because there is only one true spectrum and N chooses
        # resolution, not smoothness.
        #
        # Without the correction N is a second, undocumented smoothness knob:
        # the same sweep was measured to leave the spectrum 18x rougher at
        # N=100 than at N=23, i.e. raising N silently released the prior.
        #
        # N starts at 40 because this fixture spans 16 decades: N=23 puts ell at
        # 1.7 in ln(tau), far too coarse for a second difference to approximate
        # a second derivative, and the fit is then limited by resolution rather
        # than by the prior. The correction is a continuum argument and needs a
        # mesh that resolves the spectrum (ell below ~1) before it applies.
        omega, E_stor, E_loss, std = _broadband_master_curve(600)
        reported = []
        for N in (40, 60, 80, 100):
            _, _, quality = smooth_prony_fit(
                omega, E_stor, E_loss,
                E_stor_std=std, E_loss_std=std,
                N=N, smoothness=0.018, solid=True, return_fit_quality=True,
            )
            reported.append(quality.curvature)
        lo, hi = min(reported), max(reported)
        # Guard against passing for the wrong reason. This is a property of the
        # PRIOR, so it only shows where the prior binds: crank the smoothness
        # far enough and every fit collapses toward a straight line, which would
        # satisfy the bound below trivially. Measured spread runs 10.7x where
        # the penalty costs nothing, 1.45x where it costs 4x fidelity and 1.06x
        # where it costs 26x, so pin the roughness away from the flat limit.
        self.assertGreater(lo, 0.1, msg=f'spectrum crushed flat: {reported}')
        self.assertLess(hi, 1.4 * lo,
                        msg=f'roughness moved with N: {reported}')

    def test_smoothness_effect_survives_cropping_the_span(self):
        # The acceptance criterion behind the normalizer: crop a dataset to a
        # subset of its decades and one smoothness value must still mean the
        # same thing. Measured as fidelity cost rather than roughness, because
        # different windows are intrinsically rough to different degrees.
        #
        # N tracks the span at 3 terms per decade, holding ell fixed — the policy
        # the tool itself uses. Pinning N while cropping does NOT hold here and
        # cannot: that changes the mesh as well as the window, so a 16-decade
        # fit at N=23 (ell=1.7, chi2/nu 0.0025) and a 6-decade one at the same N
        # (ell=0.63, chi2/nu 0.0003) are not the same fit to begin with, and the
        # cost then ranges over 15x. That is resolution moving, not the knob.
        omega, E_stor, E_loss, std = _broadband_master_curve(2000)
        lo10, hi10 = np.log10(omega.min()), np.log10(omega.max())
        mid = (lo10 + hi10) / 2
        costs = []
        for width in (16.0, 12.0, 8.0, 6.0):
            keep = (np.log10(omega) >= mid - width / 2) & \
                   (np.log10(omega) <= mid + width / 2)
            args = (omega[keep], E_stor[keep], E_loss[keep])
            kwargs = dict(E_stor_std=std[keep], E_loss_std=std[keep],
                          N=int(round(3 * width)), solid=True,
                          return_fit_quality=True)
            raw = smooth_prony_fit(*args, smoothness=0.0, **kwargs)[2]
            sm = smooth_prony_fit(*args, smoothness=0.01, **kwargs)[2]
            costs.append(sm.chi2_reduced / raw.chi2_reduced)
        self.assertLess(max(costs), 1.3 * min(costs),
                        msg=f'smoothing cost moved with crop width: {costs}')

    def test_zero_coefficients_flow_through_coef_records(self):
        # NNLS returns exact zeros (active set); the coefficient table filters
        # them and keeps the original grid index in 'i'. A nonzero E_eq adds
        # its own plateau row, which has no tau_i to look up.
        omega, E_stor, E_loss, std = _broadband_master_curve(500)
        tau_i, E_i = smooth_prony_fit(
            omega, E_stor, E_loss,
            E_stor_std=std, E_loss_std=std,
            N=50, smoothness=0.0, solid=True,
        )
        self.assertGreater(np.sum(E_i == 0), 0)  # sparsity actually occurs
        records = _build_coef_records(tau_i, E_i)
        self.assertEqual(len(records),
                         np.count_nonzero(E_i[1:]) + int(E_i[0] != 0))
        for rec in records:
            self.assertNotEqual(rec['E_i'], 0)
            if rec['tau_i'] != 'inf':
                np.testing.assert_allclose(rec['tau_i'], tau_i[rec['i']])


class TestCoefRecordsBounds(unittest.TestCase):
    """
    With a covariance, each table row carries the +-1 sigma interval of its
    coefficient, [E exp(-s), E exp(s)] in Pa with s capped at six decades;
    without one the table keeps exactly 'i', 'tau_i' and 'E_i'.
    """

    TAU = np.logspace(-2, 1, 4)
    E = np.array([1e6, 3e5, 2e7, 4e4])
    # Distinct per term, so a row that reads its neighbour's sigma shows.
    SIGMA = np.array([0.1, 0.4, 0.9, 1.6])
    BOUND_KEYS = {'E_i_lower', 'E_i_upper'}

    def _check_bounds(self, records, E, sigma):
        """Row k is term records[k]['i'], with 1-sigma of ln E sigma[i]."""
        for rec in records:
            i = rec['i']
            s = min(sigma[i], _SIGMA_DISPLAY_CAP)
            self.assertAlmostEqual(rec['E_i'], E[i])
            np.testing.assert_allclose(
                [rec['E_i_lower'], rec['E_i_upper']],
                [E[i] * np.exp(-s), E[i] * np.exp(s)], rtol=1e-12)

    def test_no_covariance_keeps_three_keys(self):
        for records in (_build_coef_records(self.TAU, self.E),
                        _build_coef_records(self.TAU, self.E,
                                            covariance=None)):
            for rec in records:
                self.assertSetEqual(set(rec), {'i', 'tau_i', 'E_i'})

    def test_bounds_are_the_log_normal_interval(self):
        cov = np.diag(self.SIGMA ** 2)
        records = _build_coef_records(self.TAU, self.E, covariance=cov)
        self.assertEqual(len(records), len(self.TAU))
        for rec in records:
            self.assertSetEqual(set(rec), {'i', 'tau_i', 'E_i'} |
                                self.BOUND_KEYS)
        self._check_bounds(records, self.E, self.SIGMA)

    def test_equilibrium_row_does_not_shift_the_alignment(self):
        # The equilibrium sigma differs from every decaying one, so reading
        # row k + 1 as row k would put the wrong interval on every term.
        # The plateau row comes last (TestCoefRecordsPlateauRow).
        E = np.concatenate(([5e3], self.E))
        cov = np.diag(np.concatenate(([3.0], self.SIGMA)) ** 2)
        records = _build_coef_records(self.TAU, E, covariance=cov)
        self.assertEqual(len(records), len(self.TAU) + 1)
        self._check_bounds(records[:-1], self.E, self.SIGMA)

    def test_clamped_equilibrium_uses_the_decaying_covariance(self):
        # E_i carries the equilibrium term but the covariance does not.
        E = np.concatenate(([0.0], self.E))
        cov = np.diag(self.SIGMA ** 2)
        records = _build_coef_records(self.TAU, E, covariance=cov)
        self.assertEqual(len(records), len(self.TAU))
        self._check_bounds(records, self.E, self.SIGMA)

    def test_bounds_are_built_before_the_zero_filter(self):
        E = self.E.copy()
        E[1] = 0.0
        cov = np.diag(self.SIGMA ** 2)
        records = _build_coef_records(self.TAU, E, covariance=cov)
        self.assertEqual([rec['i'] for rec in records], [0, 2, 3])
        self._check_bounds(records, E, self.SIGMA)

    def test_sigma_above_the_cap_is_capped(self):
        sigma = np.array([0.5, 20.0, 1e3, _SIGMA_DISPLAY_CAP])
        records = _build_coef_records(self.TAU, self.E,
                                      covariance=np.diag(sigma ** 2))
        for rec in records:
            lower, E, upper = rec['E_i_lower'], rec['E_i'], rec['E_i_upper']
            self.assertTrue(np.isfinite([lower, upper]).all())
            self.assertGreater(lower, 0.0)
            self.assertLessEqual(lower, E)
            self.assertLessEqual(E, upper)
        for rec in records[1:]:
            self.assertAlmostEqual(rec['E_i_upper'] / rec['E_i'], 1e6,
                                   delta=1e-6)
            self.assertAlmostEqual(rec['E_i_lower'] / rec['E_i'], 1e-6,
                                   delta=1e-18)
        self._check_bounds(records, self.E, sigma)

    def test_bounds_are_plain_floats(self):
        records = _build_coef_records(
            self.TAU, self.E, covariance=np.diag(self.SIGMA ** 2))
        for rec in records:
            for key in self.BOUND_KEYS:
                self.assertIs(type(rec[key]), float, key)


class TestCoefRecordsPlateauRow(unittest.TestCase):
    """
    A nonzero equilibrium modulus E_eq gets one table row of its own, last,
    as {'i': N, 'tau_i': 'inf', 'E_i': E_eq}: 'i' is the next index after the
    N decaying terms, so a sort by 'i' keeps it last, and 'inf' is a string
    because stdlib json writes a float inf as Infinity, which JSON.parse
    rejects. With an equilibrium row in the covariance it also carries
    [E_eq exp(-s), E_eq exp(s)], s = sqrt(cov[0, 0]) capped like every row.
    """

    TAU = np.logspace(-2, 1, 4)
    E_TERMS = np.array([1e6, 3e5, 2e7, 4e4])
    E_EQ = 5e3
    E = np.concatenate(([E_EQ], E_TERMS))
    SIGMA = np.array([0.1, 0.4, 0.9, 1.6])
    SIGMA_EQ = 0.7
    KEYS = {'i', 'tau_i', 'E_i'}
    BOUND_KEYS = {'E_i_lower', 'E_i_upper'}

    def _correlated_cov(self, sigma_eq=SIGMA_EQ):
        """(N + 1) covariance, equilibrium first, with nonzero cross terms
        between E_eq and the decaying terms."""
        sigma = np.concatenate(([sigma_eq], self.SIGMA))
        corr = np.full((5, 5), 0.3)
        np.fill_diagonal(corr, 1.0)
        return corr * np.outer(sigma, sigma)

    def _plateau_rows(self, records):
        return [rec for rec in records if rec['tau_i'] == 'inf']

    def test_plateau_row_comes_last_with_the_next_index(self):
        for cov in (None, self._correlated_cov()):
            with self.subTest(covariance=cov is not None):
                records = _build_coef_records(self.TAU, self.E,
                                              covariance=cov)
                self.assertEqual(len(self._plateau_rows(records)), 1)
                self.assertEqual(len(records), len(self.TAU) + 1)
                last = records[-1]
                self.assertEqual(last['tau_i'], 'inf')
                self.assertEqual(last['i'], len(self.TAU))
                self.assertEqual(last['E_i'], self.E_EQ)
                self.assertEqual([rec['i'] for rec in records],
                                 sorted(rec['i'] for rec in records))

    def test_plateau_row_without_a_covariance_has_three_keys(self):
        records = _build_coef_records(self.TAU, self.E)
        self.assertEqual(len(self._plateau_rows(records)), 1)
        self.assertEqual(records[-1],
                         {'i': len(self.TAU), 'tau_i': 'inf',
                          'E_i': self.E_EQ})

    def test_plateau_bounds_are_the_log_normal_interval_of_E_eq(self):
        """Only cov[0, 0] sets the interval; the cross terms do not."""
        records = _build_coef_records(self.TAU, self.E,
                                      covariance=self._correlated_cov())
        self.assertEqual(len(self._plateau_rows(records)), 1)
        last = records[-1]
        self.assertSetEqual(set(last), self.KEYS | self.BOUND_KEYS)
        s = self.SIGMA_EQ
        np.testing.assert_allclose(
            [last['E_i_lower'], last['E_i_upper']],
            [self.E_EQ * np.exp(-s), self.E_EQ * np.exp(s)], rtol=1e-12)

    def test_plateau_sigma_above_the_cap_is_capped(self):
        for sigma_eq in (_SIGMA_DISPLAY_CAP, 20.0, 1e3):
            with self.subTest(sigma_eq=sigma_eq):
                records = _build_coef_records(
                    self.TAU, self.E,
                    covariance=self._correlated_cov(sigma_eq))
                self.assertEqual(len(self._plateau_rows(records)), 1)
                last = records[-1]
                self.assertTrue(
                    np.isfinite([last['E_i_lower'], last['E_i_upper']]).all())
                np.testing.assert_allclose(
                    [last['E_i_lower'], last['E_i_upper']],
                    [self.E_EQ * 1e-6, self.E_EQ * 1e6], rtol=1e-12)

    def test_decaying_rows_are_unchanged_by_the_plateau_row(self):
        """With no correlation the decaying rows equal the viscous table of
        the same terms, bounds included."""
        cov = np.diag(np.concatenate(([self.SIGMA_EQ], self.SIGMA)) ** 2)
        records = _build_coef_records(self.TAU, self.E, covariance=cov)
        self.assertEqual(len(records), len(self.TAU) + 1)
        self.assertEqual(
            records[:-1],
            _build_coef_records(self.TAU, self.E_TERMS,
                                covariance=np.diag(self.SIGMA ** 2)))

    def test_no_plateau_row_for_a_viscous_fit(self):
        for cov in (None, np.diag(self.SIGMA ** 2)):
            with self.subTest(covariance=cov is not None):
                records = _build_coef_records(self.TAU, self.E_TERMS,
                                              covariance=cov)
                self.assertEqual(self._plateau_rows(records), [])
                self.assertEqual(len(records), len(self.TAU))

    def test_no_plateau_row_when_the_equilibrium_modulus_is_zero(self):
        # Clamped smoothed fit: E_eq == 0 with an (N, N) covariance; an
        # unsmoothed NNLS zero: E_eq == 0 with no covariance.
        E = np.concatenate(([0.0], self.E_TERMS))
        for cov in (None, np.diag(self.SIGMA ** 2)):
            with self.subTest(covariance=cov is not None):
                records = _build_coef_records(self.TAU, E, covariance=cov)
                self.assertEqual(self._plateau_rows(records), [])
                self.assertEqual(len(records), len(self.TAU))

    def test_every_row_has_the_same_keys(self):
        for cov in (None, self._correlated_cov()):
            with self.subTest(covariance=cov is not None):
                records = _build_coef_records(self.TAU, self.E,
                                              covariance=cov)
                self.assertEqual(len(self._plateau_rows(records)), 1)
                want = self.KEYS | (self.BOUND_KEYS if cov is not None
                                    else set())
                for rec in records:
                    self.assertSetEqual(set(rec), want)

    def test_plateau_row_is_plain_strict_json(self):
        """Plain int / str / float values: json.dumps accepts the records
        with allow_nan=False and json.loads gives them back unchanged."""
        for cov in (None, self._correlated_cov()):
            with self.subTest(covariance=cov is not None):
                records = _build_coef_records(self.TAU, self.E,
                                              covariance=cov)
                self.assertEqual(len(self._plateau_rows(records)), 1)
                last = records[-1]
                self.assertIs(type(last['i']), int)
                self.assertIs(type(last['tau_i']), str)
                for key in set(last) - {'i', 'tau_i'}:
                    self.assertIs(type(last[key]), float, key)
                text = json.dumps(records, allow_nan=False)
                self.assertEqual(json.loads(text), records)


def _unresolved_equilibrium_curve(num_pts=200):
    """Peaked Prony source whose 1e6 equilibrium modulus is three decades under
    the 1e9 peak: with 20% error bars the data cannot resolve it, and a
    smoothed fit legitimately clamps E_eq at exactly zero."""
    tau = np.logspace(-4.0, 4.0, 9)
    E_input = np.concatenate(
        ([1e6], np.exp(-(np.log10(tau)) ** 2 / 4.0) * 1e9))
    df = compute_complex(tau, E_input, num_pts=num_pts)
    omega = df['Frequency'].to_numpy()
    E_stor = df['E Storage'].to_numpy()
    E_loss = df['E Loss'].to_numpy()
    std = np.abs(E_stor + 1.0j * E_loss) * 0.2
    return omega, E_stor, E_loss, std


def _penalized_gradient(omega, E_stor, E_loss, std, tau_i, E_i, smoothness, solid):
    """max |dV/dlogE| of the penalized objective smooth_prony_fit minimizes, at
    the coefficients it returned — rebuilt from the same reduction and the same
    normalized weight, so zero here means a genuine stationary point."""
    N = len(tau_i)
    m = N + solid
    R, z = _prony_reduce(omega, E_stor, E_loss, std, std, tau_i, solid, 1.0)
    scaled = _scaled_smoothness(
        smoothness, N, 2 * len(omega) - m, np.log(tau_i[-1] / tau_i[0]))
    _, grad = _prony_objective(np.log(E_i), z[:m], R[:m], scaled, solid)
    return np.abs(grad).max()


class TestSmoothPronyFitNewton(unittest.TestCase):
    """The trust-exact Newton path: converges where L-BFGS-B stalled, keeps the
    projected equilibrium modulus optimal, and scores the clamped case."""

    def test_converges_where_lbfgsb_stalled(self):
        # Regression. The former L-BFGS-B solver stopped on its relative-f
        # test with the gradient still O(1) once the penalty made the Hessian
        # ill-conditioned: on this very fixture at N=50, smoothness=1 it
        # returned chi2_reduced = 7.9 with max |grad| = 0.67 and no posterior
        # (C not positive definite there), against 0.013 and ~1e-10 at the
        # true minimum.
        omega, E_stor, E_loss, std = _broadband_master_curve(1000)
        tau_i, E_i, quality = smooth_prony_fit(
            omega, E_stor, E_loss, E_stor_std=std, E_loss_std=std,
            N=50, smoothness=1.0, solid=True, return_fit_quality=True,
        )
        self.assertTrue(np.all(np.isfinite(E_i)))
        self.assertLess(quality.chi2_reduced, 0.1)
        self.assertIsNotNone(quality.neg_log_posterior)
        self.assertLess(
            _penalized_gradient(omega, E_stor, E_loss, std, tau_i, E_i,
                                1.0, True),
            1e-3,
        )

    def test_stationary_across_term_count_and_smoothness(self):
        # The ill-conditioning grows with both N and the penalty weight; the
        # stall regressed differently at each corner of this grid. Stationarity
        # is the solver-independent statement of "converged".
        omega, E_stor, E_loss, std = _broadband_master_curve(600)
        for N in (20, 60, 100):
            for smoothness in (0.01, 1.0, 10.0):
                for solid in (True, False):
                    with self.subTest(N=N, smoothness=smoothness, solid=solid):
                        tau_i, E_i = smooth_prony_fit(
                            omega, E_stor, E_loss,
                            E_stor_std=std, E_loss_std=std,
                            N=N, smoothness=smoothness, solid=solid,
                        )
                        self.assertTrue(np.all(np.isfinite(E_i)))
                        self.assertTrue(np.all(E_i >= 0))
                        self.assertLess(
                            _penalized_gradient(
                                omega, E_stor, E_loss, std, tau_i, E_i,
                                smoothness, solid),
                            1e-2,
                        )

    def test_extreme_smoothness_stays_finite(self):
        # Penalty weight ~1e4 x the data term: the regime where unbounded BFGS
        # overflowed exp() to NaN from the NNLS seed. The trust region plus the
        # flat seed (zero curvature, so the penalty contributes nothing to the
        # first step) keep every coefficient finite.
        omega, E_stor, E_loss, std = _broadband_master_curve(600)
        for solid in (True, False):
            with self.subTest(solid=solid):
                tau_i, E_i, quality = smooth_prony_fit(
                    omega, E_stor, E_loss, E_stor_std=std, E_loss_std=std,
                    N=100, smoothness=100.0, solid=solid,
                    return_fit_quality=True,
                )
                self.assertTrue(np.all(np.isfinite(E_i)))
                self.assertTrue(np.isfinite(quality.chi2_reduced))
                self.assertTrue(np.isfinite(quality.curvature))

    def test_equilibrium_modulus_is_optimal_for_the_decaying_terms(self):
        # Variable projection's guarantee: E_eq is the closed-form
        # non-negative least-squares value given the returned decaying
        # coefficients, on the FULL weighted problem, not just the reduced one.
        omega, E_stor, E_loss, std = _unresolved_equilibrium_curve()
        tau_i, E_i = smooth_prony_fit(
            omega, E_stor, E_loss, E_stor_std=std, E_loss_std=std,
            N=10, smoothness=0.1, solid=True,
        )
        self.assertGreater(E_i[0], 0)
        weights = np.concatenate((std, std))
        basis = prony_basis(omega, tau_i, solid=True) / weights[:, None]
        data = np.concatenate((E_stor, E_loss)) / weights
        r0 = basis[:, 0]
        resid = data - basis[:, 1:] @ E_i[1:]
        np.testing.assert_allclose(E_i[0], (r0 @ resid) / (r0 @ r0), rtol=1e-8)

    def test_clamped_equilibrium_is_exactly_zero_and_still_scored(self):
        # When the data cannot support an equilibrium modulus the projection
        # clamps it at EXACTLY zero (an active set, not a rounding artifact).
        # The fit is then the solid=False fit of the decaying terms, and the
        # readout must say so with finite numbers rather than go blank: the
        # posterior is the one of the N-term problem the solver converged on.
        omega, E_stor, E_loss, std = _unresolved_equilibrium_curve()
        kwargs = dict(E_stor_std=std, E_loss_std=std, N=10, smoothness=4.3,
                      return_fit_quality=True)
        _, E_solid, q_solid = smooth_prony_fit(
            omega, E_stor, E_loss, solid=True, **kwargs)
        _, E_visc, q_visc = smooth_prony_fit(
            omega, E_stor, E_loss, solid=False, **kwargs)
        self.assertEqual(E_solid[0], 0.0)
        self.assertEqual(len(E_solid), 11)
        for field in ('chi2_reduced', 'neg_log_posterior', 'curvature'):
            value = getattr(q_solid, field)
            self.assertIsNotNone(value)
            self.assertTrue(np.isfinite(value))
        # Same optimum to within the one-parameter difference in dof that
        # feeds the normalized penalty weight.
        np.testing.assert_allclose(E_solid[1:], E_visc, rtol=5e-3)
        self.assertAlmostEqual(q_solid.chi2_reduced, q_visc.chi2_reduced,
                               delta=5e-3 * q_visc.chi2_reduced)
        self.assertAlmostEqual(q_solid.neg_log_posterior,
                               q_visc.neg_log_posterior, delta=0.5)

    def _reduced_hessian(self, omega, E_stor, E_loss, std, tau_i, x,
                         smoothness, solid, dof):
        """Hess V of the reduced system smooth_prony_fit minimizes, at x."""
        m = len(tau_i) + solid
        R, z = _prony_reduce(
            omega, E_stor, E_loss, std, std, tau_i, solid, 1.0)
        scaled = _scaled_smoothness(
            smoothness, len(tau_i), dof, np.log(tau_i[-1] / tau_i[0]))
        return _PronyLoss(z[:m], R[:m], scaled, solid).hess(x)

    def _assert_two_inverse_hessians(self, cov, H):
        m = len(H)
        np.testing.assert_array_equal(cov, cov.T)
        np.linalg.cholesky(cov)  # raises unless positive definite
        err = np.abs(cov @ H - 2 * np.eye(m)).max()
        self.assertLess(err, 1e-8 * np.linalg.norm(H) * np.linalg.norm(cov))

    def test_covariance_rows_follow_the_solver_parameterization(self):
        """Interior solid fit: (N+1, N+1), log E_eq first. Clamped E_eq = 0
        and solid=False: (N, N), decaying terms only. Each is 2 inv(Hess V)
        of the reduced problem the solver had; the NNLS path has none."""
        omega, E_stor, E_loss, std = _unresolved_equilibrium_curve()
        N = 10
        n_res = 2 * len(omega)
        kwargs = dict(E_stor_std=std, E_loss_std=std, N=N,
                      return_fit_quality=True)
        args = (omega, E_stor, E_loss, std)

        tau_i, E_i, q = smooth_prony_fit(
            omega, E_stor, E_loss, smoothness=0.1, solid=True, **kwargs)
        self.assertGreater(E_i[0], 0)
        self.assertEqual(q.covariance.shape, (N + 1, N + 1))
        H = self._reduced_hessian(
            *args, tau_i, np.log(E_i), 0.1, True, n_res - (N + 1))
        self._assert_two_inverse_hessians(q.covariance, H)

        tau_i, E_i, q = smooth_prony_fit(
            omega, E_stor, E_loss, smoothness=4.3, solid=True, **kwargs)
        self.assertEqual(E_i[0], 0.0)
        self.assertEqual(q.covariance.shape, (N, N))
        R, z = _prony_reduce(
            omega, E_stor, E_loss, std, std, tau_i, True, 1.0)
        scaled = _scaled_smoothness(
            4.3, N, n_res - (N + 1), np.log(tau_i[-1] / tau_i[0]))
        H = _PronyLoss(z[:N + 1], R[:N + 1, 1:], scaled, False).hess(
            np.log(E_i[1:]))
        self._assert_two_inverse_hessians(q.covariance, H)

        tau_i, E_i, q = smooth_prony_fit(
            omega, E_stor, E_loss, smoothness=0.1, solid=False, **kwargs)
        self.assertEqual(q.covariance.shape, (N, N))
        H = self._reduced_hessian(
            *args, tau_i, np.log(E_i), 0.1, False, n_res - N)
        self._assert_two_inverse_hessians(q.covariance, H)

        _, _, q = smooth_prony_fit(
            omega, E_stor, E_loss, smoothness=0.0, solid=True, **kwargs)
        self.assertIsNone(q.covariance)

    def test_plateau_projection_is_exact(self):
        # With E_eq > 0 the projected loss, gradient and Hessian must equal the
        # full solid=True ones at (log E_eq(x), x): the loss by construction,
        # the gradient because dV/dE_eq = 0 there, the Hessian as the Schur
        # complement eliminating the log E_eq row — exact, not an envelope
        # approximation, since V is quadratic in E_eq for fixed x.
        rng = np.random.default_rng(7)
        N, m = 8, 9
        basis = np.abs(rng.normal(size=(m, m))) + 0.3
        truth = np.exp(rng.normal(size=m))
        data = basis @ truth
        # Undershoot the decaying terms so the residual wants E_eq > 0.
        x = np.log(0.5 * truth[1:])
        problem = _PlateauProjectedProblem(data, basis, 0.8)
        E_eq = problem.equilibrium(x)
        self.assertGreater(E_eq, 0)
        full_x = np.concatenate(([np.log(E_eq)], x))
        loss_full, grad_full = _prony_objective(full_x, data, basis, 0.8, True)
        loss, grad = problem.fun(x), problem.jac(x)
        self.assertAlmostEqual(loss, loss_full, delta=1e-9 * loss_full)
        self.assertAlmostEqual(grad_full[0], 0.0, delta=1e-9 * np.abs(grad_full).max())
        np.testing.assert_allclose(grad, grad_full[1:], rtol=1e-9,
                                   atol=1e-12 * np.abs(grad_full).max())
        H = _prony_hessian(full_x, data, basis, 0.8, True)
        schur = H[1:, 1:] - np.outer(H[1:, 0], H[0, 1:]) / H[0, 0]
        np.testing.assert_allclose(problem.hess(x), schur, rtol=1e-9,
                                   atol=1e-12 * np.abs(schur).max())
        np.testing.assert_allclose(
            problem.coefficients(x), np.concatenate(([E_eq], np.exp(x))))

    def test_plateau_projection_builds_one_shared_penalty(self):
        """The clamped and free losses share one penalty matrix: Hessians on
        both branches build it once in total."""
        rng = np.random.default_rng(7)
        m = 9
        basis = np.abs(rng.normal(size=(m, m))) + 0.3
        truth = np.exp(rng.normal(size=m))
        data = basis @ truth
        x_free = np.log(0.5 * truth[1:])
        x_clamp = np.log(2.0 * truth[1:])
        problem = _PlateauProjectedProblem(data, basis, 0.8)
        self.assertGreater(problem.equilibrium(x_free), 0)
        self.assertEqual(problem.equilibrium(x_clamp), 0.0)
        with mock.patch.object(objective, '_add_penalty_inplace',
                               wraps=objective._add_penalty_inplace) as build:
            problem.hess(x_free)
            H_clamp = problem.hess(x_clamp)
            problem.hess(x_free + 0.1)
            self.assertEqual(build.call_count, 1)
        want = 2 * _dense_half_hessian(x_clamp, data, basis[:, 1:], 0.8, 0)
        np.testing.assert_allclose(H_clamp, want, rtol=1e-12,
                                   atol=1e-12 * np.abs(want).max())

    def test_prony_loss_guard_rejects_overflowing_proposals(self):
        # A proposal with any log-coefficient above the cap must read as +inf
        # so the trust region shrinks instead of feeding exp() overflow into
        # the reduced basis, where inf * mixed signs becomes NaN and scipy's
        # trust-region loop neither accepts nor shrinks. Off by default.
        rng = np.random.default_rng(3)
        basis = np.abs(rng.normal(size=(6, 6))) + 0.3
        data = basis @ np.exp(rng.normal(size=6))
        over = np.full(6, 1.0)
        over[-1] = 20.5
        unguarded = _PronyLoss(data, basis, 0.3, False)
        self.assertTrue(np.isfinite(unguarded.fun(over)))
        guarded = _PronyLoss(data, basis, 0.3, False, log_cap=20.0)
        self.assertTrue(np.isfinite(guarded.fun(np.full(6, 19.0))))
        self.assertEqual(guarded.fun(over), np.inf)
        grad = guarded.jac(over)
        self.assertEqual(grad.shape, (6,))
        self.assertTrue(np.all(np.isfinite(grad)))
        # The projected problem inherits it through its two _PronyLoss views.
        projected = _PlateauProjectedProblem(data, basis, 0.3, log_cap=20.0)
        self.assertEqual(projected.fun(over[1:]), np.inf)
        self.assertTrue(np.all(np.isfinite(projected.jac(over[1:]))))


BUNDLED_DIR = os.path.abspath(os.path.join(
    os.path.dirname(__file__), '..', '..', '..', 'app', 'public', 'docs',
    'dynamfit',
))

BUNDLED_MASTER_CURVES = (
    'Cavaille-PS-98k-master-93C.csv',
    'PETMP-TATATO-OLD-wide-bar-55C_mastercurve.tsv',
    'PMMA-R09-master-clean-148C.csv',
    'VeroCyan-80C_mastercurve.tsv',
    'agilus30-20C_mastercurve.tsv',
    'dgeba-ipd-wide-bar-170C_mastercurve.tsv',
    'fisher-polycarbonate-150C_mastercurve.csv',
)


def _exp_minus_v_surprisal(omega, E_stor, E_loss, sigma, std_scale, tau_i,
                           E_i, smoothness):
    """The exp(-V) convention's surprisal at a fit smooth_prony_fit returned.

    The score as it reads when the posterior is taken to be exp(-V), i.e. as
    if the noise were the stated error divided by sqrt(2): V in place of V/2,
    and pi in place of 2 pi. The penalty weight lam is read off the fit itself
    through stationarity, 0 = r.T @ J + lam * A x, rather than rebuilt from
    the knob, so this reference does not depend on how the knob is scaled.
    A clamped equilibrium term is scored as the solid=False problem in the
    decaying terms, as smooth_prony_fit scores it.
    """
    R, z = _prony_reduce(omega, E_stor, E_loss, sigma, sigma, tau_i, True,
                         std_scale)
    if E_i[0] > 0:
        x, basis, solid = np.log(E_i), R, True
    else:
        x, basis, solid = np.log(E_i[1:]), R[:, 1:], False
    m = len(x)
    npen = m - solid
    rj = _PronyLoss(z, basis, 0.0, solid).jac(x) / 2
    d2 = np.diff(x[solid:], n=2)
    Ax = np.zeros(m)
    Ax_pen = Ax[solid:]
    Ax_pen[:-2] += d2
    Ax_pen[1:-1] -= 2 * d2
    Ax_pen[2:] += d2
    lam = -(rj @ Ax) / (Ax @ Ax)
    loss = _PronyLoss(z, basis, np.sqrt(lam), solid)
    logpdetA = np.log(npen ** 2 * (npen ** 2 - 1) / 12)
    return (
        loss.fun(x)
        - 0.5 * (logpdetA + (npen - 2) * np.log(lam)
                 - np.linalg.slogdet(loss.hess(x))[1])
        - 0.5 * (m * np.log(2) + (2 + solid) * np.log(np.pi))
        + smoothness ** 2
    )


class TestSurprisalOnBundledMasterCurves(unittest.TestCase):
    """Minimizing the surprisal on the bundled master curves, fitted the way
    the app fits them: sigma = 1% of |E*|, N from prony_terms_for_span."""

    RELATIVE_ERROR = 0.01

    @classmethod
    def setUpClass(cls):
        cls.curves = {}
        with mock.patch.object(Config, 'FILES_DIRECTORY', BUNDLED_DIR):
            for name in BUNDLED_MASTER_CURVES:
                upload = upload_init(name, 'frequency')
                cls.curves[name] = (
                    upload['Frequency'], upload['E Storage'], upload['E Loss'],
                )

    def test_surprisal_prefers_more_smoothing_than_the_exp_minus_v_convention(
            self):
        # Halving V halves the misfit's pull against the prior, so the
        # evidence-preferred smoothness rises: the user measured 1.5x to 4.4x
        # across these files. Each fit is scored both ways, a third-decade
        # grid in log10(smoothness) brackets each argmin, and a bounded
        # scalar search refines it to 0.01 decade; the 1.1x margin is several
        # times that resolution. The grid's 0.75-decade offset keeps every
        # point off log10(smoothness) = -1.35 on VeroCyan, where trust-exact
        # meets a NaN Cholesky factor and scipy raises.
        coarse = np.arange(-8, 7) / 3 + 0.75
        for name, (omega, E_stor, E_loss) in self.curves.items():
            with self.subTest(file=name):
                sigma = np.abs(E_stor + 1.0j * E_loss)
                N = prony_terms_for_span(omega)
                scores = {}

                def scored(log_s):
                    if log_s not in scores:
                        s = 10.0 ** log_s
                        tau_i, E_i, quality = smooth_prony_fit(
                            omega, E_stor, E_loss, sigma, sigma, N, s,
                            return_fit_quality=True,
                            std_scale=self.RELATIVE_ERROR,
                        )
                        self.assertIsNotNone(quality.neg_log_posterior)
                        scores[log_s] = (
                            quality.neg_log_posterior,
                            _exp_minus_v_surprisal(
                                omega, E_stor, E_loss, sigma,
                                self.RELATIVE_ERROR, tau_i, E_i, s),
                        )
                    return scores[log_s]

                grid = [scored(float(log_s)) for log_s in coarse]
                argmin = []
                for k in (0, 1):
                    i = int(np.argmin([pair[k] for pair in grid]))
                    self.assertTrue(0 < i < len(coarse) - 1,
                                    msg=f'argmin at grid edge: {i}')
                    best = minimize_scalar(
                        lambda log_s: scored(log_s)[k],
                        bounds=(coarse[i - 1], coarse[i + 1]),
                        method='bounded', options=dict(xatol=0.01),
                    )
                    argmin.append(best.x)
                reported, exp_minus_v = argmin
                self.assertGreater(
                    10 ** (reported - exp_minus_v), 1.1,
                    msg=f'smoothness {10 ** reported:.4g} (reported) vs '
                        f'{10 ** exp_minus_v:.4g} (exp(-V))',
                )


def _integral_curvature_weight(smoothness, N, dof, log_range):
    """smoothness * sqrt(dof / ell**3), ell = log_range / (N - 1).

    With this weight lam * |d2|**2 is smoothness**2 * dof times the
    rectangle-rule INTEGRAL of (d2 lnE / d(ln tau)**2)**2, ell per interior
    node; _scaled_smoothness charges its MEAN over the N - 2 interior nodes,
    so the two agree at a knob sqrt((N - 2) * ell) apart. Built from ell
    alone so the tests below never read _scaled_smoothness for it.
    """
    ell = log_range / (N - 1)
    return smoothness * np.sqrt(dof / ell ** 3)


def _fit_at_weight(omega, E_stor, E_loss, std, N, weight, solid=True,
                   std_scale=1.0):
    """A smoothed fit at an explicit penalty weight, solved the way
    smooth_prony_fit solves it: the same reduction, the same projected
    problem, the same flat seed and the same trust-exact Newton. Returns
    (tau_i, E_i, R, z)."""
    tau_i = prony_relaxation_space(1 / omega.max(), 1 / omega.min(), N)
    m = N + solid
    R, z = _prony_reduce(omega, E_stor, E_loss, std, std, tau_i, solid,
                         std_scale)
    log_cap = np.log(E_stor.max()) + np.log(1e3)
    if solid:
        problem = _PlateauProjectedProblem(z[:m], R[:m], weight, log_cap)
    else:
        problem = _PronyLoss(z[:m], R[:m], weight, False, log_cap)
    x0 = np.full(N, np.log(E_stor.max() / m))
    with np.errstate(over='ignore', invalid='ignore'):
        result = minimize(problem.fun, x0, jac=problem.jac, hess=problem.hess,
                          method='trust-exact')
    E_i = problem.coefficients(result.x) if solid else np.exp(result.x)
    return tau_i, E_i, R, z


def _bundled_master_curve(name):
    """(omega, E_stor, E_loss, sigma) of a bundled file, sigma = |E*|."""
    with mock.patch.object(Config, 'FILES_DIRECTORY', BUNDLED_DIR):
        upload = upload_init(name, 'frequency')
    omega = upload['Frequency']
    E_stor, E_loss = upload['E Storage'], upload['E Loss']
    return omega, E_stor, E_loss, np.abs(E_stor + 1.0j * E_loss)


class TestSmoothnessPerUnitLogTau(unittest.TestCase):
    """The knob weighs misfit per degree of freedom against the mean curvature
    over the interior nodes (the smoothness-weight definition of the
    manuscript), so one setting means the same thing on master curves of any
    span.

    Tested by cropping: a curve fitted on half its span at one setting should
    keep the spectrum the full-span fit gives there. The weight that best
    reproduces the full-span fit on a crop is close to lam_full itself (within
    0.84-1.19 lam_full in 23 of 28 bundled cases at smoothness <= 1), so a
    rule passes by carrying lam across the cut. The mean-curvature weight
    smoothness**2 * nu / ((N - 2) * ell**4) does, up to the change in data
    per interior node nu / (N - 2): lam_crop / lam_full is 0.65 to 1.34 on
    the bundled files. The integral-curvature weight smoothness**2 * nu /
    ell**3 drops the node count and lands a further factor of about 1/2 low.
    """

    RELATIVE_ERROR = 0.01

    @classmethod
    def setUpClass(cls):
        cls.curves = {name: _bundled_master_curve(name)
                      for name in BUNDLED_MASTER_CURVES}

    def test_objective_per_dof_is_misfit_plus_smoothness_squared_curvature(
            self):
        # V / nu = misfit / nu + smoothness**2 * curvature, nu being the
        # classical n_resid - m the penalty weight is normalized by: the
        # readout's two numbers and the knob are the whole objective, with
        # no span factor left over. chi2_reduced is the misfit per EFFECTIVE
        # degree of freedom, so the misfit is chi2_reduced * nu_eff. The
        # clamped-equilibrium fit is scored as the solid=False problem in N
        # terms; its weight keeps the pinned term in m, while nu_eff charges
        # only gamma for it.
        broadband = _broadband_master_curve(600)
        unresolved = _unresolved_equilibrium_curve()
        cases = [
            ('interior, solid', broadband, 30, 0.1, True),
            ('interior, viscous', broadband, 30, 0.1, False),
            ('clamped equilibrium', unresolved, 10, 4.3, True),
        ]
        for label, (omega, E_stor, E_loss, std), N, smoothness, solid in cases:
            with self.subTest(label):
                tau_i, E_i, quality = smooth_prony_fit(
                    omega, E_stor, E_loss, E_stor_std=std, E_loss_std=std,
                    N=N, smoothness=smoothness, solid=solid,
                    return_fit_quality=True,
                )
                R, z = _prony_reduce(
                    omega, E_stor, E_loss, std, std, tau_i, solid)
                n_resid = 2 * len(omega)
                nu = n_resid - (N + solid)
                if label == 'clamped equilibrium':
                    self.assertEqual(E_i[0], 0.0)
                    x, basis, pen_solid = np.log(E_i[1:]), R[:, 1:], False
                else:
                    self.assertTrue(np.all(E_i > 0))
                    x, basis, pen_solid = np.log(E_i), R, solid
                nu_eff = n_resid - (quality.effective_terms + pen_solid)
                log_range = np.log(tau_i[-1] / tau_i[0])
                weight = _scaled_smoothness(smoothness, N, nu, log_range)
                V = _PronyLoss(z, basis, weight, pen_solid).fun(x)
                np.testing.assert_allclose(
                    V / nu,
                    quality.chi2_reduced * nu_eff / nu
                    + smoothness ** 2 * quality.curvature,
                    rtol=1e-10,
                )

    def test_knob_times_sqrt_interior_length_is_the_integral_curvature_fit(
            self):
        # Charging the mean curvature at smoothness * sqrt((N - 2) * ell),
        # (N - 2) * ell being the length the rectangle rule gives the
        # interior nodes, is charging the integral at smoothness: the same
        # weight, so the same optimum to solver precision, with the same
        # chi2_reduced and curvature. The reference fit builds its weight
        # from ell alone.
        sigma_cases = []
        omega, E_stor, E_loss, std = _broadband_master_curve(600)
        sigma_cases.append(('broadband', omega, E_stor, E_loss, std, 1.0, 30))
        omega, E_stor, E_loss, sigma = _bundled_master_curve(
            'PMMA-R09-master-clean-148C.csv')
        sigma_cases.append(('PMMA', omega, E_stor, E_loss, sigma,
                            self.RELATIVE_ERROR, prony_terms_for_span(omega)))
        smoothness = 0.05
        for label, omega, E_stor, E_loss, std, scale, N in sigma_cases:
            with self.subTest(label):
                log_range = np.log(omega.max() / omega.min())
                ell = log_range / (N - 1)
                dof = 2 * len(omega) - (N + 1)
                _, E_i, quality = smooth_prony_fit(
                    omega, E_stor, E_loss, std, std, N,
                    smoothness * np.sqrt((N - 2) * ell),
                    return_fit_quality=True, std_scale=scale,
                )
                _, E_ref, R, z = _fit_at_weight(
                    omega, E_stor, E_loss, std, N,
                    _integral_curvature_weight(smoothness, N, dof, log_range),
                    std_scale=scale,
                )
                np.testing.assert_allclose(E_i, E_ref, rtol=1e-9)
                self.assertGreater(E_i[0], 0)
                resid = z - R @ E_ref
                d2 = np.diff(np.log(E_ref[1:]), n=2)
                nu_eff = 2 * len(omega) - (quality.effective_terms + 1)
                np.testing.assert_allclose(
                    quality.chi2_reduced, resid @ resid / nu_eff, rtol=1e-9)
                np.testing.assert_allclose(
                    quality.curvature,
                    d2 @ d2 / ((N - 2) * ell ** 4), rtol=1e-9)

    def test_halving_the_span_keeps_the_retained_spectrum_near_the_full_fit(
            self):
        # One knob setting on each bundled master curve and on its upper half
        # in log10(omega), 3 terms per decade on each (prony_terms_for_span),
        # at 1% relative error and smoothness 0.3, the app's default. The
        # distance is the RMS gap in ln E_i between the half-span fit and the
        # full-span fit interpolated onto its tau grid, leaving out the decade
        # next to the cut, where the half fit has no data beyond its edge
        # whatever the prior.
        #
        # The comparison is against the integral-curvature weight at
        # smoothness / sqrt((N_full - 2) * ell_full), which gives the SAME
        # full-span fit, so only the crop separates the two. The full-span
        # equality pins the production weight to the mean rule: a weight off
        # by a span factor (N - 1) / (N - 2) moves E_i by 6e-3 to 3e-2 and
        # fails there before any crop is compared, while the two solves stop
        # up to 3e-9 apart (agilus), hence rtol 1e-7. Measured gap ratios (mean
        # over integral): Cavaille 0.48, PETMP 0.57, PMMA 0.37, VeroCyan
        # 0.40, agilus 0.49, dgeba 0.86, fisher 0.22; pooled 0.43. Under a
        # strong prior (effective smoothness >~ 10) or on the lower-half crop
        # both fits sit near the prior and the comparison does not
        # discriminate, so neither is asserted. That includes the synthetic
        # broadband curve at its own sigma = 0.2 |E*|, an effective knob
        # 20-60x this one; at 1% and smoothness 0.3-1 it agrees (gap ratios
        # 0.40-0.51). That the weight carries across a crop at all follows
        # from its sharing a normalization with the curvature readout, which
        # TestPronyFitQuality checks is exact on any crop:
        # test_curvature_is_exact_for_a_constant_second_derivative.
        smoothness = 0.3
        mean_gaps, integral_gaps = [], []
        for name, (omega, E_stor, E_loss, sigma) in self.curves.items():
            with self.subTest(file=name):
                lo, hi = np.log10(omega.min()), np.log10(omega.max())
                keep = np.log10(omega) >= (lo + hi) / 2
                N_full = prony_terms_for_span(omega)
                ell_full = np.log(omega.max() / omega.min()) / (N_full - 1)
                spans = {
                    'full': (omega, E_stor, E_loss, sigma),
                    'half': (omega[keep], E_stor[keep], E_loss[keep],
                             sigma[keep]),
                }
                mean_fits, integral_fits = {}, {}
                for span, (o, Es, El, s) in spans.items():
                    N = prony_terms_for_span(o)
                    mean_fits[span] = smooth_prony_fit(
                        o, Es, El, s, s, N, smoothness,
                        std_scale=self.RELATIVE_ERROR,
                    )
                    weight = _integral_curvature_weight(
                        smoothness / np.sqrt((N_full - 2) * ell_full), N,
                        2 * len(o) - (N + 1), np.log(o.max() / o.min()))
                    integral_fits[span] = _fit_at_weight(
                        o, Es, El, s, N, weight,
                        std_scale=self.RELATIVE_ERROR)[:2]
                np.testing.assert_allclose(
                    mean_fits['full'][1], integral_fits['full'][1], rtol=1e-7)

                def distance(fits):
                    tau_full, E_full = fits['full']
                    tau_half, E_half = fits['half']
                    inner = np.log10(tau_half) <= np.log10(tau_half[-1]) - 1
                    on_half = np.interp(np.log(tau_half[inner]),
                                        np.log(tau_full), np.log(E_full[1:]))
                    gap = np.log(E_half[1:][inner]) - on_half
                    return np.sqrt(np.mean(gap ** 2))

                mean_gap = distance(mean_fits)
                integral_gap = distance(integral_fits)
                mean_gaps.append(mean_gap)
                integral_gaps.append(integral_gap)
                self.assertLess(
                    mean_gap, integral_gap,
                    msg=f'RMS gap in ln E_i: {mean_gap:.3f} (mean curvature)'
                        f' vs {integral_gap:.3f} (integral curvature)',
                )
        self.assertEqual(len(mean_gaps), len(self.curves),
                         msg='a file failed before its gaps were measured')
        pooled = np.sqrt(np.mean(np.square(mean_gaps))
                         / np.mean(np.square(integral_gaps)))
        self.assertLess(
            pooled, 0.6,
            msg=f'pooled RMS gap ratio (mean / integral curvature): '
                f'{pooled:.3f}',
        )


TRIVE_FILES_DIR = os.path.abspath(os.path.join(
    os.path.dirname(__file__), '..', '..', 'app', 'trive', 'files'))


def _dense_effective_terms(covariance, lam, solid):
    """MacKay's gamma = npen - lam * tr(L.T @ L @ Sigma), with the
    second-difference operator L over the penalized terms built densely."""
    m = len(covariance)
    npen = m - solid
    L = np.zeros((max(npen - 2, 0), m))
    rows = np.arange(max(npen - 2, 0))
    L[rows, solid + rows] = 1.0
    L[rows, solid + rows + 1] = -2.0
    L[rows, solid + rows + 2] = 1.0
    return npen - lam * np.trace(L.T @ L @ covariance)


class TestMisfitPerEffectiveDegreeOfFreedom(unittest.TestCase):
    """chi2_reduced is the misfit per effective degree of freedom,
    n_resid - (gamma + e): gamma counts the decaying terms the data
    determined, e is 1 for a free (nonzero) equilibrium term. Without a
    covariance the classical n_resid - m stands; the NNLS path counts its
    active set. The penalty weight keeps the classical count throughout."""

    FILE = 'agilus30 (8) master curve 20C.txt'
    RELATIVE_ERROR = 0.01

    @classmethod
    def setUpClass(cls):
        with mock.patch.object(Config, 'FILES_DIRECTORY', TRIVE_FILES_DIR):
            upload = upload_init(cls.FILE, 'frequency')
        cls.omega = upload['Frequency']
        cls.E_stor, cls.E_loss = upload['E Storage'], upload['E Loss']
        cls.sigma = np.abs(cls.E_stor + 1.0j * cls.E_loss)
        cls._fits = {}

    @classmethod
    def _agilus(cls, N, smoothness):
        """(tau_i, E_i, quality) of the file at 1% error, solid, cached."""
        key = (N, smoothness)
        if key not in cls._fits:
            cls._fits[key] = smooth_prony_fit(
                cls.omega, cls.E_stor, cls.E_loss, cls.sigma, cls.sigma, N,
                smoothness, solid=True, return_fit_quality=True,
                std_scale=cls.RELATIVE_ERROR,
            )
        return cls._fits[key]

    def test_effective_terms_are_bounded_and_fall_as_smoothness_rises(self):
        # At most one per decaying term (a little slack: the Hessian is the
        # full one, not Gauss-Newton), and more smoothing hands more of them
        # to the prior.
        N = 32
        n_resid = 2 * len(self.omega)
        counts = []
        for smoothness in (0.1, 0.3, 1.0, 3.0):
            with self.subTest(smoothness=smoothness):
                tau_i, E_i, quality = self._agilus(N, smoothness)
                self.assertGreater(E_i[0], 0)
                lam = _scaled_smoothness(
                    smoothness, N, n_resid - (N + 1),
                    np.log(tau_i[-1] / tau_i[0])) ** 2
                gamma = quality.effective_terms
                self.assertAlmostEqual(
                    gamma,
                    _dense_effective_terms(quality.covariance, lam, True),
                    delta=1e-6 * N)
                self.assertGreater(gamma, 0.0)
                self.assertLessEqual(gamma, N + 1e-6)
                counts.append(gamma)
        self.assertEqual(len(counts), 4)
        for weaker, stronger in zip(counts, counts[1:]):
            self.assertGreaterEqual(weaker, stronger, msg=f'{counts}')
        self.assertGreater(counts[0], counts[-1])

    def test_chi2_reduced_is_invariant_to_grid_size_once_data_is_resolved(
            self):
        # Past what the data resolves, gamma saturates and the fit stops
        # changing, so the score must stop moving with N. The classical
        # n_resid - m charges every grid node and drifts several percent
        # over the same range: the regression this pins.
        smoothness = 1.0
        n_resid = 2 * len(self.omega)
        cap = reduction.prony_rank_limit(
            self.omega, self.E_stor, self.E_loss, self.sigma, self.sigma,
            solid=True, std_scale=self.RELATIVE_ERROR)
        self.assertGreaterEqual(cap, 64)
        sizes = (32, 48, cap)
        scores, classical = {}, {}
        for N in sizes:
            _, E_i, quality = self._agilus(N, smoothness)
            self.assertGreater(E_i[0], 0)
            self.assertIsNotNone(quality.effective_terms)
            scores[N] = quality.chi2_reduced
            misfit = quality.chi2_reduced * (
                n_resid - (quality.effective_terms + 1))
            classical[N] = misfit / (n_resid - (N + 1))
        for N in sizes[:-1]:
            with self.subTest(N=N):
                self.assertAlmostEqual(scores[N] / scores[cap], 1.0,
                                       delta=0.01)
                self.assertGreater(
                    abs(classical[N] / classical[cap] - 1.0), 0.02)

    def test_interior_fit_charges_gamma_plus_the_free_equilibrium_term(self):
        # Liquid: n_resid - gamma. Interior solid: n_resid - (gamma + 1).
        # gamma is read from the reported covariance at the fit's own
        # weight, whose dof is the classical n_resid - m.
        omega, E_stor, E_loss, std = _broadband_master_curve(600)
        N, smoothness = 30, 0.1
        n_resid = 2 * len(omega)
        for solid in (True, False):
            with self.subTest(solid=solid):
                tau_i, E_i, quality = smooth_prony_fit(
                    omega, E_stor, E_loss, E_stor_std=std, E_loss_std=std,
                    N=N, smoothness=smoothness, solid=solid,
                    return_fit_quality=True,
                )
                self.assertTrue(np.all(E_i > 0))
                R, z = _prony_reduce(
                    omega, E_stor, E_loss, std, std, tau_i, solid)
                resid = z - R @ E_i
                rr = resid @ resid
                lam = _scaled_smoothness(
                    smoothness, N, n_resid - (N + solid),
                    np.log(tau_i[-1] / tau_i[0])) ** 2
                gamma = _dense_effective_terms(quality.covariance, lam, solid)
                self.assertAlmostEqual(quality.effective_terms, gamma,
                                       delta=1e-6 * N)
                self.assertAlmostEqual(
                    quality.chi2_reduced * (n_resid - (gamma + solid)), rr,
                    delta=1e-8 * rr)

    def test_clamped_equilibrium_term_is_not_charged(self):
        # E_eq clamped to exactly 0 is not a parameter the data determined:
        # the denominator is n_resid - gamma, n_resid the full 2 * len(omega).
        omega, E_stor, E_loss, std = _unresolved_equilibrium_curve()
        N, smoothness = 10, 4.3
        n_resid = 2 * len(omega)
        tau_i, E_i, quality = smooth_prony_fit(
            omega, E_stor, E_loss, E_stor_std=std, E_loss_std=std,
            N=N, smoothness=smoothness, solid=True, return_fit_quality=True,
        )
        self.assertEqual(E_i[0], 0.0)
        R, z = _prony_reduce(omega, E_stor, E_loss, std, std, tau_i, True)
        resid = z - R[:, 1:] @ E_i[1:]
        rr = resid @ resid
        lam = _scaled_smoothness(
            smoothness, N, n_resid - (N + 1),
            np.log(tau_i[-1] / tau_i[0])) ** 2
        gamma = _dense_effective_terms(quality.covariance, lam, False)
        self.assertAlmostEqual(quality.effective_terms, gamma,
                               delta=1e-6 * N)
        self.assertAlmostEqual(quality.chi2_reduced * (n_resid - gamma), rr,
                               delta=1e-8 * rr)

    def test_clamped_score_keeps_the_fits_own_penalty_weight(self):
        # Only the chi2 denominator moves: the clamped fit's weight counts
        # the pinned term in m = N + 1, and the reported covariance is
        # 2 inv(Hess V) at THAT weight. The weight at n_resid - N leaves a
        # gradient ~1e6 times larger at the returned coefficients.
        omega, E_stor, E_loss, std = _unresolved_equilibrium_curve()
        N, smoothness = 10, 4.3
        n_resid = 2 * len(omega)
        tau_i, E_i, quality = smooth_prony_fit(
            omega, E_stor, E_loss, E_stor_std=std, E_loss_std=std,
            N=N, smoothness=smoothness, solid=True, return_fit_quality=True,
        )
        self.assertEqual(E_i[0], 0.0)
        R, z = _prony_reduce(omega, E_stor, E_loss, std, std, tau_i, True)
        x = np.log(E_i[1:])
        weight = _scaled_smoothness(
            smoothness, N, n_resid - (N + 1), np.log(tau_i[-1] / tau_i[0]))
        loss = _PronyLoss(z, R[:, 1:], weight, False)
        self.assertLess(np.abs(loss.jac(x)).max(), 1e-6)
        H = loss.hess(x)
        err = np.abs(quality.covariance @ H - 2 * np.eye(N)).max()
        self.assertLess(
            err, 1e-8 * np.linalg.norm(H) * np.linalg.norm(quality.covariance))

    def test_no_covariance_falls_back_to_the_classical_count(self):
        # Hess V not positive definite: no covariance, no gamma, and the
        # misfit is per n_resid - m as before.
        omega, E_stor, E_loss, std = _broadband_master_curve(600)
        N = 30
        n_resid = 2 * len(omega)
        with mock.patch('app.trive.quality._cholesky_or_none',
                        return_value=None):
            tau_i, E_i, quality = smooth_prony_fit(
                omega, E_stor, E_loss, E_stor_std=std, E_loss_std=std,
                N=N, smoothness=0.1, solid=True, return_fit_quality=True,
            )
        self.assertIsNone(quality.covariance)
        self.assertIsNone(quality.effective_terms)
        R, z = _prony_reduce(omega, E_stor, E_loss, std, std, tau_i, True)
        resid = z - R @ E_i
        rr = resid @ resid
        self.assertAlmostEqual(quality.chi2_reduced * (n_resid - (N + 1)),
                               rr, delta=1e-8 * rr)


def _probe_tau(omega):
    """The rank probe's relaxation grid, rebuilt from its definition."""
    return prony_relaxation_space(
        1 / omega.max(), 1 / omega.min(), reduction._RANK_PROBE_TERMS)


def _dense_probe_gamma(omega, E_stor, E_loss, std, std_scale, tau_i, E_i,
                       smoothness, solid):
    """prony_resolution's smoothed definition, built densely from the basis:
    the fit resampled onto the probe (log-linear in log tau, times
    h_probe / h_fit), Gauss-Newton Hessian plus lam' L.T L, and
    gamma = N_probe - lam' tr(L.T L inv(H)). The equilibrium column is kept
    only when E_i[0] > 0."""
    tau_p = _probe_tau(omega)
    n_probe = len(tau_p)
    weights = std_scale * np.concatenate((std, std))
    basis = prony_basis(omega, tau_p, solid) / weights[:, None]
    log_fit, log_probe = np.log(tau_i), np.log(tau_p)
    h_fit = (log_fit[-1] - log_fit[0]) / (len(tau_i) - 1)
    h_probe = (log_probe[-1] - log_probe[0]) / (n_probe - 1)
    E_dec = E_i[len(E_i) - len(tau_i):]
    c = np.exp(np.interp(log_probe, log_fit, np.log(E_dec))) * h_probe / h_fit
    keep_eq = bool(solid and E_i[0] > 0)
    if keep_eq:
        c = np.concatenate(([E_i[0]], c))
    elif solid:
        basis = basis[:, 1:]
    J = basis * c
    L = np.zeros((n_probe - 2, len(c)))
    for k in range(n_probe - 2):
        L[k, keep_eq + k:keep_eq + k + 3] = (1.0, -2.0, 1.0)
    lam = _scaled_smoothness(
        smoothness, n_probe, 2 * len(omega) - (n_probe + solid),
        log_probe[-1] - log_probe[0]) ** 2
    H = J.T @ J + lam * L.T @ L
    return n_probe - lam * np.trace(L.T @ L @ np.linalg.inv(H))


class TestPronyNoiseCeiling(unittest.TestCase):
    """reduction.prony_noise_ceiling: the number of probe singular values
    sigma_k with sigma_k * max(E_stor) > 1. Server-side only; it bounds the
    resolution counts the grid suggestion is built on."""

    def setUp(self):
        reduction._REDUCE_CACHE.clear()

    def test_counts_probe_singular_values_above_one_over_the_peak_storage(
            self):
        omega, E_stor, E_loss, sigma = _bundled_master_curve(
            'agilus30-20C_mastercurve.tsv')
        for std_scale in (0.01, 0.05):
            with self.subTest(std_scale=std_scale):
                ceiling = reduction.prony_noise_ceiling(
                    omega, E_stor, E_loss, sigma, sigma,
                    std_scale=std_scale)
                R, _ = _prony_reduce(omega, E_stor, E_loss, sigma, sigma,
                                     _probe_tau(omega), True, std_scale)
                singular = np.linalg.svd(R, compute_uv=False)
                self.assertIs(type(ceiling), int)
                self.assertEqual(
                    ceiling,
                    int(np.count_nonzero(singular * E_stor.max() > 1)))

    def test_moves_with_the_error_level_unlike_the_rank_cap(self):
        omega, E_stor, E_loss, sigma = _bundled_master_curve(
            'agilus30-20C_mastercurve.tsv')
        tight, loose = (
            reduction.prony_noise_ceiling(
                omega, E_stor, E_loss, sigma, sigma, std_scale=rel)
            for rel in (0.01, 0.05))
        self.assertGreater(tight, loose)

    def test_bounds_resolution_and_effective_terms_on_bundled_curves(self):
        """An empirical consistency bound, not a theorem: on every bundled
        master curve, prony_resolution and the fit's effective_terms stay at
        or below the ceiling, at the default grid and at the rank cap."""
        # The ceiling is the count under an isotropic prior at the scale of
        # max(E_stor); the smoothing prior and NNLS positivity are the more
        # informative ones on these files.
        for name in BUNDLED_MASTER_CURVES:
            omega, E_stor, E_loss, sigma = _bundled_master_curve(name)
            for rel in (0.01, 0.05):
                ceiling = reduction.prony_noise_ceiling(
                    omega, E_stor, E_loss, sigma, sigma, std_scale=rel)
                cap = reduction.prony_rank_limit(
                    omega, E_stor, E_loss, sigma, sigma, std_scale=rel)
                for smoothness in (0.0, 0.1, 0.3, 1.0):
                    for N in (prony_terms_for_span(omega), cap):
                        with self.subTest(file=name, rel=rel,
                                          smoothness=smoothness, N=N):
                            tau_i, E_i, quality = smooth_prony_fit(
                                omega, E_stor, E_loss, sigma, sigma, N,
                                smoothness, return_fit_quality=True,
                                std_scale=rel)
                            resolution = reduction.prony_resolution(
                                omega, E_stor, E_loss, sigma, sigma,
                                tau_i, E_i, smoothness, std_scale=rel)
                            self.assertIsNotNone(resolution)
                            self.assertLessEqual(resolution, ceiling)
                            if quality.effective_terms is not None:
                                self.assertLessEqual(
                                    quality.effective_terms, ceiling)

    def test_exported_from_the_package(self):
        import app.trive as trive
        self.assertIs(trive.prony_noise_ceiling,
                      reduction.prony_noise_ceiling)
        self.assertIs(trive.prony_resolution, reduction.prony_resolution)


class TestPronyResolution(unittest.TestCase):
    """reduction.prony_resolution: how many relaxation terms a dense grid
    would resolve from the data. Unsmoothed, the probe grid's NNLS active
    set; smoothed, MacKay's gamma for the fit linearized onto the probe."""

    FILE = 'agilus30 (8) master curve 20C.txt'
    RELATIVE_ERROR = 0.01

    @classmethod
    def setUpClass(cls):
        with mock.patch.object(Config, 'FILES_DIRECTORY', TRIVE_FILES_DIR):
            upload = upload_init(cls.FILE, 'frequency')
        cls.omega = upload['Frequency']
        cls.E_stor, cls.E_loss = upload['E Storage'], upload['E Loss']
        cls.sigma = np.abs(cls.E_stor + 1.0j * cls.E_loss)
        cls._fits = {}

    def setUp(self):
        reduction._REDUCE_CACHE.clear()

    def _fit(self, N, smoothness, solid=True):
        """(tau_i, E_i, quality) of the file at 1% error, cached."""
        key = (N, smoothness, solid)
        if key not in self._fits:
            self._fits[key] = smooth_prony_fit(
                self.omega, self.E_stor, self.E_loss, self.sigma, self.sigma,
                N, smoothness, solid=solid, return_fit_quality=True,
                std_scale=self.RELATIVE_ERROR,
            )
        return self._fits[key]

    def _resolution(self, tau_i, E_i, smoothness, solid=True):
        return reduction.prony_resolution(
            self.omega, self.E_stor, self.E_loss, self.sigma, self.sigma,
            tau_i, E_i, smoothness, solid=solid,
            std_scale=self.RELATIVE_ERROR)

    def test_unsmoothed_is_the_probe_nnls_active_set(self):
        # Decaying terms only: the equilibrium column is not counted.
        tau_i, E_i, _ = self._fit(6, 0.0)
        resolution = self._resolution(tau_i, E_i, 0.0)
        R, z = _prony_reduce(self.omega, self.E_stor, self.E_loss,
                             self.sigma, self.sigma, _probe_tau(self.omega),
                             True, self.RELATIVE_ERROR)
        self.assertIs(type(resolution), float)
        self.assertEqual(resolution,
                         float(np.count_nonzero(nnls(R, z)[0][1:])))

    def test_smoothed_is_the_linearized_probe_gamma(self):
        # Interior equilibrium, the same fit with E_eq set to exactly zero
        # (synthetic: no bundled fit clamps it here; the column is dropped),
        # and a solid=False fit.
        cases = []
        tau_i, E_i, _ = self._fit(12, 0.3)
        self.assertGreater(E_i[0], 0)
        cases.append(('interior', tau_i, E_i, True))
        clamped = E_i.copy()
        clamped[0] = 0.0
        cases.append(('clamped', tau_i, clamped, True))
        tau_v, E_v, _ = self._fit(12, 0.3, solid=False)
        cases.append(('viscous', tau_v, E_v, False))
        for label, tau, E, solid in cases:
            with self.subTest(case=label):
                resolution = self._resolution(tau, E, 0.3, solid=solid)
                expected = _dense_probe_gamma(
                    self.omega, self.E_stor, self.E_loss, self.sigma,
                    self.RELATIVE_ERROR, tau, E, 0.3, solid)
                self.assertIs(type(resolution), float)
                self.assertAlmostEqual(resolution, expected,
                                       delta=1e-8 * expected)

    def test_coarse_and_fine_fits_track_the_converged_effective_terms(self):
        # The point of linearizing on a dense probe: a coarse fit, whose own
        # gamma is capped by its N, still sees what the rank-cap fit
        # resolves.
        cap = reduction.prony_rank_limit(
            self.omega, self.E_stor, self.E_loss, self.sigma, self.sigma,
            std_scale=self.RELATIVE_ERROR)
        for smoothness in (1.0, 0.1):
            target = self._fit(cap, smoothness)[2].effective_terms
            for N in (12, 32):
                with self.subTest(smoothness=smoothness, N=N):
                    tau_i, E_i, _ = self._fit(N, smoothness)
                    resolution = self._resolution(tau_i, E_i, smoothness)
                    self.assertLessEqual(abs(resolution - target),
                                         0.25 * target)

    def test_shares_the_probe_reduction_with_the_rank_limit(self):
        tau_i, E_i, _ = self._fit(12, 0.3)
        calls = []
        original = np.linalg.qr

        def counting_qr(*args, **kwargs):
            calls.append(1)
            return original(*args, **kwargs)

        reduction.prony_rank_limit(
            self.omega, self.E_stor, self.E_loss, self.sigma, self.sigma,
            std_scale=self.RELATIVE_ERROR)
        with mock.patch.object(np.linalg, 'qr', counting_qr):
            smoothed = self._resolution(tau_i, E_i, 0.3)
            unsmoothed = self._resolution(tau_i, E_i, 0.0)
        self.assertIsNotNone(smoothed)
        self.assertIsNotNone(unsmoothed)
        self.assertEqual(calls, [], msg='probe cache miss')

    def test_none_on_degenerate_fits(self):
        tau_i, E_i, _ = self._fit(12, 0.3)
        zeroed, nonfinite = E_i.copy(), E_i.copy()
        zeroed[4] = 0.0
        nonfinite[4] = np.nan
        for label, tau, E in (('one node', tau_i[:1], E_i[:2]),
                              ('zero term', tau_i, zeroed),
                              ('nan term', tau_i, nonfinite)):
            with self.subTest(case=label):
                self.assertIsNone(self._resolution(tau, E, 0.3))


def _spin(seconds):
    """Busy-wait in Python for at most `seconds`.

    A stand-in for scipy's unbounded subproblem loop that a watchdog can
    interrupt (it runs bytecode, unlike time.sleep), and bounded so that a
    broken watchdog fails the test instead of hanging the suite.
    """
    import time
    deadline = time.monotonic() + seconds
    while time.monotonic() < deadline:
        pass


def _single_debye_master():
    """(omega, E_stor, E_loss, sigma) of a noise-free single Debye relaxation.

    tau = 1 over the two decades omega = 1..100, so the only spectral mass
    sits at the long-tau end of the fit window, on a small plateau. The
    smoothed fit then has an exactly-zero Hessian eigenvalue (a log-linear
    ramp that neither data nor penalty sees), on which scipy's trust-exact
    subproblem loops forever without a shift: at std_scale=0.01 this happens
    for the (N, smoothness) pairs in HANG_CASES, and not at nearby settings.
    """
    omega = np.logspace(0.0, 2.0, 60)
    E_stor = 1e3 + 1e6 * omega ** 2 / (1 + omega ** 2)
    E_loss = 1e6 * omega / (1 + omega ** 2) + 1e2
    return omega, E_stor, E_loss, np.abs(E_stor + 1.0j * E_loss)


class TestNewtonHessianShift(unittest.TestCase):
    """The solver's Hessian carries a diagonal shift of
    _NEWTON_HESSIAN_SHIFT_EPS ulps of its largest diagonal entry; it changes
    the Newton step only, never the objective or the optimum."""

    HANG_CASES = ((14, 1.0), (18, 0.7), (20, 0.3))

    @staticmethod
    def _matrix(dtype=np.float64):
        # Negative diagonal entry largest in magnitude, so max|diag| differs
        # from max(diag).
        return np.array([[2.0, 0.5, 0.0],
                         [0.5, -7.0, 1.0],
                         [0.0, 1.0, 3.0]], dtype=dtype)

    def test_shift_multiple_is_64(self):
        self.assertEqual(prony_fit._NEWTON_HESSIAN_SHIFT_EPS, 64)

    def test_shift_adds_scaled_identity_and_nothing_elsewhere(self):
        H = self._matrix()
        original = H.copy()
        shifted = prony_fit._shifted_hessian(lambda _x: H, 64)(np.zeros(3))
        expected = 64 * np.finfo(np.float64).eps * 7.0
        np.testing.assert_array_equal(np.diag(shifted),
                                      np.diag(original) + expected)
        off = ~np.eye(3, dtype=bool)
        np.testing.assert_array_equal(shifted[off], original[off])

    def test_shift_does_not_mutate_the_wrapped_hessian(self):
        # The wrapper must not rely on its callable returning a fresh array:
        # a caching Hessian would otherwise be corrupted, with the shift
        # compounding on every call at one point.
        H = self._matrix()
        original = H.copy()
        wrapped = prony_fit._shifted_hessian(lambda _x: H, 64)
        first = wrapped(np.zeros(3)).copy()
        second = wrapped(np.zeros(3))
        np.testing.assert_array_equal(H, original)
        np.testing.assert_array_equal(second, first)

    def test_zero_multiple_is_a_passthrough(self):
        H = self._matrix()
        out = prony_fit._shifted_hessian(lambda _x: H, 0)(np.zeros(3))
        np.testing.assert_array_equal(out, self._matrix())

    def test_shift_follows_the_array_dtype(self):
        H = self._matrix(np.float32)
        out = prony_fit._shifted_hessian(lambda _x: H, 64)(np.zeros(3))
        self.assertEqual(out.dtype, np.float32)
        expected = np.float32(64 * np.finfo(np.float32).eps * 7.0)
        np.testing.assert_allclose(np.diag(out) - np.diag(self._matrix(
            np.float32)), expected, rtol=1e-3)

    def test_zero_eigenvalue_fit_completes(self):
        # Without the shift each of these cycles forever inside scipy.
        omega, E_stor, E_loss, sigma = _single_debye_master()
        for N, smoothness in self.HANG_CASES:
            with self.subTest(N=N, smoothness=smoothness):
                tau_i, E_i = smooth_prony_fit(
                    omega, E_stor, E_loss, sigma, sigma, N=N,
                    smoothness=smoothness, solid=True, std_scale=0.01)
                self.assertEqual(len(tau_i), N)
                self.assertEqual(len(E_i), N + 1)
                self.assertTrue(np.all(np.isfinite(E_i)))
                self.assertTrue(np.all(E_i > 0))

    def test_shift_leaves_bundled_fits_at_the_same_optimum(self):
        for name in BUNDLED_MASTER_CURVES:
            with self.subTest(file=name):
                omega, E_stor, E_loss, sigma = _bundled_master_curve(name)
                kwargs = dict(N=prony_terms_for_span(omega), smoothness=0.3,
                              solid=True, std_scale=0.01)
                _, shifted = smooth_prony_fit(
                    omega, E_stor, E_loss, sigma, sigma, **kwargs)
                with mock.patch.object(
                        prony_fit, '_NEWTON_HESSIAN_SHIFT_EPS', 0):
                    _, exact = smooth_prony_fit(
                        omega, E_stor, E_loss, sigma, sigma, **kwargs)
                np.testing.assert_allclose(shifted[0], exact[0], rtol=1e-6)
                self.assertLess(
                    np.abs(np.log(shifted[1:]) - np.log(exact[1:])).max(),
                    1e-6)


class TestNewtonWatchdog(unittest.TestCase):
    """The Newton solve runs under a wall-clock budget, and a solver failure
    surfaces as a ValueError naming the grid size and the remedy."""

    N = 13

    def _fit(self):
        omega, E_stor, E_loss, sigma = _single_debye_master()
        return smooth_prony_fit(omega, E_stor, E_loss, sigma, sigma,
                                N=self.N, smoothness=0.3, std_scale=0.01)

    def _assert_actionable(self, message):
        lowered = message.lower()
        self.assertIn('relaxation grid size', lowered)
        self.assertRegex(message, rf'\b{self.N}\b')
        self.assertIn('lower', lowered)
        self.assertIn('smoothness', lowered)
        self.assertIn('error', lowered)

    def test_budget_is_one_second(self):
        self.assertEqual(prony_fit._NEWTON_TIME_BUDGET, 1.0)

    def test_watchdog_interrupts_a_pure_python_loop(self):
        # Built outside the try so a missing or broken watchdog cannot pass
        # as the interruption.
        watchdog = prony_fit._newton_watchdog(0.1)
        entered = False
        interrupted = None
        try:
            with watchdog:
                entered = True
                _spin(5.0)
                self.fail('watchdog never fired')
        except (AssertionError, KeyboardInterrupt, SystemExit):
            raise
        except BaseException as exc:
            interrupted = exc
        self.assertTrue(entered)
        self.assertIsNotNone(interrupted)

    def test_watchdog_exits_cleanly_when_the_body_is_prompt(self):
        # Nothing may stay armed: run Python well past the budget afterwards
        # and reach the end without an injected exception.
        import time
        with prony_fit._newton_watchdog(0.05):
            pass
        time.sleep(0.2)
        _spin(0.1)

    def test_hanging_solve_raises_timeout_naming_the_remedy(self):
        def hanging_minimize(*args, **kwargs):
            _spin(10.0)
            raise AssertionError('watchdog never fired')

        with mock.patch.object(prony_fit, 'minimize', hanging_minimize):
            with self.assertRaises(prony_fit.SmoothPronyFitTimeout) as caught:
                self._fit()
        message = str(caught.exception)
        self.assertIn('did not converge', message.lower())
        self.assertIn('1 second', message)
        self._assert_actionable(message)

    def test_budget_is_read_at_call_time(self):
        import time

        def hanging_minimize(*args, **kwargs):
            _spin(10.0)
            raise AssertionError('watchdog never fired')

        start = time.monotonic()
        with mock.patch.object(prony_fit, 'minimize', hanging_minimize), \
                mock.patch.object(prony_fit, '_NEWTON_TIME_BUDGET', 0.1):
            with self.assertRaises(prony_fit.SmoothPronyFitTimeout):
                self._fit()
        self.assertLess(time.monotonic() - start, 0.9)

    def test_timeout_is_a_value_error(self):
        # The routes turn ValueError into a 400 carrying the message.
        self.assertTrue(issubclass(prony_fit.SmoothPronyFitTimeout,
                                   ValueError))

    def test_scipy_value_error_becomes_diverged(self):
        boom = ValueError('array must not contain infs or NaNs')
        with mock.patch.object(prony_fit, 'minimize', side_effect=boom):
            with self.assertRaises(prony_fit.SmoothPronyFitDiverged) as caught:
                self._fit()
        self.assertTrue(issubclass(prony_fit.SmoothPronyFitDiverged,
                                   ValueError))
        self._assert_actionable(str(caught.exception))


class TestNewtonRestart(unittest.TestCase):
    """A ValueError from inside scipy's solve restarts Newton from the last
    accepted iterate with a quartered initial trust radius, a bounded number
    of times, before it is reported."""

    N = 13
    BOOM = 'array must not contain infs or NaNs'

    # (directory, file, N, smoothness) at 1% relative error: fits on which
    # scipy 1.10.1's trust-exact subproblem takes its damping factor below
    # zero and then to NaN, while N - 1 and N + 1 converge untouched. The
    # second needs two restarts: the same radius fails again at once. A trip
    # reproduces only while lam lands within a few ulps of where it was
    # found, so these knobs are kept exactly as found, not rounded.
    NAN_DAMPING_CASES = (
        (TRIVE_FILES_DIR, 'agilus30 (8) master curve 20C.txt', 48,
         0.3 * np.sqrt(46 / 47)),
        (BUNDLED_DIR, 'PETMP-TATATO-OLD-wide-bar-55C_mastercurve.tsv',
         40, 0.1 * np.sqrt(38 / 39)),
    )

    def _fit(self):
        omega, E_stor, E_loss, sigma = _single_debye_master()
        return smooth_prony_fit(omega, E_stor, E_loss, sigma, sigma,
                                N=self.N, smoothness=0.3, std_scale=0.01)

    @staticmethod
    def _radius(kwargs):
        return kwargs['options']['initial_trust_radius']

    def test_fits_that_trip_scipys_nan_damping_converge(self):
        for directory, name, N, smoothness in self.NAN_DAMPING_CASES:
            with mock.patch.object(Config, 'FILES_DIRECTORY', directory):
                upload = upload_init(name, 'frequency')
            omega = upload['Frequency']
            E_stor, E_loss = upload['E Storage'], upload['E Loss']
            sigma = np.abs(E_stor + 1.0j * E_loss)

            def fit(n):
                return smooth_prony_fit(
                    omega, E_stor, E_loss, sigma, sigma, N=n,
                    smoothness=smoothness, std_scale=0.01,
                    return_fit_quality=True)

            with self.subTest(file=name):
                # Precondition: without restarts this fit is the failure.
                with mock.patch.object(prony_fit, '_NEWTON_MAX_RESTARTS', 0):
                    with self.assertRaises(prony_fit.SmoothPronyFitDiverged):
                        fit(N)
                _, E_i, quality = fit(N)
                self.assertTrue(np.all(np.isfinite(E_i)))
                self.assertIsNotNone(quality.covariance)
                for neighbour in (N - 1, N + 1):
                    self.assertAlmostEqual(
                        quality.chi2_reduced / fit(neighbour)[2].chi2_reduced,
                        1.0, delta=1e-3)

    def test_restart_resumes_from_the_last_accepted_iterate(self):
        seeds, radii = [], []

        def flaky(*args, **kwargs):
            x0 = np.array(kwargs['x0'], copy=True)
            seeds.append(x0)
            radii.append(self._radius(kwargs))
            if len(seeds) == 1:
                kwargs['callback'](x0 + 0.5)
                kwargs['callback'](x0 + 1.0)
                raise ValueError(self.BOOM)
            return minimize(*args, **kwargs)

        with mock.patch.object(prony_fit, 'minimize', flaky):
            _, E_i = self._fit()
        self.assertEqual(len(seeds), 2)
        np.testing.assert_array_equal(seeds[1], seeds[0] + 1.0)
        self.assertEqual(radii, [1.0, 0.25])
        self.assertTrue(np.all(np.isfinite(E_i)))

    def test_restarts_are_bounded_and_each_quarters_the_trust_radius(self):
        # No step is ever accepted here, so every attempt has the same seed:
        # only the smaller radius makes a retry different from the last.
        seeds, radii = [], []

        def always_fails(*args, **kwargs):
            seeds.append(np.array(kwargs['x0'], copy=True))
            radii.append(self._radius(kwargs))
            raise ValueError(self.BOOM)

        with mock.patch.object(prony_fit, 'minimize', always_fails):
            with self.assertRaises(prony_fit.SmoothPronyFitDiverged):
                self._fit()
        attempts = prony_fit._NEWTON_MAX_RESTARTS + 1
        self.assertEqual(len(radii), attempts)
        self.assertGreaterEqual(attempts, 3)
        np.testing.assert_allclose(radii, 0.25 ** np.arange(attempts))
        for seed in seeds[1:]:
            np.testing.assert_array_equal(seed, seeds[0])

    def test_restarts_share_the_one_time_budget(self):
        import time

        def slow_then_fails(*args, **kwargs):
            kwargs['callback'](np.asarray(kwargs['x0']) + 0.5)
            _spin(0.08)
            raise ValueError(self.BOOM)

        start = time.monotonic()
        with mock.patch.object(prony_fit, 'minimize', slow_then_fails), \
                mock.patch.object(prony_fit, '_NEWTON_TIME_BUDGET', 0.1), \
                mock.patch.object(prony_fit, '_NEWTON_MAX_RESTARTS', 50):
            with self.assertRaises(prony_fit.SmoothPronyFitTimeout):
                self._fit()
        self.assertLess(time.monotonic() - start, 0.9)


class TestArgmaxPeak(unittest.TestCase):
    def test_finds_known_peak(self):
        # Gaussian centered at x=1.5 on a fine grid → peak index lands on 1.5.
        x = np.linspace(-5.0, 5.0, 1001)
        signal = np.exp(-(x - 1.5) ** 2)
        self.assertAlmostEqual(x[argmax_peak(signal)], 1.5, places=2)

    def test_picks_most_prominent_of_multiple(self):
        # Two Gaussians; the taller one should win.
        x = np.linspace(-5.0, 5.0, 1001)
        signal = np.exp(-(x + 2.0) ** 2) + 2.0 * np.exp(-(x - 2.0) ** 2)
        self.assertAlmostEqual(x[argmax_peak(signal)], 2.0, places=2)

    def test_returns_int(self):
        x = np.linspace(-5.0, 5.0, 101)
        signal = np.exp(-(x - 0.0) ** 2)
        self.assertIsInstance(argmax_peak(signal), int)

    def test_raises_when_no_peaks(self):
        # Monotonic ramp has no interior peaks.
        with self.assertRaises(ValueError):
            argmax_peak(np.linspace(0.0, 1.0, 50))

    def test_rejects_non_ndarray(self):
        with self.assertRaises(AssertionError):
            argmax_peak([0.0, 1.0, 0.5, 0.0])

    def test_rejects_2d_ndarray(self):
        with self.assertRaises(AssertionError):
            argmax_peak(np.zeros((3, 3)))


if __name__ == '__main__':
    unittest.main()
