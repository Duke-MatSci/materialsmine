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

# Append the directory above 'tests' to sys.path to find the 'app' module
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))

from app.dynamfit.dynamfit2 import (
    prony_basis,
    prony_relaxation_space,
    compute_complex,
    compute_relaxation_modulus,
    compute_relaxation_spectrum,
    _prony_objective,
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


class TestComputeRelaxationSpectrum(unittest.TestCase):
    def test_shape_and_columns_viscous(self):
        result = compute_relaxation_spectrum(TAU, VISCOUS_E)
        self.assertIsInstance(result, pd.DataFrame)
        self.assertEqual(len(result), 1000)
        self.assertListEqual(list(result.columns), ['Time', 'H'])

    def test_shape_and_columns_solid(self):
        result = compute_relaxation_spectrum(TAU, SOLID_E)
        self.assertEqual(len(result), 1000)
        self.assertListEqual(list(result.columns), ['Time', 'H'])

    def test_num_pts_kwarg(self):
        result = compute_relaxation_spectrum(TAU, VISCOUS_E, num_pts=50)
        self.assertEqual(len(result), 50)

    def test_rejects_non_ndarray_tau(self):
        with self.assertRaises(AssertionError):
            compute_relaxation_spectrum([0.1, 1.0, 10.0], VISCOUS_E)

    def test_rejects_non_ndarray_E(self):
        with self.assertRaises(AssertionError):
            compute_relaxation_spectrum(TAU, [1.0, 2.0, 3.0])

    def test_rejects_2d_tau(self):
        with self.assertRaises(AssertionError):
            compute_relaxation_spectrum(TAU.reshape(1, -1), VISCOUS_E)

    def test_rejects_2d_E(self):
        with self.assertRaises(AssertionError):
            compute_relaxation_spectrum(TAU, VISCOUS_E.reshape(1, -1))


class TestPronyObjective(unittest.TestCase):
    def setUp(self):
        # Small viscous problem: 10 frequencies, 3 relaxation times.
        self.omega = np.logspace(np.log10(0.5), np.log10(2.0), 10)
        self.tau_i = np.array([0.1, 1.0, 10.0])
        self.basis = prony_basis(self.omega, self.tau_i, solid=False)
        self.logcoefs = np.log(np.array([1.0, 2.0, 3.0]))
        # Construct data so that the model fits exactly at self.logcoefs.
        self.data = self.basis @ np.exp(self.logcoefs)
        self.std = np.ones_like(self.data)

    def test_returns_scalar_loss_and_gradient_shape(self):
        loss, grad = _prony_objective(
            self.logcoefs, self.data, self.std, self.basis,
            smoothness=0.0, solid=False,
        )
        self.assertTrue(np.isscalar(loss) or np.ndim(loss) == 0)
        self.assertEqual(grad.shape, self.logcoefs.shape)

    def test_exact_fit_zero_loss_and_zero_gradient(self):
        loss, grad = _prony_objective(
            self.logcoefs, self.data, self.std, self.basis,
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
        std = np.ones_like(data)
        loss_unsmoothed, _ = _prony_objective(
            logcoefs, data, std, basis, smoothness=0.0, solid=False,
        )
        loss_smoothed, _ = _prony_objective(
            logcoefs, data, std, basis, smoothness=1.0, solid=False,
        )
        self.assertGreater(loss_smoothed, loss_unsmoothed)


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
