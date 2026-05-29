import unittest
import os
os.environ['OPENBLAS_NUM_THREADS'] = '1'
import sys
import json
import tempfile
import datetime
import numpy as np
import pandas as pd
from unittest.mock import patch

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
    fit_wlf_coefficients,
    fit_hybrid_coefficients,
    UNIVERSAL_WLF_C1,
    UNIVERSAL_WLF_C2,
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

    def test_a_T_ref_scales_output(self):
        # a_T_ref multiplies every returned shift factor.
        T = np.array([10.0, 20.0, 30.0, 40.0])
        base = hybrid_shift(T, self.T_REF, self.C1, self.C2, self.EA)
        scaled = hybrid_shift(T, self.T_REF, self.C1, self.C2, self.EA, a_T_ref=5.0)
        np.testing.assert_allclose(scaled, 5.0 * base)

    def test_explicit_ascending_matches_autodetect(self):
        # Passing ascending explicitly bypasses direction detection but must
        # yield the same numbers as letting hybrid_shift detect it.
        T = np.array([10.0, 20.0, 30.0, 40.0])
        auto = hybrid_shift(T, self.T_REF, self.C1, self.C2, self.EA)
        forced = hybrid_shift(T, self.T_REF, self.C1, self.C2, self.EA, ascending=True)
        np.testing.assert_allclose(forced, auto)

    def test_explicit_descending_matches_autodetect(self):
        T = np.array([40.0, 30.0, 20.0, 10.0])
        auto = hybrid_shift(T, self.T_REF, self.C1, self.C2, self.EA)
        forced = hybrid_shift(T, self.T_REF, self.C1, self.C2, self.EA, ascending=False)
        np.testing.assert_allclose(forced, auto)


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


class TestFitWlfCoefficients(unittest.TestCase):
    """Tests for fit_wlf_coefficients — pure function, no Flask app needed."""

    T_REF = 25.0
    C1_TRUE = 14.0
    C2_TRUE = 45.0

    @classmethod
    def setUpClass(cls):
        # Deterministic synthetic shift data: generate exact a_T from wlf_shift.
        cls.T = np.linspace(30.0, 80.0, 20)
        cls.a_T = wlf_shift(cls.T, cls.T_REF, cls.C1_TRUE, cls.C2_TRUE)

    def test_round_trip_recovers_C1_and_C2(self):
        # Both params free — fit must recover the true values to tight tolerance.
        C1_fit, C2_fit = fit_wlf_coefficients(
            self.T, self.a_T, self.T_REF,
            C1=self.C1_TRUE, C2=self.C2_TRUE,
        )
        self.assertAlmostEqual(C1_fit, self.C1_TRUE, places=4)
        self.assertAlmostEqual(C2_fit, self.C2_TRUE, places=4)

    def test_fixed_C1_returned_exactly_and_C2_fitted(self):
        # C1 is pinned; C2 must be fitted back to truth.
        C1_fit, C2_fit = fit_wlf_coefficients(
            self.T, self.a_T, self.T_REF,
            C1=self.C1_TRUE, C2=self.C2_TRUE,
            fix_C1=True,
        )
        self.assertEqual(C1_fit, self.C1_TRUE)          # exact — no optimizer touched it
        self.assertAlmostEqual(C2_fit, self.C2_TRUE, places=4)

    def test_default_initial_guesses_converge(self):
        # Omit C1 and C2 so the function falls back to UNIVERSAL_WLF_* as p0.
        # Data generated from (C1=UNIVERSAL_WLF_C1, C2=UNIVERSAL_WLF_C2) so
        # the universal constants are both the truth and the starting point.
        T = np.linspace(30.0, 80.0, 20)
        a_T = wlf_shift(T, self.T_REF, UNIVERSAL_WLF_C1, UNIVERSAL_WLF_C2)
        C1_fit, C2_fit = fit_wlf_coefficients(T, a_T, self.T_REF)
        self.assertAlmostEqual(C1_fit, UNIVERSAL_WLF_C1, places=4)
        self.assertAlmostEqual(C2_fit, UNIVERSAL_WLF_C2, places=4)

    def test_nonpositive_a_T_raises_value_error(self):
        # a_T containing zero is physically meaningless; log10 is undefined.
        bad_a_T = self.a_T.copy()
        bad_a_T[3] = 0.0
        with self.assertRaises(ValueError):
            fit_wlf_coefficients(self.T, bad_a_T, self.T_REF)

    def test_negative_a_T_raises_value_error(self):
        bad_a_T = self.a_T.copy()
        bad_a_T[0] = -1.0
        with self.assertRaises(ValueError):
            fit_wlf_coefficients(self.T, bad_a_T, self.T_REF)

    def test_cold_data_both_free_converges_and_c2_respects_bound(self):
        # Regression: when T spans far below T_ref (cold side), the default
        # UNIVERSAL_WLF_C2 initial guess lands near the WLF pole and the
        # optimizer evaluates 10**exponent values that overflow float64.
        # The fix applies an analytic log10(a_T) model so overflow can't happen,
        # and enforces C2 >= c2_min = (T_ref - min(T)) + 1.0 throughout.
        T_ref_local = 20.0
        T = np.linspace(-30.0, 70.0, 21)   # T_min = -30 → c2_min = 51
        # True parameters well away from the pole, deterministic ground truth.
        C1_true, C2_true = 22.0, 180.0
        a_T = wlf_shift(T, T_ref_local, C1_true, C2_true)
        c2_min = (T_ref_local - float(T.min())) + 1.0   # = 51.0

        # Both C1 and C2 free, default initial guesses — this is the case that
        # used to raise ValueError before the fix.
        C1_fit, C2_fit = fit_wlf_coefficients(T, a_T, T_ref_local)

        self.assertTrue(np.isfinite(C1_fit) and C1_fit > 0,
                        f"Expected finite positive C1, got {C1_fit}")
        self.assertGreaterEqual(C2_fit, c2_min,
                                f"C2_fit {C2_fit:.4f} < c2_min {c2_min:.4f} — bound not respected")


class TestFitHybridCoefficients(unittest.TestCase):
    """Tests for fit_hybrid_coefficients — pure function, no Flask app needed."""

    TL = 25.0       # WLF/Arrhenius crossover — required input, never fitted
    C1_TRUE = 14.0
    C2_TRUE = 45.0
    EA_TRUE = 80.0  # kJ/mol — well within curve_fit's convergence basin

    @classmethod
    def setUpClass(cls):
        # Span both sides of TL so both Arrhenius and WLF branches are exercised.
        cls.T = np.linspace(5.0, 70.0, 30)
        cls.a_T = hybrid_shift(cls.T, cls.TL, cls.C1_TRUE, cls.C2_TRUE, cls.EA_TRUE)

    def test_round_trip_recovers_C1_C2_and_Ea(self):
        C1_fit, C2_fit, Ea_fit, a_T_ref = fit_hybrid_coefficients(
            self.T, self.a_T, self.TL,
            C1=self.C1_TRUE, C2=self.C2_TRUE, Ea=self.EA_TRUE,
        )
        self.assertAlmostEqual(C1_fit, self.C1_TRUE, places=4)
        self.assertAlmostEqual(C2_fit, self.C2_TRUE, places=4)
        self.assertAlmostEqual(Ea_fit, self.EA_TRUE, places=4)

    def test_fixed_Ea_returned_exactly_and_others_fitted(self):
        # Ea is pinned; C1 and C2 must be recovered from the data.
        C1_fit, C2_fit, Ea_fit, a_T_ref = fit_hybrid_coefficients(
            self.T, self.a_T, self.TL,
            C1=self.C1_TRUE, C2=self.C2_TRUE, Ea=self.EA_TRUE,
            fix_Ea=True,
        )
        self.assertEqual(Ea_fit, self.EA_TRUE)           # exact — never passed to optimizer
        self.assertAlmostEqual(C1_fit, self.C1_TRUE, places=4)
        self.assertAlmostEqual(C2_fit, self.C2_TRUE, places=4)

    def test_nonpositive_a_T_raises_value_error(self):
        bad_a_T = self.a_T.copy()
        bad_a_T[5] = 0.0
        with self.assertRaises(ValueError):
            fit_hybrid_coefficients(self.T, bad_a_T, self.TL)

    def test_returns_a_T_ref_near_one_for_TL_referenced_data(self):
        # setUpClass data is built referenced to TL (hybrid_shift, a_T_ref=1), so
        # the co-fitted a_T_ref recovers ~1.0.
        *_, a_T_ref = fit_hybrid_coefficients(
            self.T, self.a_T, self.TL,
            C1=self.C1_TRUE, C2=self.C2_TRUE, Ea=self.EA_TRUE,
        )
        self.assertAlmostEqual(a_T_ref, 1.0, places=4)

    def test_cofits_offset_for_unreferenced_data(self):
        # Data scaled by a known constant K (reference shifted off TL): the fit
        # recovers K as a_T_ref and the same C1/C2/Ea.
        K = 12.0
        C1_fit, C2_fit, Ea_fit, a_T_ref = fit_hybrid_coefficients(
            self.T, K * self.a_T, self.TL,
            C1=self.C1_TRUE, C2=self.C2_TRUE, Ea=self.EA_TRUE,
        )
        self.assertAlmostEqual(a_T_ref, K, places=3)
        self.assertAlmostEqual(C1_fit, self.C1_TRUE, places=3)
        self.assertAlmostEqual(C2_fit, self.C2_TRUE, places=3)
        self.assertAlmostEqual(Ea_fit, self.EA_TRUE, places=3)

    def test_degenerate_Arrhenius_guard_fires_and_suppressed_by_fix_Ea(self):
        # All data above TL → empty Arrhenius segment → ValueError while Ea is
        # free; fixing Ea suppresses the guard and the WLF-only fit succeeds.
        T = np.linspace(30.0, 70.0, 20)
        a_T = wlf_shift(T, 25.0, self.C1_TRUE, self.C2_TRUE)
        with self.assertRaises(ValueError):
            fit_hybrid_coefficients(T, a_T, TL=25.0)
        C1_fit, C2_fit, Ea_fit, _ = fit_hybrid_coefficients(
            T, a_T, TL=25.0, Ea=self.EA_TRUE, fix_Ea=True,
        )
        self.assertEqual(Ea_fit, self.EA_TRUE)
        self.assertAlmostEqual(C1_fit, self.C1_TRUE, places=3)
        self.assertAlmostEqual(C2_fit, self.C2_TRUE, places=3)

    def test_degenerate_WLF_guard_fires_and_suppressed_by_fix_C(self):
        # All data below TL → empty WLF segment → ValueError while C1/C2 are
        # free; fixing them suppresses the guard and the Arrhenius-only fit
        # recovers Ea.
        T = np.linspace(5.0, 20.0, 20)
        a_T = _arr_shift(T, 25.0, self.EA_TRUE)
        with self.assertRaises(ValueError):
            fit_hybrid_coefficients(T, a_T, TL=25.0)
        C1_fit, C2_fit, Ea_fit, _ = fit_hybrid_coefficients(
            T, a_T, TL=25.0, C1=self.C1_TRUE, C2=self.C2_TRUE,
            fix_C1=True, fix_C2=True,
        )
        self.assertEqual((C1_fit, C2_fit), (self.C1_TRUE, self.C2_TRUE))
        self.assertAlmostEqual(Ea_fit, self.EA_TRUE, places=3)

    def test_all_fixed_returns_four_tuple_and_cofits_offset(self):
        # C1/C2/Ea all fixed → echoed exactly; a_T_ref is still co-fitted.
        K = 7.0
        C1_fit, C2_fit, Ea_fit, a_T_ref = fit_hybrid_coefficients(
            self.T, K * self.a_T, self.TL,
            C1=self.C1_TRUE, C2=self.C2_TRUE, Ea=self.EA_TRUE,
            fix_C1=True, fix_C2=True, fix_Ea=True,
        )
        self.assertEqual(
            (C1_fit, C2_fit, Ea_fit),
            (self.C1_TRUE, self.C2_TRUE, self.EA_TRUE),
        )
        self.assertAlmostEqual(a_T_ref, K, places=3)

    def test_descending_T_round_trip(self):
        # Reversed (descending) T/a_T must recover the same coefficients — checks
        # the direction handling and the ascending-ordered a_T_ref interpolation.
        C1_fit, C2_fit, Ea_fit, a_T_ref = fit_hybrid_coefficients(
            self.T[::-1], self.a_T[::-1], self.TL,
            C1=self.C1_TRUE, C2=self.C2_TRUE, Ea=self.EA_TRUE,
        )
        self.assertAlmostEqual(C1_fit, self.C1_TRUE, places=4)
        self.assertAlmostEqual(C2_fit, self.C2_TRUE, places=4)
        self.assertAlmostEqual(Ea_fit, self.EA_TRUE, places=4)
        self.assertAlmostEqual(a_T_ref, 1.0, places=4)


# ---------------------------------------------------------------------------
# Route-level tests for the fit_shift_coefficients branch of /dynamfit/extract/
# ---------------------------------------------------------------------------
import jwt
from flask import Flask
from app.dynamfit.routes import dynamfit
from app.config import Config


def _make_app():
    """
    Build a minimal Flask test app that registers only the dynamfit blueprint,
    avoiding the FileHandler('/services/services_app.log') crash in create_app().
    SECRET_KEY is fixed so we can mint tokens without an .env file.
    """
    app = Flask(__name__)
    app.config['SECRET_KEY'] = 'test-secret'
    app.config['TESTING'] = True
    app.register_blueprint(dynamfit)
    return app


def _make_token(secret='test-secret', req_id='test-req-id'):
    """Mint a JWT with the reqId field that token_required expects."""
    payload = {
        'reqId': req_id,
        'exp': datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(seconds=600),
    }
    return jwt.encode(payload, secret, algorithm='HS256')


# Synthetic shift data (5 points, all positive a_T) used across tests.
_SHIFT_T = np.array([0.0, 10.0, 20.0, 30.0, 40.0])
_SHIFT_A_T = np.array([3.0, 2.0, 1.0, 0.5, 0.25])
_SHIFT_DATA = {'Temperature': _SHIFT_T, 'a_T': _SHIFT_A_T}

# Representative WLF coefficients returned by the mocked fit functions.
_C1_RETURNED = 14.0
_C2_RETURNED = 45.0
_EA_RETURNED = 80.0
_A_T_REF_RETURNED = 1.0


class TestExtractFitShiftCoefficientsRoute(unittest.TestCase):
    """
    Route-level tests for the fit_shift_coefficients=true short-circuit branch
    of POST /dynamfit/extract/.

    Strategy:
      - Build a bare Flask app (no create_app) to avoid the Docker-only FileHandler.
      - Patch Config.SECRET_KEY so token_required decodes our test tokens.
      - Patch check_file_exists and upload_init at the route module boundary so
        tests never touch disk and don't depend on real file content.
      - Patch fit_wlf_coefficients and fit_hybrid_coefficients so tests verify
        route wiring, not fit math (fit math is covered in TestFitWlfCoefficients
        and TestFitHybridCoefficients above).
    """

    @classmethod
    def setUpClass(cls):
        Config.SECRET_KEY = 'test-secret'
        cls.app = _make_app()
        cls.client = cls.app.test_client()
        cls.token = _make_token()
        cls.headers = {'Authorization': f'Bearer {cls.token}',
                       'Content-Type': 'application/json'}

    def _post(self, body):
        return self.client.post(
            '/dynamfit/extract/',
            data=json.dumps(body),
            headers=self.headers,
        )

    def _base_wlf_body(self, **overrides):
        body = {
            'fit_shift_coefficients': True,
            'shift_file_name': 'shift.txt',
            'transform_method': 'WLF',
            'Tg': 25.0,
        }
        body.update(overrides)
        return body

    def _base_hybrid_body(self, **overrides):
        body = {
            'fit_shift_coefficients': True,
            'shift_file_name': 'shift.txt',
            'transform_method': 'hybrid',
            'TL': 25.0,
        }
        body.update(overrides)
        return body

    # ------------------------------------------------------------------
    # Happy paths
    # ------------------------------------------------------------------

    @patch('app.dynamfit.routes.fit_wlf_coefficients',
           return_value=(_C1_RETURNED, _C2_RETURNED))
    @patch('app.dynamfit.routes.upload_init', return_value=_SHIFT_DATA)
    @patch('app.dynamfit.routes.check_file_exists', return_value=True)
    def test_wlf_happy_path_returns_six_coefficient_keys(
            self, _exists, _upload, _fit):
        resp = self._post(self._base_wlf_body())
        self.assertEqual(resp.status_code, 200)
        data = json.loads(resp.data)
        self.assertEqual(
            set(data.keys()),
            {'transform_method', 'Tg', 'C1', 'C2', 'Ea', 'TL'},
        )

    @patch('app.dynamfit.routes.fit_wlf_coefficients',
           return_value=(_C1_RETURNED, _C2_RETURNED))
    @patch('app.dynamfit.routes.upload_init', return_value=_SHIFT_DATA)
    @patch('app.dynamfit.routes.check_file_exists', return_value=True)
    def test_wlf_happy_path_ea_and_tl_are_null(
            self, _exists, _upload, _fit):
        resp = self._post(self._base_wlf_body())
        data = json.loads(resp.data)
        self.assertIsNone(data['Ea'])
        self.assertIsNone(data['TL'])

    @patch('app.dynamfit.routes.fit_wlf_coefficients',
           return_value=(_C1_RETURNED, _C2_RETURNED))
    @patch('app.dynamfit.routes.upload_init', return_value=_SHIFT_DATA)
    @patch('app.dynamfit.routes.check_file_exists', return_value=True)
    def test_wlf_happy_path_c1_c2_are_plain_floats(
            self, _exists, _upload, _fit):
        # Confirms JSON serialization works: numpy scalars would raise TypeError.
        resp = self._post(self._base_wlf_body())
        data = json.loads(resp.data)
        self.assertIsInstance(data['C1'], float)
        self.assertIsInstance(data['C2'], float)

    @patch('app.dynamfit.routes.fit_hybrid_coefficients',
           return_value=(_C1_RETURNED, _C2_RETURNED, _EA_RETURNED, _A_T_REF_RETURNED))
    @patch('app.dynamfit.routes.upload_init', return_value=_SHIFT_DATA)
    @patch('app.dynamfit.routes.check_file_exists', return_value=True)
    def test_hybrid_happy_path_tg_null_ea_tl_populated(
            self, _exists, _upload, _fit):
        resp = self._post(self._base_hybrid_body())
        self.assertEqual(resp.status_code, 200)
        data = json.loads(resp.data)
        self.assertIsNone(data['Tg'])
        self.assertIsInstance(data['Ea'], float)
        self.assertIsInstance(data['TL'], float)

    @patch('app.dynamfit.routes.fit_wlf_coefficients',
           return_value=(_C1_RETURNED, _C2_RETURNED))
    @patch('app.dynamfit.routes.upload_init', return_value=_SHIFT_DATA)
    @patch('app.dynamfit.routes.check_file_exists', return_value=True)
    def test_wlf_supplied_c1_passes_fix_c1_true_to_fit(
            self, _exists, _upload, mock_fit):
        """When C1 is in the body the route must pass fix_C1=True to the fit function."""
        resp = self._post(self._base_wlf_body(C1=99.0))
        self.assertEqual(resp.status_code, 200)
        _, kwargs = mock_fit.call_args
        self.assertTrue(kwargs.get('fix_C1'))

    @patch('app.dynamfit.routes.fit_wlf_coefficients',
           return_value=(_C1_RETURNED, _C2_RETURNED))
    @patch('app.dynamfit.routes.upload_init', return_value=_SHIFT_DATA)
    @patch('app.dynamfit.routes.check_file_exists', return_value=True)
    def test_wlf_response_lacks_chart_keys(
            self, _exists, _upload, _fit):
        """The short-circuit branch must NOT include chart output keys."""
        resp = self._post(self._base_wlf_body())
        data = json.loads(resp.data)
        for chart_key in ('complex-chart', 'mytable', 'multi', 'response'):
            self.assertNotIn(chart_key, data)

    # ------------------------------------------------------------------
    # Validation / short-circuit errors
    # ------------------------------------------------------------------

    def test_missing_shift_file_name_returns_400(self):
        body = {
            'fit_shift_coefficients': True,
            'transform_method': 'WLF',
            'Tg': 25.0,
            # shift_file_name intentionally omitted
        }
        resp = self._post(body)
        self.assertEqual(resp.status_code, 400)

    @patch('app.dynamfit.routes.check_file_exists', return_value=False)
    def test_shift_file_not_found_returns_404(self, _exists):
        resp = self._post(self._base_wlf_body())
        self.assertEqual(resp.status_code, 404)

    @patch('app.dynamfit.routes.check_file_exists', return_value=True)
    def test_invalid_transform_method_returns_400(self, _exists):
        body = self._base_wlf_body(transform_method='manual')
        resp = self._post(body)
        self.assertEqual(resp.status_code, 400)

    @patch('app.dynamfit.routes.upload_init', return_value=_SHIFT_DATA)
    @patch('app.dynamfit.routes.check_file_exists', return_value=True)
    def test_wlf_missing_tg_returns_400(self, _exists, _upload):
        body = {
            'fit_shift_coefficients': True,
            'shift_file_name': 'shift.txt',
            'transform_method': 'WLF',
            # Tg intentionally omitted
        }
        resp = self._post(body)
        self.assertEqual(resp.status_code, 400)

    @patch('app.dynamfit.routes.upload_init', return_value=_SHIFT_DATA)
    @patch('app.dynamfit.routes.check_file_exists', return_value=True)
    def test_hybrid_missing_tl_returns_400(self, _exists, _upload):
        body = {
            'fit_shift_coefficients': True,
            'shift_file_name': 'shift.txt',
            'transform_method': 'hybrid',
            # TL intentionally omitted
        }
        resp = self._post(body)
        self.assertEqual(resp.status_code, 400)

    @patch('app.dynamfit.routes.upload_init', return_value=None)
    @patch('app.dynamfit.routes.check_file_exists', return_value=True)
    def test_empty_shift_file_returns_400(self, _exists, _upload):
        resp = self._post(self._base_wlf_body())
        self.assertEqual(resp.status_code, 400)


# ---------------------------------------------------------------------------
# End-to-end tests: real files + real optimizer, no mocking of upload_init or
# fit functions.  These complement TestExtractFitShiftCoefficientsRoute (which
# mocks everything and verifies route wiring) by verifying that the optimizer
# actually converges and produces a fit that reconstructs the data to a
# meaningful tolerance.
#
# WLF calibration (agilus30 20C): both C1 and C2 fitted freely from defaults.
# The data spans T down to -30 °C (50 °C below T_ref=20), which previously
# caused a 10**exponent overflow in the optimizer (ValueError → HTTP 400) with
# the default UNIVERSAL_WLF_C2=51.6 initial guess.  The pole-avoidance fix
# uses an analytic log10(a_T) model so overflow can't propagate as an exception,
# and enforces C2 >= c2_min throughout.  Observed log10-RMSE ≈ 0.437 (threshold: 0.55).
#
# Hybrid calibration (VeroCyan 80C): all three parameters (C1, C2, Ea) fitted
# freely from defaults; a_T_ref (the vertical reference offset) is co-fitted and
# must be applied when reconstructing (the VeroCyan data is not referenced to TL,
# a_T_ref ≈ 9.07).  Observed log10-RMSE ≈ 0.704 (threshold: 1.0).
# ---------------------------------------------------------------------------

_REAL_FILES_DIR = os.path.abspath(
    os.path.join(os.path.dirname(__file__), '..', '..', 'app', 'dynamfit', 'files')
)


class TestExtractFitShiftCoefficientsEndToEnd(unittest.TestCase):
    """
    E2E tests for the fit_shift_coefficients branch of POST /dynamfit/extract/.

    Real files on disk, real optimizer — no mocking of upload_init, check_file_exists,
    or the fit functions.  Config.FILES_DIRECTORY is pointed at the checked-in
    files/ directory and restored in tearDownClass.
    """

    _orig_files_dir = None

    @classmethod
    def setUpClass(cls):
        cls._orig_files_dir = Config.FILES_DIRECTORY
        Config.FILES_DIRECTORY = _REAL_FILES_DIR
        Config.SECRET_KEY = 'test-secret'
        cls.app = _make_app()
        cls.client = cls.app.test_client()
        cls.token = _make_token()
        cls.headers = {
            'Authorization': f'Bearer {cls.token}',
            'Content-Type': 'application/json',
        }

    @classmethod
    def tearDownClass(cls):
        Config.FILES_DIRECTORY = cls._orig_files_dir

    def _post(self, body):
        return self.client.post(
            '/dynamfit/extract/',
            data=json.dumps(body),
            headers=self.headers,
        )

    def test_wlf_e2e_converges_and_fit_is_accurate(self):
        """
        WLF fit on agilus30 shift data (T_ref=20 °C), BOTH C1 and C2 free.

        This is the direct regression test for the pole-avoidance fix.  Before
        the fix, the default UNIVERSAL_WLF_C2=51.6 initial guess produced a
        10**exponent overflow on data spanning T down to -30 °C, causing a
        ValueError → HTTP 400.  The fix applies an analytic log10(a_T) model
        with a C2 lower bound, so the optimizer can start from the universal
        defaults and converge.  Observed log10-RMSE ≈ 0.437 (threshold: 0.55).
        """
        body = {
            'fit_shift_coefficients': True,
            'shift_file_name': 'agilus30 (8) shift factors 20C clean.txt',
            'transform_method': 'WLF',
            'Tg': 20.0,
            # No C1 or C2 — both are freely fitted from UNIVERSAL_WLF_* defaults
        }
        resp = self._post(body)
        self.assertEqual(resp.status_code, 200)

        result = json.loads(resp.data)
        self.assertEqual(result['transform_method'], 'WLF')
        self.assertIsNone(result['Ea'])
        self.assertIsNone(result['TL'])

        C1 = result['C1']
        C2 = result['C2']
        self.assertTrue(np.isfinite(C1) and C1 > 0, f"Expected finite positive C1, got {C1}")
        self.assertTrue(np.isfinite(C2) and C2 > 0, f"Expected finite positive C2, got {C2}")

        # RMSE check: load real data and reconstruct with fitted coefficients.
        # Both-free observed RMSE ≈ 0.437; threshold 0.55 allows optimizer
        # variance without masking a regression to a grossly wrong solution.
        shift_data = upload_init('agilus30 (8) shift factors 20C clean.txt', 'shift')
        T = np.asarray(shift_data['Temperature'], dtype=float)
        a_T = np.asarray(shift_data['a_T'], dtype=float)
        reconstructed = wlf_shift(T, 20.0, C1, C2)
        log_rmse = np.sqrt(np.mean((np.log10(reconstructed) - np.log10(a_T)) ** 2))
        self.assertLess(log_rmse, 0.55,
                        f"WLF log10-RMSE {log_rmse:.4f} exceeds 0.55 — fit likely diverged")

    def test_hybrid_e2e_converges_and_fit_is_accurate(self):
        """
        Hybrid Arrhenius/WLF fit on VeroCyan shift data (T_L=80 °C).

        All three parameters (C1, C2, Ea) are fitted freely from default initial
        guesses — no body-level C1/C2/Ea, so the optimizer is fully exercised.
        The route must return 200 with finite positive C1, C2, and Ea; Tg must
        be null; reconstructed shift factors must agree with the data in log10 space.
        """
        body = {
            'fit_shift_coefficients': True,
            'shift_file_name': 'VeroCyan (5) shift factors 80C clean.txt',
            'transform_method': 'hybrid',
            'TL': 80.0,
            # No C1, C2, Ea — all three are freely fitted
        }
        resp = self._post(body)
        self.assertEqual(resp.status_code, 200)

        result = json.loads(resp.data)
        self.assertEqual(result['transform_method'], 'hybrid')
        self.assertIsNone(result['Tg'])

        C1 = result['C1']
        C2 = result['C2']
        Ea = result['Ea']
        for name, val in [('C1', C1), ('C2', C2), ('Ea', Ea)]:
            self.assertTrue(np.isfinite(val) and val > 0,
                            f"Expected finite positive {name}, got {val}")

        # RMSE check: observed RMSE ≈ 0.844; threshold 1.0 is meaningful without
        # being so tight that minor optimizer variance causes flakiness.
        shift_data = upload_init('VeroCyan (5) shift factors 80C clean.txt', 'shift')
        T = np.asarray(shift_data['Temperature'], dtype=float)
        a_T = np.asarray(shift_data['a_T'], dtype=float)
        # a_T_ref (the co-fitted vertical reference offset) is not surfaced by the
        # route, so reconstruct it as the log-space offset a consumer would apply.
        unscaled = hybrid_shift(T, 80.0, C1, C2, Ea)
        a_T_ref = 10 ** np.mean(np.log10(a_T) - np.log10(unscaled))
        reconstructed = a_T_ref * unscaled
        log_rmse = np.sqrt(np.mean((np.log10(reconstructed) - np.log10(a_T)) ** 2))
        self.assertLess(log_rmse, 1.0,
                        f"Hybrid log10-RMSE {log_rmse:.4f} exceeds 1.0 — fit likely diverged")


if __name__ == '__main__':
    unittest.main()
