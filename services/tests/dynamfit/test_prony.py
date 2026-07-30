"""
Prony-series core math: basis construction, the relaxation grid, the forward
transforms (complex modulus / relaxation modulus / relaxation spectrum), the
fit objective, the smooth Prony fit, and the argmax peak helper.

Pure functions — no Flask app, no disk access — so this is the fastest subset
and the one to run while iterating on the Prony math.

    python -m unittest tests.dynamfit.test_prony
"""
import unittest
import os
os.environ['OPENBLAS_NUM_THREADS'] = '1'
import sys
import numpy as np
import pandas as pd
from scipy.optimize import minimize

# Append the directory above 'tests' to sys.path to find the 'app' module
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))

import app.dynamfit.dynamfit2 as dynamfit2
from app.dynamfit.dynamfit2 import (
    prony_basis,
    prony_relaxation_space,
    compute_complex,
    compute_relaxation_modulus,
    _prony_objective,
    _prony_fit_quality,
    _prony_reduce,
    _build_coef_records,
    smooth_prony_fit,
    argmax_peak,
)


TAU = np.array([0.1, 1.0, 10.0])
# Coefficient magnitudes ~exp(7) ≈ 1097, the solver's default x0, so the
# round-trip recovery test in TestSmoothPronyFit converges from x0.
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
        # Positive E_i, equilibrium term excluded → E(t) is non-increasing in t.
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
                       n_resid, prior_lam=None):
    """Straightforward dense reference for _prony_fit_quality.

    Materializes L, A, J and C and uses eigvalsh/slogdet — everything the
    production code avoids via a closed-form pseudo-determinant and banded
    in-place accumulation. Takes the same pre-weighted system the production
    function does. Returns (chi2, neg_log_posterior) with the posterior None
    exactly when C is not positive definite, matching the contract.
    """
    m = len(logcoefs)
    npen = m - solid
    lam = smoothness * smoothness
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
    dof = n_resid - m
    chi2 = (resid @ resid) / dof if dof > 0 else None
    if np.linalg.eigvalsh(C).min() <= 0:
        return chi2, None
    eigs = np.linalg.eigvalsh(A)
    nonzero = eigs > eigs.max() * 1e-10
    neg_log_posterior = (
        V
        - 0.5 * (np.log(eigs[nonzero]).sum()
                 + nonzero.sum() * np.log(lam)
                 - np.linalg.slogdet(C)[1])
        - 0.5 * (2 + solid) * np.log(np.pi)
        + (lam if prior_lam is None else prior_lam)
    )
    return chi2, neg_log_posterior


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


def _converged_fit_problem(rng, N=10, smoothness=1.0):
    """A well-posed problem minimized to convergence.

    The Laplace approximation assumes a stationary point, so tests that need a
    real neg_log_posterior must evaluate at a genuine minimum rather than at an
    arbitrary point. Errors are set to the noise actually injected, which puts
    reduced chi-squared near 1. basis and data come back weighted by 1/std, the
    form the scoring functions take.
    """
    omega = np.logspace(-2, 2, 60)
    tau_i = prony_relaxation_space(1 / omega.max(), 1 / omega.min(), N)
    basis = prony_basis(omega, tau_i, True)
    truth = np.exp(np.linspace(2.0, 0.5, N + 1))
    clean = basis @ truth
    std = np.abs(clean) * 0.02
    data = clean + std * rng.normal(size=len(clean))
    basis, data = basis / std[:, None], data / std
    result = minimize(
        _prony_objective, np.log(truth),
        args=(data, basis, smoothness, True),
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
            x, data, basis, 0.0, True, n_resid=2 * len(data),
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
                    x, data, basis, 1.5, True, n_resid=2 * len(data),
                )
                self.assertIsNone(quality.neg_log_posterior)
                self.assertIsNotNone(quality.chi2_reduced)

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
                                      prior_lam=0.37)
                        got = _prony_fit_quality(
                            x, data, basis, smoothness, solid, **kwargs,
                        )
                        chi2, nlp = _dense_fit_quality(
                            x, data, basis, smoothness, solid, **kwargs,
                        )
                        self.assertAlmostEqual(got.chi2_reduced, chi2, places=9)
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
                lam = smoothness * smoothness
                coefs = np.exp(x)
                resid = data - basis @ coefs
                L = np.zeros((N - 2, m))
                rows = np.arange(N - 2)
                L[rows, solid + rows] = 1.0
                L[rows, solid + rows + 1] = -2.0
                L[rows, solid + rows + 2] = 1.0
                J = -(basis * coefs)
                C = lam * (L.T @ L) + J.T @ J + np.diag(resid @ J)
                np.testing.assert_allclose(
                    C, 0.5 * hessian, rtol=1e-3, atol=1e-4 * np.abs(C).max(),
                )

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
            np.log(truth), z, R, 1.0, True, n_resid=n_resid,
        )
        resid = (y - clean) / std
        expected = resid @ resid / (n_resid - len(truth))
        self.assertAlmostEqual(
            quality.chi2_reduced, expected, delta=1e-9 * expected,
        )

    def test_prior_lam_overrides_scaled_lambda(self):
        # smooth_prony_fit charges the exponential prior against the UNSCALED
        # smoothness so the prior doesn't punish large uploads; that override
        # must replace lam exactly, not add to it.
        basis, data, x = _converged_fit_problem(self.rng, smoothness=2.0)
        kwargs = dict(n_resid=2 * len(data))
        default = _prony_fit_quality(x, data, basis, 2.0, True, **kwargs)
        override = _prony_fit_quality(x, data, basis, 2.0, True,
                                      prior_lam=0.25, **kwargs)
        self.assertAlmostEqual(
            default.neg_log_posterior - override.neg_log_posterior,
            2.0 ** 2 - 0.25, places=6,
        )

    def test_none_posterior_when_not_positive_definite(self):
        # C not positive definite means this is not a local minimum, so the
        # Laplace expansion does not apply. Coefficients driven far below the
        # data make diag(r.T @ J), which is O(coefs) and negative, dominate
        # J.T @ J, which is O(coefs**2) — so C picks up negative eigenvalues.
        basis, data, _ = _converged_fit_problem(self.rng)
        x = np.full(basis.shape[1], -10.0)
        quality = _prony_fit_quality(
            x, data, basis, 0.5, True, n_resid=2 * len(data),
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
                x, data, basis, 0.5, True, n_resid=2 * len(data),
            )
        self.assertIsNone(quality.neg_log_posterior)

    def test_chi2_none_when_no_degrees_of_freedom(self):
        # A 3-frequency upload gives 6 residuals against m = 21 parameters.
        basis, data, x = _random_fit_problem(self.rng, 20, True, n_rows=6)
        quality = _prony_fit_quality(x, data, basis, 1.0, True, n_resid=6)
        self.assertIsNone(quality.chi2_reduced)

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

        grid = [0.01, 0.03, 0.1, 0.3, 1.0, 3.0, 10.0, 30.0]
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
        # against the residual computed the long way.
        omega, E_stor, E_loss, std = _broadband_master_curve(600)
        tau_i, E_i, quality = smooth_prony_fit(
            omega, E_stor, E_loss, E_stor_std=std, E_loss_std=std,
            N=12, smoothness=0.0, solid=True, return_fit_quality=True,
        )
        expected = _chi2_per_point(
            omega, E_stor, E_loss, std, tau_i, E_i,
        ) * (2 * len(omega)) / (2 * len(omega) - len(E_i))
        self.assertAlmostEqual(
            quality.chi2_reduced, expected, delta=1e-6 * expected,
        )


class TestPronyReduce(unittest.TestCase):
    """The extracted QR reduction and its content-addressed LRU cache."""

    def setUp(self):
        dynamfit2._REDUCE_CACHE.clear()
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
        # A smoothness sweep re-calls with the same arrays; the QR must run once.
        calls = []
        original = np.linalg.qr

        def counting_qr(*args, **kwargs):
            calls.append(1)
            return original(*args, **kwargs)

        np.linalg.qr = counting_qr
        try:
            first = self._reduce()
            after_first = len(calls)
            second = self._reduce()
        finally:
            np.linalg.qr = original
        self.assertGreater(after_first, 0)
        self.assertEqual(len(calls), after_first, msg='cache miss on repeat')
        self.assertIs(first[0], second[0])

    def test_modified_content_misses_the_cache(self):
        # The key is a content digest, not id() — a mutated copy at the same
        # address (or a distinct array with the same values) must not collide.
        first = self._reduce()
        bumped = self.E_stor.copy()
        bumped[3] *= 1.01
        second = self._reduce(E_stor=bumped)
        self.assertIsNot(first[1], second[1])
        # R is the triangle of the weighted basis, which does not depend on the
        # moduli at all — only z carries the data, so that is what must change.
        np.testing.assert_allclose(first[0], second[0])
        self.assertFalse(np.array_equal(first[1], second[1]))
        # ...while an equal-valued copy still hits.
        third = self._reduce(E_stor=self.E_stor.copy())
        self.assertIs(first[1], third[1])

    def test_cached_arrays_are_read_only(self):
        # Callers share the cached arrays, so a stray write would poison every
        # later hit. scipy doesn't write to them today; make it raise if it ever
        # does rather than silently corrupting results.
        R, z = self._reduce()
        with self.assertRaises(ValueError):
            R[0, 0] = 1.0
        with self.assertRaises(ValueError):
            z[0] = 1.0

    def test_evicts_least_recently_used(self):
        for extra in range(dynamfit2._REDUCE_CACHE_SIZE + 2):
            bumped = self.E_stor.copy()
            bumped[0] += extra + 1
            self._reduce(E_stor=bumped)
        self.assertEqual(
            len(dynamfit2._REDUCE_CACHE), dynamfit2._REDUCE_CACHE_SIZE,
        )

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
        original = dynamfit2._QR_CHUNK_ROWS
        try:
            dynamfit2._QR_CHUNK_ROWS = 64
            _, E_many = smooth_prony_fit(omega, E_stor, E_loss, **kwargs)
            dynamfit2._QR_CHUNK_ROWS = 10 ** 9
            _, E_one = smooth_prony_fit(omega, E_stor, E_loss, **kwargs)
        finally:
            dynamfit2._QR_CHUNK_ROWS = original
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
        # The weight is scaled by sqrt(n_res/_SMOOTHNESS_REF_RESIDUALS), so the
        # SAME curve sampled at very different densities must smooth to a
        # comparable log-space roughness at the same smoothness value.
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
                N=50, smoothness=1.0, solid=True,
            )
            rough.append(log_roughness(E_i))
        lo, hi = sorted(rough)
        # Unnormalized, the 40x density gap gives a ~40x penalty-weight gap and
        # wildly different roughness; normalized they agree closely. Factor 2
        # is a loose bound for discretization differences.
        self.assertLess(hi, 2.0 * lo)

    def test_smoothness_path_converges_near_unsmoothed_optimum(self):
        # A mild penalty must not degrade the data term much relative to the
        # exact NNLS optimum — this exercises the seeded, bounded L-BFGS-B on
        # the reduced system.
        omega, E_stor, E_loss, std = _broadband_master_curve(1000)
        kwargs = dict(E_stor_std=std, E_loss_std=std, N=50, solid=True)
        tau_i, E_exact = smooth_prony_fit(
            omega, E_stor, E_loss, smoothness=0.0, **kwargs)
        _, E_smooth = smooth_prony_fit(
            omega, E_stor, E_loss, smoothness=0.1, **kwargs)
        self.assertTrue(np.all(np.isfinite(E_smooth)))
        chi2_exact = _chi2_per_point(omega, E_stor, E_loss, std, tau_i, E_exact)
        chi2_smooth = _chi2_per_point(omega, E_stor, E_loss, std, tau_i, E_smooth)
        self.assertLess(chi2_smooth, chi2_exact + 0.1)

    def test_zero_coefficients_flow_through_coef_records(self):
        # NNLS returns exact zeros (active set); the coefficient table filters
        # them and keeps the original grid index in 'i'.
        omega, E_stor, E_loss, std = _broadband_master_curve(500)
        tau_i, E_i = smooth_prony_fit(
            omega, E_stor, E_loss,
            E_stor_std=std, E_loss_std=std,
            N=50, smoothness=0.0, solid=True,
        )
        self.assertGreater(np.sum(E_i == 0), 0)  # sparsity actually occurs
        records = _build_coef_records(tau_i, E_i)
        self.assertEqual(len(records), np.count_nonzero(E_i[1:]))
        for rec in records:
            self.assertNotEqual(rec['E_i'], 0)
            np.testing.assert_allclose(rec['tau_i'], tau_i[rec['i']])


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
