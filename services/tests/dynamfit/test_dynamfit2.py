import unittest
import os
os.environ['OPENBLAS_NUM_THREADS'] = '1'
import sys
import numpy as np
import pandas as pd

# Append the directory above 'test' to sys.path to find the 'app' module
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))

from app.dynamfit.dynamfit2 import (
    prony_basis,
    prony_relaxation_space,
    compute_complex,
    compute_relaxation_modulus,
    compute_relaxation_spectrum,
    _prony_objective,
    smooth_prony_fit,
    wlf_shift,
    _arr_shift,
    hybrid_shift,
    inverse_wlf_shift,
    tts_temperature_to_frequency_V2,
    tts_frequency_to_temperature,
    argmax_peak,
    update_line_chart,
)
from app.config import Config
from app.utils.util import upload_init


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


class TestWlfShift(unittest.TestCase):
    def test_identity_at_T_ref(self):
        # T == T_ref → a_T == 1.0 exactly.
        T = np.array([100.0])
        result = wlf_shift(T, T_ref=100.0, C1=17.44, C2=51.6)
        np.testing.assert_array_equal(result, np.array([1.0]))

    def test_known_value(self):
        # T - T_ref = C2 → denom = 2*C2, exponent = -C1/2.
        # With C1=2 and C2=10 → a_T = 10^-1 = 0.1.
        T = np.array([20.0])
        result = wlf_shift(T, T_ref=10.0, C1=2.0, C2=10.0)
        np.testing.assert_allclose(result, np.array([0.1]))

    def test_array_in_array_out(self):
        T = np.array([100.0, 110.0, 120.0])
        result = wlf_shift(T, T_ref=100.0, C1=17.44, C2=51.6)
        self.assertIsInstance(result, np.ndarray)
        self.assertEqual(result.shape, (3,))

    def test_raises_on_singularity(self):
        # T - T_ref = -C2 → denom = 0.
        T = np.array([0.0])
        with self.assertRaises(ValueError):
            wlf_shift(T, T_ref=51.6, C1=17.44, C2=51.6)

    def test_raises_on_array_with_singularity(self):
        # One element hits the singularity.
        T = np.array([100.0, 0.0, 120.0])
        with self.assertRaises(ValueError):
            wlf_shift(T, T_ref=51.6, C1=17.44, C2=51.6)

    def test_accepts_scalar(self):
        # Scalar input is promoted to length-1 ndarray output.
        result = wlf_shift(100.0, T_ref=100.0, C1=17.44, C2=51.6)
        self.assertIsInstance(result, np.ndarray)
        self.assertEqual(result.shape, (1,))
        np.testing.assert_array_equal(result, np.array([1.0]))

    def test_rejects_2d_ndarray(self):
        with self.assertRaises(AssertionError):
            wlf_shift(np.array([[100.0, 110.0]]), T_ref=100.0, C1=17.44, C2=51.6)


class TestArrShift(unittest.TestCase):
    def test_identity_at_T_ref(self):
        # T == T_ref → a_T == 1.0 exactly.
        T = np.array([25.0])
        result = _arr_shift(T, T_ref=25.0, Ea=50.0)
        np.testing.assert_array_equal(result, np.array([1.0]))

    def test_direction(self):
        # With Ea > 0, T > T_ref → a_T < 1.
        T = np.array([50.0])
        result = _arr_shift(T, T_ref=25.0, Ea=50.0)
        self.assertLess(result[0], 1.0)

    def test_raises_at_absolute_zero(self):
        T = np.array([-273.15])
        with self.assertRaises(ValueError):
            _arr_shift(T, T_ref=25.0, Ea=50.0)


class TestHybridShift(unittest.TestCase):
    T_REF = 25.0
    C1 = 17.44
    C2 = 51.6
    EA = 50.0  # kJ/mol

    def test_ascending_mixed(self):
        # Crosses T_ref; result preserves ascending order, monotone-decreasing in T.
        T = np.array([10.0, 20.0, 30.0, 40.0])
        result = hybrid_shift(T, self.T_REF, self.C1, self.C2, self.EA)
        self.assertEqual(result.shape, T.shape)
        self.assertTrue(np.all(np.diff(result) <= 0))

    def test_descending_mixed(self):
        # Descending T → a_T monotonically increasing along the input.
        T = np.array([40.0, 30.0, 20.0, 10.0])
        result = hybrid_shift(T, self.T_REF, self.C1, self.C2, self.EA)
        self.assertEqual(result.shape, T.shape)
        self.assertTrue(np.all(np.diff(result) >= 0))

    def test_ascending_and_descending_consistent(self):
        # The same temperatures in opposite order should produce the same a_T
        # values, just reversed.
        T_asc = np.array([10.0, 20.0, 30.0, 40.0])
        T_desc = T_asc[::-1]
        result_asc = hybrid_shift(T_asc, self.T_REF, self.C1, self.C2, self.EA)
        result_desc = hybrid_shift(T_desc, self.T_REF, self.C1, self.C2, self.EA)
        np.testing.assert_allclose(result_desc, result_asc[::-1])

    def test_all_below_T_ref(self):
        # All Arrhenius; final element at T == T_ref gives a_T == 1.
        T = np.array([10.0, 20.0, 25.0])
        result = hybrid_shift(T, self.T_REF, self.C1, self.C2, self.EA)
        self.assertEqual(result.shape, T.shape)
        np.testing.assert_allclose(result[-1], 1.0)

    def test_all_above_T_ref(self):
        # All WLF; with positive C1, a_T < 1 throughout.
        T = np.array([30.0, 40.0, 50.0])
        result = hybrid_shift(T, self.T_REF, self.C1, self.C2, self.EA)
        self.assertEqual(result.shape, T.shape)
        self.assertTrue(np.all(result < 1.0))

    def test_accepts_scalar_below_T_ref(self):
        # Scalar at T_ref → Arrhenius bucket → a_T == 1.
        result = hybrid_shift(self.T_REF, self.T_REF, self.C1, self.C2, self.EA)
        self.assertIsInstance(result, np.ndarray)
        self.assertEqual(result.shape, (1,))
        np.testing.assert_allclose(result, np.array([1.0]))

    def test_accepts_scalar_above_T_ref(self):
        # Scalar above T_ref → WLF bucket → a_T < 1.
        result = hybrid_shift(self.T_REF + 10.0, self.T_REF, self.C1, self.C2, self.EA)
        self.assertEqual(result.shape, (1,))
        self.assertLess(result[0], 1.0)

    def test_accepts_single_element_array(self):
        T = np.array([self.T_REF + 10.0])
        result = hybrid_shift(T, self.T_REF, self.C1, self.C2, self.EA)
        self.assertEqual(result.shape, (1,))

    def test_rejects_2d_ndarray(self):
        with self.assertRaises(AssertionError):
            hybrid_shift(
                np.array([[10.0, 20.0]]),
                self.T_REF, self.C1, self.C2, self.EA,
            )

    def test_rejects_non_finite(self):
        T = np.array([10.0, np.nan, 30.0])
        with self.assertRaises(AssertionError):
            hybrid_shift(T, self.T_REF, self.C1, self.C2, self.EA)

    def test_rejects_unsorted(self):
        T = np.array([10.0, 30.0, 20.0, 40.0])
        with self.assertRaises(AssertionError):
            hybrid_shift(T, self.T_REF, self.C1, self.C2, self.EA)


class TestInverseWlfShift(unittest.TestCase):
    T_REF = 100.0
    C1 = 17.44
    C2 = 51.6

    def test_identity_at_a_T_unity(self):
        # log10(1) = 0 → T = T_ref exactly.
        result = inverse_wlf_shift(np.array([1.0]), self.T_REF, self.C1, self.C2)
        np.testing.assert_array_equal(result, np.array([self.T_REF]))

    def test_round_trip_with_wlf_shift(self):
        # T → a_T → T should recover the original temperatures.
        T = np.array([110.0, 120.0, 150.0, 200.0])
        a_T = wlf_shift(T, self.T_REF, self.C1, self.C2)
        T_back = inverse_wlf_shift(a_T, self.T_REF, self.C1, self.C2)
        np.testing.assert_allclose(T_back, T)

    def test_accepts_scalar(self):
        result = inverse_wlf_shift(1.0, self.T_REF, self.C1, self.C2)
        self.assertIsInstance(result, np.ndarray)
        self.assertEqual(result.shape, (1,))

    def test_rejects_2d_ndarray(self):
        with self.assertRaises(AssertionError):
            inverse_wlf_shift(np.array([[1.0, 0.5]]), self.T_REF, self.C1, self.C2)

    def test_raises_on_nonpositive_a_T(self):
        with self.assertRaises(ValueError):
            inverse_wlf_shift(np.array([0.0]), self.T_REF, self.C1, self.C2)
        with self.assertRaises(ValueError):
            inverse_wlf_shift(np.array([-1.0]), self.T_REF, self.C1, self.C2)


class TestTtsTemperatureToFrequencyV2(unittest.TestCase):
    T_REF = 25.0
    C1 = 17.44
    C2 = 51.6
    EA = 50.0
    MASTER_FREQ = 2.5

    def _input_df(self, T_values):
        # Build a temperature sweep whose hybrid TTS shift collapses every row
        # to MASTER_FREQ: per-row Frequency = MASTER_FREQ / a_T(T).
        T = np.array(T_values, dtype=float)
        a_T = hybrid_shift(T, self.T_REF, self.C1, self.C2, self.EA)
        n = len(T)
        return pd.DataFrame({
            'Temperature': T,
            'Frequency': self.MASTER_FREQ / a_T,
            "E'": np.full(n, 100.0),
            "E''": np.full(n, 10.0),
        })

    def _params(self, **overrides):
        # T_REF stands in for both Tg (WLF reference) and TL (hybrid crossover);
        # the fixture data round-trips for either interpretation.
        kwargs = dict(Tg=self.T_REF, TL=self.T_REF,
                      C1=self.C1, C2=self.C2, Ea=self.EA)
        kwargs.update(overrides)
        return kwargs

    def test_output_columns(self):
        df = self._input_df([25.0, 30.0, 35.0])
        result = tts_temperature_to_frequency_V2(df, 'WLF', **self._params())
        self.assertListEqual(list(result.columns), ['Frequency', 'Temperature', "E'", "E''"])

    def test_output_length(self):
        df = self._input_df([25.0, 30.0, 35.0])
        result = tts_temperature_to_frequency_V2(df, 'WLF', **self._params())
        self.assertEqual(len(result), len(df))

    def test_temperature_column_is_T_ref(self):
        df = self._input_df([25.0, 30.0, 35.0])
        result = tts_temperature_to_frequency_V2(df, 'WLF', **self._params())
        np.testing.assert_array_equal(
            result['Temperature'].values, np.full(len(df), self.T_REF),
        )

    def test_hybrid_round_trip(self):
        # Data was built via hybrid_shift → 'hybrid' TTS recovers MASTER_FREQ.
        df = self._input_df([20.0, 25.0, 30.0, 35.0])
        result = tts_temperature_to_frequency_V2(df, 'hybrid', **self._params())
        np.testing.assert_allclose(result['Frequency'].values, self.MASTER_FREQ)

    def test_WLF_round_trip_above_T_ref(self):
        # All T > T_ref: hybrid_shift == wlf_shift, so 'WLF' TTS also recovers
        # MASTER_FREQ on data built via hybrid_shift.
        df = self._input_df([30.0, 35.0, 40.0])
        result = tts_temperature_to_frequency_V2(df, 'WLF', **self._params())
        np.testing.assert_allclose(result['Frequency'].values, self.MASTER_FREQ)

    def test_identity_single_row_at_T_ref(self):
        # Single row at T_ref → a_T == 1 → output Frequency == input Frequency.
        df = self._input_df([self.T_REF])
        result_wlf = tts_temperature_to_frequency_V2(df, 'WLF', **self._params())
        result_hybrid = tts_temperature_to_frequency_V2(df, 'hybrid', **self._params())
        np.testing.assert_allclose(result_wlf['Frequency'].values, df['Frequency'].values)
        np.testing.assert_allclose(result_hybrid['Frequency'].values, df['Frequency'].values)

    def test_shiftData_override_uses_supplied_a_T(self):
        # When shiftData is provided, it multiplies Frequency directly;
        # shift_model parameters are ignored.
        df = self._input_df([25.0, 30.0, 35.0])
        shiftData = {'a_T': [0.5, 1.5, 2.0]}
        result = tts_temperature_to_frequency_V2(
            df, 'WLF', **self._params(shiftData=shiftData),
        )
        expected = df['Frequency'].values * np.array([0.5, 1.5, 2.0])
        np.testing.assert_allclose(
            np.sort(result['Frequency'].values), np.sort(expected),
        )

    def test_E_columns_preserved(self):
        df = self._input_df([25.0, 30.0, 35.0])
        result = tts_temperature_to_frequency_V2(df, 'hybrid', **self._params())
        # E' and E'' are constant 100/10 throughout the fixture; they should
        # pass through unchanged regardless of row order.
        np.testing.assert_array_equal(result["E'"].values, np.full(3, 100.0))
        np.testing.assert_array_equal(result["E''"].values, np.full(3, 10.0))

    def test_does_not_mutate_input(self):
        df = self._input_df([25.0, 30.0, 35.0])
        original_columns = list(df.columns)
        tts_temperature_to_frequency_V2(df, 'WLF', **self._params())
        self.assertListEqual(list(df.columns), original_columns)

    def test_rejects_unknown_shift_model(self):
        # Unknown shift_model is a server-bug class: the route's allow-list
        # must match this function's, so reaching here with 'bogus' is a
        # contract violation rather than user error.
        df = self._input_df([25.0, 30.0, 35.0])
        with self.assertRaises(AssertionError):
            tts_temperature_to_frequency_V2(df, 'bogus', **self._params())

    def test_manual_with_shiftData_succeeds(self):
        # 'manual' selects the shiftData path; WLF/hybrid params are ignored.
        df = self._input_df([25.0, 30.0, 35.0])
        shiftData = {'a_T': [0.5, 1.5, 2.0]}
        result = tts_temperature_to_frequency_V2(
            df, 'manual', shiftData=shiftData,
        )
        expected = df['Frequency'].values * np.array([0.5, 1.5, 2.0])
        np.testing.assert_allclose(
            np.sort(result['Frequency'].values), np.sort(expected),
        )

    def test_manual_without_shiftData_raises_value_error(self):
        # User picks 'manual' in the UI but forgets to upload the shift file.
        df = self._input_df([25.0, 30.0, 35.0])
        with self.assertRaisesRegex(ValueError, 'shift-factor file'):
            tts_temperature_to_frequency_V2(df, 'manual', **self._params())

    def test_output_has_reset_index(self):
        df = self._input_df([25.0, 30.0, 35.0])
        result = tts_temperature_to_frequency_V2(df, 'WLF', **self._params())
        self.assertListEqual(list(result.index), list(range(len(result))))

    def test_missing_frequency_column_assumes_one_hz(self):
        # Pure temperature sweep input (no Frequency col) → shifted Frequency == a_T.
        T = np.array([20.0, 25.0, 30.0])
        df = pd.DataFrame({
            'Temperature': T,
            "E'": np.full(len(T), 100.0),
            "E''": np.full(len(T), 10.0),
        })
        result = tts_temperature_to_frequency_V2(df, 'hybrid', **self._params())
        expected_a_T = hybrid_shift(T, self.T_REF, self.C1, self.C2, self.EA)
        np.testing.assert_allclose(
            np.sort(result['Frequency'].values), np.sort(expected_a_T),
        )


class TestTtsFrequencyToTemperature(unittest.TestCase):
    T_REF = 25.0
    C1 = 17.44
    C2 = 51.6
    OMEGA_REF = 1.0

    def _input_df(self, T_values):
        # Build a freq sweep whose inverse-WLF maps each row back to T in T_values:
        # per-row Frequency = OMEGA_REF * a_T(T).
        T = np.array(T_values, dtype=float)
        a_T = wlf_shift(T, self.T_REF, self.C1, self.C2)
        n = len(T)
        return pd.DataFrame({
            'Frequency': self.OMEGA_REF * a_T,
            "E'": np.full(n, 100.0),
            "E''": np.full(n, 10.0),
        })

    def test_output_columns(self):
        df = self._input_df([25.0, 30.0, 35.0])
        result = tts_frequency_to_temperature(df, self.OMEGA_REF, self.T_REF, self.C1, self.C2)
        self.assertListEqual(list(result.columns), ['Frequency', 'Temperature', "E'", "E''"])

    def test_output_length(self):
        df = self._input_df([25.0, 30.0, 35.0])
        result = tts_frequency_to_temperature(df, self.OMEGA_REF, self.T_REF, self.C1, self.C2)
        self.assertEqual(len(result), len(df))

    def test_frequency_column_is_omega_ref(self):
        df = self._input_df([25.0, 30.0, 35.0])
        result = tts_frequency_to_temperature(df, self.OMEGA_REF, self.T_REF, self.C1, self.C2)
        np.testing.assert_array_equal(
            result['Frequency'].values, np.full(len(df), self.OMEGA_REF),
        )

    def test_round_trip_temperatures(self):
        T_input = [27.0, 30.0, 35.0]
        df = self._input_df(T_input)
        result = tts_frequency_to_temperature(df, self.OMEGA_REF, self.T_REF, self.C1, self.C2)
        np.testing.assert_allclose(result['Temperature'].values, sorted(T_input))

    def test_identity_at_omega_ref(self):
        # Frequency == omega_ref means a_T = 1, so inverse WLF gives T = T_ref.
        df = pd.DataFrame({
            'Frequency': [self.OMEGA_REF],
            "E'": [100.0],
            "E''": [10.0],
        })
        result = tts_frequency_to_temperature(df, self.OMEGA_REF, self.T_REF, self.C1, self.C2)
        np.testing.assert_allclose(result['Temperature'].values, [self.T_REF])

    def test_E_columns_preserved(self):
        df = self._input_df([25.0, 30.0, 35.0])
        result = tts_frequency_to_temperature(df, self.OMEGA_REF, self.T_REF, self.C1, self.C2)
        np.testing.assert_array_equal(result["E'"].values, np.full(3, 100.0))
        np.testing.assert_array_equal(result["E''"].values, np.full(3, 10.0))

    def test_does_not_mutate_input(self):
        df = self._input_df([25.0, 30.0, 35.0])
        original_columns = list(df.columns)
        original_freq = df['Frequency'].to_numpy().copy()
        tts_frequency_to_temperature(df, self.OMEGA_REF, self.T_REF, self.C1, self.C2)
        self.assertListEqual(list(df.columns), original_columns)
        np.testing.assert_array_equal(df['Frequency'].values, original_freq)

    def test_output_has_reset_index(self):
        df = self._input_df([25.0, 30.0, 35.0])
        result = tts_frequency_to_temperature(df, self.OMEGA_REF, self.T_REF, self.C1, self.C2)
        self.assertListEqual(list(result.index), list(range(len(result))))

    def test_output_sorted_by_temperature(self):
        df = self._input_df([35.0, 27.0, 30.0])  # unsorted
        result = tts_frequency_to_temperature(df, self.OMEGA_REF, self.T_REF, self.C1, self.C2)
        T = result['Temperature'].values
        self.assertTrue(np.all(np.diff(T) >= 0))

    def test_round_trip_with_V2(self):
        # Scatter a master curve across temperatures with freq_to_temp, then
        # collapse back with V2. Frequencies must match the original master.
        master_freqs = np.array([0.1, 1.0, 10.0])
        df_master = pd.DataFrame({
            'Frequency': master_freqs,
            "E'": [100.0, 200.0, 300.0],
            "E''": [10.0, 20.0, 30.0],
        })
        scattered = tts_frequency_to_temperature(
            df_master, self.OMEGA_REF, self.T_REF, self.C1, self.C2,
        )
        recovered = tts_temperature_to_frequency_V2(
            scattered, 'WLF', Tg=self.T_REF, C1=self.C1, C2=self.C2,
        )
        np.testing.assert_allclose(
            np.sort(recovered['Frequency'].values), np.sort(master_freqs),
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


DATA_DIR = os.path.abspath(os.path.join(
    os.path.dirname(__file__), '..', '..', 'app', 'dynamfit', 'files',
))


class TestUpdateLineChartFrequency(unittest.TestCase):
    """Characterization tests for the frequency-domain branch of update_line_chart."""

    @classmethod
    def setUpClass(cls):
        Config.FILES_DIRECTORY = DATA_DIR
        cls.uploadData = upload_init(
            'agilus30 (8) master curve 20C clean.txt', 'frequency',
        )
        cls.N = 10
        cls.result = update_line_chart(
            cls.uploadData,
            number_of_prony=cls.N,
            smoothness=0.1,
            fit_settings=True,
            domain='frequency',
        )

    def test_returns_7_tuple(self):
        self.assertEqual(len(self.result), 7)

    def test_coef_df_schema(self):
        coef_df = self.result[6]
        self.assertIsInstance(coef_df, list)
        self.assertGreater(len(coef_df), 0)
        for row in coef_df:
            self.assertSetEqual(set(row.keys()), {'i', 'tau_i', 'E_i'})
            self.assertNotEqual(row['E_i'], 0.0)
        # 'i' values are the original DataFrame indices, all nonnegative
        self.assertTrue(all(row['i'] >= 0 for row in coef_df))

    def test_fig1_trace_names(self):
        fig1 = self.result[0]
        names = [t.name for t in fig1.data]
        # Two facets (E Storage, E Loss) × two colors (Experiment + N-Term Prony)
        self.assertEqual(names.count('Experiment'), 2)
        self.assertEqual(sum(1 for n in names if 'Term Prony' in n), 2)

    def test_fig1_experiment_y_matches_input(self):
        # px.line(facet_col='Modulus') splits by Modulus, so the two Experiment
        # traces carry the E Storage and E Loss columns from the input.
        fig1 = self.result[0]
        experiment_y = sorted(
            (tuple(t.y) for t in fig1.data if t.name == 'Experiment'),
            key=lambda ys: ys[0],
        )
        expected = sorted(
            (tuple(self.uploadData['E Loss']), tuple(self.uploadData['E Storage'])),
            key=lambda ys: ys[0],
        )
        for got, want in zip(experiment_y, expected):
            np.testing.assert_array_equal(got, want)

    def test_fig2_fig3_trace_counts_with_fit_settings_true(self):
        # fit_settings=True → fig2/fig3 are overlay figs (line + basis scatter).
        fig2, fig3 = self.result[2], self.result[3]
        self.assertEqual(len(fig2.data), 2)
        self.assertEqual(len(fig3.data), 2)
        names2 = {t.name for t in fig2.data}
        names3 = {t.name for t in fig3.data}
        self.assertTrue(any('Basis' in n for n in names2))
        self.assertTrue(any('Basis' in n for n in names3))

    def test_fig4_fig41_have_only_experiment_traces(self):
        # In frequency domain, fig4/fig41 visualize the inverse-WLF temperature
        # conversion of the input — no Prony fit is overlaid there.
        fig4, fig41 = self.result[4], self.result[5]
        for fig in (fig4, fig41):
            names = {t.name for t in fig.data}
            self.assertEqual(names, {'Experiment'})

    def test_fit_settings_false_drops_basis_overlay(self):
        result = update_line_chart(
            self.uploadData, number_of_prony=self.N, smoothness=0.1,
            fit_settings=False, domain='frequency',
        )
        fig2, fig3 = result[2], result[3]
        self.assertEqual(len(fig2.data), 1)
        self.assertEqual(len(fig3.data), 1)
        self.assertNotIn('Basis', {t.name for t in fig2.data})
        self.assertNotIn('Basis', {t.name for t in fig3.data})


class TestUpdateLineChartTemperature(unittest.TestCase):
    """Characterization tests for the temperature-domain branches."""

    T_REF = 25.0
    C1 = 17.44
    C2 = 51.6
    EA = 200.0

    @classmethod
    def setUpClass(cls):
        Config.FILES_DIRECTORY = DATA_DIR
        # Real temperature ramp for the early-exit path.
        cls.real_temp_data = upload_init(
            'agilus30 (8) Temperature Ramp clean.txt', 'temperature',
        )
        # Synthetic temperature ramp chosen so WLF and hybrid shifts both stay
        # well-defined (T spans both sides of T_ref, well clear of the
        # WLF C2 singularity at T_ref - C2).
        T = np.linspace(0.0, 80.0, 30)
        cls.synthetic_temp_data = {
            'Temperature': T,
            'E Storage': np.linspace(1000.0, 10.0, len(T)),
            'E Loss': np.full(len(T), 50.0),
        }

    def test_early_exit_with_no_shift_params(self):
        fig1, fig11, fig2, fig3, fig4, fig41, coef_df = update_line_chart(
            self.real_temp_data, number_of_prony=10, smoothness=0.1,
            fit_settings=True, domain='temperature',
        )
        for empty in (fig1, fig11, fig2, fig3):
            self.assertEqual(len(empty.data), 0)
        self.assertEqual(coef_df, [])
        self.assertGreater(len(fig4.data), 0)
        self.assertGreater(len(fig41.data), 0)

    def test_WLF_shift_populates_all_figures(self):
        result = update_line_chart(
            self.synthetic_temp_data, number_of_prony=8, smoothness=0.1,
            fit_settings=True, domain='temperature',
            Tg=self.T_REF, C1=self.C1, C2=self.C2, shift_model='WLF',
        )
        fig1, fig11, fig2, fig3, fig4, fig41, coef_df = result
        for fig in (fig1, fig11, fig2, fig3, fig4, fig41):
            self.assertGreater(len(fig.data), 0)
        self.assertIsInstance(coef_df, list)
        self.assertGreater(len(coef_df), 0)

    def test_hybrid_shift_populates_all_figures(self):
        result = update_line_chart(
            self.synthetic_temp_data, number_of_prony=8, smoothness=0.1,
            fit_settings=True, domain='temperature',
            Tg=self.T_REF, TL=self.T_REF, C1=self.C1, C2=self.C2,
            Ea=self.EA, shift_model='hybrid',
        )
        fig1, fig11, fig2, fig3, fig4, fig41, coef_df = result
        for fig in (fig1, fig11, fig2, fig3, fig4, fig41):
            self.assertGreater(len(fig.data), 0)
        self.assertGreater(len(coef_df), 0)

    def test_hybrid_works_without_Tg(self):
        # hybrid_shift uses TL (not Tg) as the WLF/Arrhenius crossover, so
        # update_line_chart should drive the master-curve path even when Tg is
        # not supplied.
        result = update_line_chart(
            self.synthetic_temp_data, number_of_prony=8, smoothness=0.1,
            fit_settings=True, domain='temperature',
            TL=self.T_REF, C1=self.C1, C2=self.C2, Ea=self.EA,
            shift_model='hybrid',
        )
        fig1, fig11, fig2, fig3, fig4, fig41, coef_df = result
        for fig in (fig1, fig11, fig2, fig3, fig4, fig41):
            self.assertGreater(len(fig.data), 0)
        self.assertGreater(len(coef_df), 0)

    def test_Tg_zero_does_not_falsely_trigger_early_exit(self):
        # Regression: the old `Tg and C1 and C2` truthy check treated Tg = 0 °C
        # as missing and dropped users into the empty-figures branch.
        result = update_line_chart(
            self.synthetic_temp_data, number_of_prony=8, smoothness=0.1,
            fit_settings=True, domain='temperature',
            Tg=0.0, C1=self.C1, C2=self.C2, shift_model='WLF',
        )
        fig1, fig11, fig2, fig3, fig4, fig41, coef_df = result
        for fig in (fig1, fig11, fig2, fig3, fig4, fig41):
            self.assertGreater(len(fig.data), 0)
        self.assertGreater(len(coef_df), 0)

    def test_shiftData_override_triggers_shift_path(self):
        # Even without Tg/C1/C2/shift_model, supplying shiftData should drive
        # the shift branch (b is true via the shiftData term).
        n = len(self.synthetic_temp_data['Temperature'])
        T = self.synthetic_temp_data['Temperature']
        a_T = wlf_shift(T, self.T_REF, self.C1, self.C2)
        shiftData = {'Temperature': T, 'a_T': a_T}
        result = update_line_chart(
            self.synthetic_temp_data, number_of_prony=8, smoothness=0.1,
            fit_settings=True, domain='temperature',
            shiftData=shiftData,
        )
        fig1, fig11, fig2, fig3, fig4, fig41, coef_df = result
        for fig in (fig1, fig11, fig2, fig3, fig4, fig41):
            self.assertGreater(len(fig.data), 0)
        self.assertGreater(len(coef_df), 0)


class TestUpdateLineChartValidation(unittest.TestCase):
    """
    Validation paths in update_line_chart.

    uploadData is contractually the output of upload_init() — a dict with
    canonical keys for the chosen domain mapped to 1-D float ndarrays. Tests
    here exercise the user-fixable validation paths (ValueError → HTTP 400
    via the Flask route) and the contract assertions (AssertionError → HTTP
    500 — only reachable via a server bug).
    """

    @staticmethod
    def _freq(f, s, l):
        return {'Frequency': np.asarray(f, float),
                'E Storage': np.asarray(s, float),
                'E Loss':    np.asarray(l, float)}

    @staticmethod
    def _temp(T, s, l):
        return {'Temperature': np.asarray(T, float),
                'E Storage':   np.asarray(s, float),
                'E Loss':      np.asarray(l, float)}

    def _call(self, data, **kw):
        return update_line_chart(
            data, number_of_prony=5, smoothness=0.1, fit_settings=True, **kw,
        )

    def test_empty_data_raises_value_error(self):
        with self.assertRaisesRegex(ValueError, 'no data rows'):
            self._call(self._freq([], [], []), domain='frequency')

    def test_nan_in_data_raises_value_error(self):
        bad = self._freq([1.0, 2.0, 3.0], [100.0, np.nan, 300.0], [10.0, 20.0, 30.0])
        with self.assertRaisesRegex(ValueError, 'non-finite'):
            self._call(bad, domain='frequency')

    def test_inf_in_data_raises_value_error(self):
        bad = self._freq([1.0, 2.0, 3.0], [100.0, 200.0, 300.0], [10.0, np.inf, 30.0])
        with self.assertRaisesRegex(ValueError, 'non-finite'):
            self._call(bad, domain='frequency')

    def test_zero_frequency_raises_value_error(self):
        bad = self._freq([0.0, 1.0, 10.0], [100.0, 200.0, 300.0], [10.0, 20.0, 30.0])
        with self.assertRaisesRegex(ValueError, 'Frequency.*positive'):
            self._call(bad, domain='frequency')

    def test_negative_frequency_raises_value_error(self):
        bad = self._freq([-1.0, 1.0, 10.0], [100.0, 200.0, 300.0], [10.0, 20.0, 30.0])
        with self.assertRaisesRegex(ValueError, 'Frequency.*positive'):
            self._call(bad, domain='frequency')

    def test_wrong_uploadData_keys_raises_assertion(self):
        # Server-bug class: uploadData doesn't match upload_init's contract.
        bad = {'Frequency': np.array([1.0, 2.0, 3.0])}
        with self.assertRaises(AssertionError):
            self._call(bad, domain='frequency')

    def test_unknown_domain_raises_assertion(self):
        # Server-bug class: frontend only ever sends 'frequency' or 'temperature'.
        ok = self._freq([1.0, 2.0, 3.0], [100.0, 200.0, 300.0], [10.0, 20.0, 30.0])
        with self.assertRaises(AssertionError):
            self._call(ok, domain='bogus')

    def test_shiftdata_length_mismatch_raises_value_error(self):
        temp = self._temp([0.0, 25.0, 50.0], [100.0, 200.0, 300.0], [10.0, 20.0, 30.0])
        bad_shift = {'Temperature': [0.0, 25.0], 'a_T': [1.0, 1.0]}
        with self.assertRaisesRegex(ValueError, 'same number of rows'):
            self._call(temp, domain='temperature', shiftData=bad_shift)

    def test_shiftdata_missing_a_T_raises_assertion(self):
        # Server-bug class: upload_init(..., 'shift') always produces an 'a_T' key,
        # so a missing one means someone constructed shiftData by hand.
        temp = self._temp([0.0, 25.0, 50.0], [100.0, 200.0, 300.0], [10.0, 20.0, 30.0])
        bad_shift = {'Temperature': [0.0, 25.0, 50.0], 'wrong_key': [1.0, 1.0, 1.0]}
        with self.assertRaises(AssertionError):
            self._call(temp, domain='temperature', shiftData=bad_shift)


class TestUpdateLineChartErrorColumns(unittest.TestCase):
    """update_line_chart should pass E_stor_std/E_loss_std from the uploadData
    error columns when present, else fall back to relative_error*|E*|."""

    @staticmethod
    def _freq_data(extras=None):
        d = {
            'Frequency': np.array([1.0, 2.0, 3.0]),
            'E Storage': np.array([100.0, 200.0, 300.0]),
            'E Loss':    np.array([10.0, 20.0, 30.0]),
        }
        if extras:
            d.update(extras)
        return d

    @staticmethod
    def _temp_data(extras=None):
        d = {
            'Temperature': np.array([0.0, 25.0, 50.0]),
            'E Storage':   np.array([100.0, 200.0, 300.0]),
            'E Loss':      np.array([10.0, 20.0, 30.0]),
        }
        if extras:
            d.update(extras)
        return d

    def _spy(self):
        # Return a minimal valid fit result so downstream figure builders run.
        from unittest.mock import patch
        spy_target = patch(
            'app.dynamfit.dynamfit2.smooth_prony_fit',
            return_value=(np.array([1.0]), np.array([1.0])),
        )
        return spy_target

    def test_per_modulus_error_columns_flow_into_smooth_prony_fit(self):
        stor_err = np.array([5.0, 10.0, 15.0])
        loss_err = np.array([0.5, 1.0, 1.5])
        data = self._freq_data({
            'E Storage Error': stor_err,
            'E Loss Error':    loss_err,
        })
        with self._spy() as spy:
            update_line_chart(
                data, number_of_prony=5, smoothness=0.1,
                fit_settings=False, domain='frequency',
            )
        kwargs = spy.call_args.kwargs
        np.testing.assert_array_equal(kwargs['E_stor_std'], stor_err)
        np.testing.assert_array_equal(kwargs['E_loss_std'], loss_err)

    def test_shared_error_column_flows_into_both_std_kwargs(self):
        err = np.array([1.0, 2.0, 3.0])
        data = self._freq_data({'Error': err})
        with self._spy() as spy:
            update_line_chart(
                data, number_of_prony=5, smoothness=0.1,
                fit_settings=False, domain='frequency',
            )
        kwargs = spy.call_args.kwargs
        np.testing.assert_array_equal(kwargs['E_stor_std'], err)
        np.testing.assert_array_equal(kwargs['E_loss_std'], err)

    def test_no_error_columns_falls_back_to_default_relative_error(self):
        data = self._freq_data()
        with self._spy() as spy:
            update_line_chart(
                data, number_of_prony=5, smoothness=0.1,
                fit_settings=False, domain='frequency',
            )
        kwargs = spy.call_args.kwargs
        expected = np.abs(data['E Storage'] + 1.0j * data['E Loss']) * 0.2
        np.testing.assert_allclose(kwargs['E_stor_std'], expected)
        np.testing.assert_allclose(kwargs['E_loss_std'], expected)

    def test_relative_error_kwarg_scales_fallback(self):
        data = self._freq_data()
        with self._spy() as spy:
            update_line_chart(
                data, number_of_prony=5, smoothness=0.1,
                fit_settings=False, domain='frequency',
                relative_error=0.5,
            )
        kwargs = spy.call_args.kwargs
        expected = np.abs(data['E Storage'] + 1.0j * data['E Loss']) * 0.5
        np.testing.assert_allclose(kwargs['E_stor_std'], expected)
        np.testing.assert_allclose(kwargs['E_loss_std'], expected)

    def test_temperature_per_modulus_error_columns_flow_through_tts(self):
        # The temperature branch routes data through tts_temperature_to_frequency_V2,
        # which reorders rows by post-shift Frequency. The per-row error values
        # must ride along that reorder so smooth_prony_fit sees them aligned.
        stor_err = np.array([5.0, 10.0, 15.0])
        loss_err = np.array([0.5, 1.0, 1.5])
        data = self._temp_data({
            'E Storage Error': stor_err,
            'E Loss Error':    loss_err,
        })
        with self._spy() as spy:
            update_line_chart(
                data, number_of_prony=5, smoothness=0.1,
                fit_settings=False, domain='temperature',
                Tg=25.0, C1=17.44, C2=51.6, shift_model='WLF',
            )
        kwargs = spy.call_args.kwargs
        # Each (storage, loss) error pair must still be co-located with its
        # source row after the frequency-sort reorder. The set of pairs is
        # therefore invariant under TTS even though the order changes.
        pairs_out = set(zip(kwargs['E_stor_std'].tolist(),
                            kwargs['E_loss_std'].tolist()))
        pairs_in = set(zip(stor_err.tolist(), loss_err.tolist()))
        self.assertEqual(pairs_out, pairs_in)


if __name__ == '__main__':
    unittest.main()
