"""
Delta-method 1-sigma bands for a fitted Prony series (app.trive.uncertainty):
pure functions of (tau_i, E_i, covariance), checked against brute-force
quadratic forms, numerical differentiation and one real smoothed fit.

    python -m unittest tests.trive.test_uncertainty
"""
import unittest
import os
os.environ['OPENBLAS_NUM_THREADS'] = '1'
import sys
import numpy as np

# Append the directory above 'tests' to sys.path to find the 'app' module
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))

from app.trive.prony import prony_basis, compute_complex
from app.trive.fit import smooth_prony_fit


def _uncertainty():
    """The module under test, imported per test so its absence fails each
    test cleanly instead of breaking discovery."""
    from app.trive import uncertainty
    return uncertainty


def _random_cov(rng, m):
    """A well-conditioned random covariance: A @ A.T plus a diagonal floor."""
    A = rng.normal(size=(m, m)) * 0.1
    return A @ A.T + 0.01 * np.eye(m)


def _quadratic_forms(G, cov):
    """sqrt(g.T @ cov @ g) for each row g of G, one point at a time."""
    return np.array([np.sqrt(g @ cov @ g) for g in G])


class TestSigmaLogCoefficients(unittest.TestCase):
    def test_display_cap_is_six_decades(self):
        """The displayed log-sigma ceiling is ln(1e6)."""
        u = _uncertainty()
        self.assertAlmostEqual(u._SIGMA_DISPLAY_CAP, np.log(1e6), places=12)

    def test_sqrt_of_the_diagonal_uncapped_in_row_order(self):
        """sigma_log_coefficients is sqrt(diag), in the covariance's own row
        order, with no display cap applied."""
        u = _uncertainty()
        cov = _random_cov(np.random.default_rng(3), 4)
        cov[2, 2] = 1e4  # sigma 100 nepers, far above the display cap
        np.testing.assert_allclose(
            u.sigma_log_coefficients(cov), np.sqrt(np.diag(cov)))


class TestSpectrumErrorBars(unittest.TestCase):
    def test_log_normal_offsets(self):
        """plus = E expm1(s), minus = E (1 - exp(-s)): the linear offsets of
        the interval [E exp(-s), E exp(s)]."""
        u = _uncertainty()
        E = np.array([2.0, 5.0, 1e9])
        s = np.array([0.3, 1.0, 1e-9])
        plus, minus = u.spectrum_error_bars(E, s)
        np.testing.assert_allclose(plus, E * np.expm1(s), rtol=1e-12)
        np.testing.assert_allclose(minus, -E * np.expm1(-s), rtol=1e-12)
        np.testing.assert_allclose(E + plus, E * np.exp(s), rtol=1e-12)
        np.testing.assert_allclose(E - minus, E * np.exp(-s), rtol=1e-12)
        self.assertTrue((plus >= 0).all() and (minus >= 0).all())
        self.assertTrue((minus < E).all())

    def test_capped_offsets_stay_finite_and_positive(self):
        """A huge or infinite log-sigma is capped before exponentiating, so
        both offsets are finite and the lower edge stays above zero."""
        u = _uncertainty()
        cap = u._SIGMA_DISPLAY_CAP
        E = np.array([1e9, 3.0, 1e-3])
        plus, minus = u.spectrum_error_bars(E, np.array([1e6, np.inf, 1e3]))
        self.assertTrue(np.isfinite(plus).all() and np.isfinite(minus).all())
        np.testing.assert_allclose(plus, E * np.expm1(cap), rtol=1e-12)
        np.testing.assert_allclose(minus, -E * np.expm1(-cap), rtol=1e-12)
        self.assertTrue((minus < E).all())

    def test_cap_argument_is_honoured(self):
        """An explicit cap replaces the default ceiling."""
        u = _uncertainty()
        E = np.array([4.0, 4.0])
        plus, minus = u.spectrum_error_bars(E, np.array([0.5, 5.0]), cap=1.0)
        np.testing.assert_allclose(plus, E * np.expm1([0.5, 1.0]))
        np.testing.assert_allclose(minus, -E * np.expm1([-0.5, -1.0]))


class TestShapeContract(unittest.TestCase):
    """E_i has N or N+1 entries; the covariance has N rows, or N+1 only when
    E_i carries the equilibrium term. Anything else is a ValueError."""

    def setUp(self):
        self.rng = np.random.default_rng(11)
        self.N = 5
        self.tau_i = np.logspace(-2, 2, self.N)
        self.omega = np.logspace(-2, 2, 7)
        self.t = np.logspace(-2, 2, 7)

    def _call_both(self, E_i, cov):
        u = _uncertainty()
        u.complex_modulus_sigma(self.omega, self.tau_i, E_i, cov)
        u.relaxation_sigma(self.t, self.tau_i, E_i, cov)

    def test_accepts_the_three_legal_parameterizations(self):
        """Viscous (N, N), interior solid (N+1, N+1) and clamped solid
        (E_i of N+1 with E_eq = 0, covariance N x N) all evaluate."""
        N = self.N
        E = np.abs(self.rng.normal(size=N + 1)) + 0.1
        self._call_both(E[1:], _random_cov(self.rng, N))
        self._call_both(E, _random_cov(self.rng, N + 1))
        self._call_both(np.concatenate(([0.0], E[1:])),
                        _random_cov(self.rng, N))

    def test_rejects_shapes_outside_the_contract(self):
        """Wrong E_i length, a covariance of the wrong size for E_i, or a
        non-square covariance raises ValueError from both functions."""
        u = _uncertainty()
        N = self.N
        cases = {
            'E_i too long': (np.ones(N + 2), _random_cov(self.rng, N + 2)),
            'E_i too short': (np.ones(N - 1), _random_cov(self.rng, N - 1)),
            'viscous E_i, (N+1) covariance':
                (np.ones(N), _random_cov(self.rng, N + 1)),
            'covariance too small':
                (np.ones(N + 1), _random_cov(self.rng, N - 1)),
            'non-square covariance': (np.ones(N + 1), np.ones((N + 1, N))),
        }
        for label, (E_i, cov) in cases.items():
            with self.subTest(label):
                with self.assertRaises(ValueError):
                    u.complex_modulus_sigma(self.omega, self.tau_i, E_i, cov)
                with self.assertRaises(ValueError):
                    u.relaxation_sigma(self.t, self.tau_i, E_i, cov)


class TestComplexModulusSigma(unittest.TestCase):
    """Delta method on x = log(c): dy/dx_j = b_j c_j, var = g Sigma g.T."""

    def setUp(self):
        self.rng = np.random.default_rng(21)
        self.tau_i = np.logspace(-2, 2, 6)
        self.omega = np.logspace(-2.5, 2.5, 15)
        self.E_i = np.abs(self.rng.normal(size=7)) + 0.5  # solid, E_eq first
        self.cov = _random_cov(self.rng, 7)

    def test_returns_the_three_curve_keys(self):
        """One 1-sigma array over omega per drawn curve."""
        got = _uncertainty().complex_modulus_sigma(
            self.omega, self.tau_i, self.E_i, self.cov)
        self.assertEqual(set(got), {'E Storage', 'E Loss', 'tan delta'})
        for key, value in got.items():
            self.assertEqual(value.shape, self.omega.shape, msg=key)

    def test_moduli_match_per_point_quadratic_forms(self):
        """E' and E'' sigmas equal sqrt(g Sigma g.T) with g = b * E_i, point by
        point, equilibrium column included."""
        got = _uncertainty().complex_modulus_sigma(
            self.omega, self.tau_i, self.E_i, self.cov)
        G = prony_basis(self.omega, self.tau_i, True) * self.E_i
        n = len(self.omega)
        np.testing.assert_allclose(
            got['E Storage'], _quadratic_forms(G[:n], self.cov), rtol=1e-10)
        np.testing.assert_allclose(
            got['E Loss'], _quadratic_forms(G[n:], self.cov), rtol=1e-10)

    def test_all_three_match_numerical_differentiation(self):
        """Central differences of the forward model in x = log(E_i) give the
        same sigmas, tan delta included (the ratio taken directly)."""
        x = np.log(self.E_i)
        basis = prony_basis(self.omega, self.tau_i, True)
        n = len(self.omega)

        def forward(xv):
            curve = basis @ np.exp(xv)
            return {'E Storage': curve[:n], 'E Loss': curve[n:],
                    'tan delta': curve[n:] / curve[:n]}

        h = 1e-6
        grads = {key: np.empty((n, len(x))) for key in forward(x)}
        for j in range(len(x)):
            up, down = x.copy(), x.copy()
            up[j] += h
            down[j] -= h
            f_up, f_down = forward(up), forward(down)
            for key in grads:
                grads[key][:, j] = (f_up[key] - f_down[key]) / (2 * h)
        got = _uncertainty().complex_modulus_sigma(
            self.omega, self.tau_i, self.E_i, self.cov)
        for key, G in grads.items():
            with self.subTest(key):
                np.testing.assert_allclose(
                    got[key], _quadratic_forms(G, self.cov), rtol=1e-6)

    def test_viscous_parameterization(self):
        """With no equilibrium term every column is a decaying term."""
        E_i, cov = self.E_i[1:], self.cov[1:, 1:]
        got = _uncertainty().complex_modulus_sigma(
            self.omega, self.tau_i, E_i, cov)
        G = prony_basis(self.omega, self.tau_i, False) * E_i
        n = len(self.omega)
        np.testing.assert_allclose(
            got['E Storage'], _quadratic_forms(G[:n], cov), rtol=1e-10)
        np.testing.assert_allclose(
            got['E Loss'], _quadratic_forms(G[n:], cov), rtol=1e-10)

    def test_clamped_parameterization(self):
        """E_eq = 0 with an (N, N) covariance: the sensitivities cover the
        decaying columns only, and tan delta uses the full curve."""
        E_clamped = np.concatenate(([0.0], self.E_i[1:]))
        cov = self.cov[1:, 1:]
        got = _uncertainty().complex_modulus_sigma(
            self.omega, self.tau_i, E_clamped, cov)
        basis = prony_basis(self.omega, self.tau_i, True)
        n = len(self.omega)
        curve = basis @ E_clamped
        G = basis[:, 1:] * self.E_i[1:]
        G_tan = G[n:] / curve[:n, None] \
            - (curve[n:] / curve[:n] ** 2)[:, None] * G[:n]
        np.testing.assert_allclose(
            got['E Storage'], _quadratic_forms(G[:n], cov), rtol=1e-10)
        np.testing.assert_allclose(
            got['E Loss'], _quadratic_forms(G[n:], cov), rtol=1e-10)
        np.testing.assert_allclose(
            got['tan delta'], _quadratic_forms(G_tan, cov), rtol=1e-10)

    def test_floating_point_negative_variance_is_clipped_to_zero(self):
        """A covariance whose quadratic forms come out slightly negative (the
        roundoff a PSD product can produce) yields sigma 0, not NaN."""
        u = _uncertainty()
        cov = -1e-30 * np.eye(7)
        got = u.complex_modulus_sigma(self.omega, self.tau_i, self.E_i, cov)
        for key, value in got.items():
            np.testing.assert_array_equal(value, 0.0, err_msg=key)
        rel = u.relaxation_sigma(self.omega, self.tau_i, self.E_i, cov)
        np.testing.assert_array_equal(rel, 0.0)


class TestRelaxationSigma(unittest.TestCase):
    """1-sigma of E(t) = E_eq + sum_i E_i exp(-t/tau_i). With x = log(E),
    dE/dx_eq = E_eq at every t, so the equilibrium row of the covariance and
    its cross terms enter in full."""

    def setUp(self):
        self.rng = np.random.default_rng(23)
        self.tau_i = np.logspace(-2, 2, 6)
        self.t = np.logspace(-3, 3, 12)
        self.E_i = np.abs(self.rng.normal(size=7)) + 0.5  # solid, E_eq first
        self.cov = _random_cov(self.rng, 7)

    def test_matches_brute_force_with_the_equilibrium_column(self):
        """sqrt(g Sigma g.T) with g = [E_eq, E_j exp(-t/tau_j)] over the
        full covariance, cross terms included."""
        self.assertGreater(np.abs(self.cov[0, 1:]).max(), 1e-3)
        got = _uncertainty().relaxation_sigma(
            self.t, self.tau_i, self.E_i, self.cov)
        decaying = np.exp(-np.outer(self.t, 1 / self.tau_i)) * self.E_i[1:]
        G = np.column_stack((np.full(len(self.t), self.E_i[0]), decaying))
        np.testing.assert_allclose(
            got, _quadratic_forms(G, self.cov), rtol=1e-10)

    def test_matches_numerical_differentiation_of_the_full_curve(self):
        """Central differences of E(t) in x = log(E_i), plateau included,
        give the same sigma."""
        x = np.log(self.E_i)
        decay = np.exp(-np.outer(self.t, 1 / self.tau_i))

        def forward(xv):
            return np.exp(xv[0]) + decay @ np.exp(xv[1:])

        h = 1e-6
        G = np.empty((len(self.t), len(x)))
        for j in range(len(x)):
            up, down = x.copy(), x.copy()
            up[j] += h
            down[j] -= h
            G[:, j] = (forward(up) - forward(down)) / (2 * h)
        got = _uncertainty().relaxation_sigma(
            self.t, self.tau_i, self.E_i, self.cov)
        np.testing.assert_allclose(
            got, _quadratic_forms(G, self.cov), rtol=1e-6)

    def test_long_time_sigma_is_the_equilibrium_sigma(self):
        """Once every term has decayed, sigma is E_eq sqrt(cov[0, 0])."""
        t = np.array([1e6, 1e9]) * self.tau_i.max()
        got = _uncertainty().relaxation_sigma(
            t, self.tau_i, self.E_i, self.cov)
        np.testing.assert_allclose(
            got, self.E_i[0] * np.sqrt(self.cov[0, 0]), rtol=1e-12)

    def test_n_row_covariance_propagates_the_decaying_terms_only(self):
        """Viscous fits and the clamped E_eq = 0 fit carry an (N, N)
        covariance: sqrt(g Sigma g.T) with g_j = E_j exp(-t/tau_j)."""
        u = _uncertainty()
        dec = self.cov[1:, 1:]
        G = np.exp(-np.outer(self.t, 1 / self.tau_i)) * self.E_i[1:]
        want = _quadratic_forms(G, dec)
        E_clamped = np.concatenate(([0.0], self.E_i[1:]))
        for label, E_i in (('viscous', self.E_i[1:]),
                           ('clamped', E_clamped)):
            with self.subTest(label):
                np.testing.assert_allclose(
                    u.relaxation_sigma(self.t, self.tau_i, E_i, dec), want,
                    rtol=1e-10)


class TestComplexModulusNoise(unittest.TestCase):
    """1-sigma measurement noise of a new reading: the data's relative
    profile, interpolated in log-frequency, times the fitted |E*|."""

    def setUp(self):
        self.rng = np.random.default_rng(31)
        self.tau_i = np.logspace(-2, 2, 6)
        self.E_i = np.abs(self.rng.normal(size=7)) + 0.5  # solid, E_eq first
        self.omega_data = np.logspace(-2, 2, 25)

    def _fit_curve(self, omega, E_i=None):
        """The fitted (E', E'') over omega, straight from the basis."""
        E_i = self.E_i if E_i is None else E_i
        basis = prony_basis(omega, self.tau_i, len(E_i) > len(self.tau_i))
        curve = basis @ E_i
        n = len(omega)
        return curve[:n], curve[n:]

    def _noise(self, omega, rel_stor, rel_loss, E_i=None, omega_data=None):
        return _uncertainty().complex_modulus_noise(
            omega, self.tau_i, self.E_i if E_i is None else E_i,
            self.omega_data if omega_data is None else omega_data,
            rel_stor, rel_loss)

    def test_returns_the_three_curve_keys(self):
        """One noise array over omega per drawn curve."""
        rel = np.full(len(self.omega_data), 0.05)
        omega = np.logspace(-3, 3, 17)
        got = self._noise(omega, rel, rel)
        self.assertEqual(set(got), {'E Storage', 'E Loss', 'tan delta'})
        for key, value in got.items():
            self.assertEqual(value.shape, omega.shape, msg=key)

    def test_constant_profile_is_r_times_fitted_magnitude(self):
        """A constant profile r gives r |E*_fit| on any grid, inside the data
        window and beyond it, with or without an equilibrium term."""
        omega = np.logspace(-5, 5, 41)  # wider than the data window
        rel_s = np.full(len(self.omega_data), 0.05)
        rel_l = np.full(len(self.omega_data), 0.08)
        for E_i in (self.E_i, self.E_i[1:]):
            with self.subTest(solid=len(E_i) > len(self.tau_i)):
                got = self._noise(omega, rel_s, rel_l, E_i=E_i)
                stor, loss = self._fit_curve(omega, E_i)
                mag = np.abs(stor + 1.0j * loss)
                np.testing.assert_allclose(
                    got['E Storage'], 0.05 * mag, rtol=1e-12)
                np.testing.assert_allclose(
                    got['E Loss'], 0.08 * mag, rtol=1e-12)

    def test_profile_is_linear_in_log_frequency_and_clamped(self):
        """At a data point the profile is that point's value; at the
        geometric midpoint of two neighbours it is their mean; beyond the
        window it holds the edge value."""
        rel = np.linspace(0.01, 0.10, len(self.omega_data))
        mid = np.sqrt(self.omega_data[7] * self.omega_data[8])
        probe = np.array([1e-6, self.omega_data[0] / 3, self.omega_data[7],
                          mid, self.omega_data[-1] * 3, 1e6])
        got = self._noise(probe, rel, rel)
        stor, loss = self._fit_curve(probe)
        mag = np.abs(stor + 1.0j * loss)
        want = np.array([rel[0], rel[0], rel[7], (rel[7] + rel[8]) / 2,
                         rel[-1], rel[-1]])
        np.testing.assert_allclose(got['E Storage'] / mag, want, rtol=1e-12)
        np.testing.assert_allclose(got['E Loss'] / mag, want, rtol=1e-12)

    def test_unsorted_data_grid_gives_the_same_noise(self):
        """omega_data arrives in upload order; permuting it together with the
        profiles changes nothing."""
        rel_s = np.linspace(0.01, 0.10, len(self.omega_data))
        rel_l = np.linspace(0.20, 0.02, len(self.omega_data))
        perm = self.rng.permutation(len(self.omega_data))
        omega = np.logspace(-3, 3, 30)
        got = self._noise(omega, rel_s, rel_l)
        shuffled = self._noise(omega, rel_s[perm], rel_l[perm],
                               omega_data=self.omega_data[perm])
        for key in got:
            np.testing.assert_allclose(shuffled[key], got[key], rtol=1e-12,
                                       err_msg=key)

    def test_storage_and_loss_follow_their_own_profiles(self):
        """E' noise depends on rel_stor only and E'' noise on rel_loss only."""
        rel_a = np.linspace(0.01, 0.10, len(self.omega_data))
        rel_b = np.linspace(0.30, 0.03, len(self.omega_data))
        omega = np.logspace(-3, 3, 30)
        ab = self._noise(omega, rel_a, rel_b)
        ba = self._noise(omega, rel_b, rel_a)
        aa = self._noise(omega, rel_a, rel_a)
        np.testing.assert_allclose(ab['E Storage'], aa['E Storage'],
                                   rtol=1e-12)
        np.testing.assert_allclose(ba['E Loss'], aa['E Loss'], rtol=1e-12)
        self.assertFalse(np.allclose(ab['E Loss'], aa['E Loss']))

    def test_tan_delta_noise_is_the_independent_ratio_formula(self):
        """New E' and E'' readings are independent:
        sqrt((s''/E')^2 + (E'' s'/E'^2)^2)."""
        rel_s = np.linspace(0.01, 0.10, len(self.omega_data))
        rel_l = np.linspace(0.20, 0.02, len(self.omega_data))
        omega = np.logspace(-3, 3, 15)
        got = self._noise(omega, rel_s, rel_l)
        stor, loss = self._fit_curve(omega)
        want = np.sqrt((got['E Loss'] / stor) ** 2
                       + (loss * got['E Storage'] / stor ** 2) ** 2)
        np.testing.assert_allclose(got['tan delta'], want, rtol=1e-12)


class TestBandsOnARealFit(unittest.TestCase):
    """The covariance a smoothed fit reports, propagated through the bands."""

    @classmethod
    def setUpClass(cls):
        # Peaked Prony source with a small equilibrium modulus, 5% errors.
        tau = np.logspace(-4.0, 4.0, 9)
        E_input = np.concatenate(
            ([1e6], np.exp(-(np.log10(tau)) ** 2 / 4.0) * 1e9))
        df = compute_complex(tau, E_input, num_pts=200)
        cls.omega = df['Frequency'].to_numpy()
        E_stor = df['E Storage'].to_numpy()
        E_loss = df['E Loss'].to_numpy()
        std = np.abs(E_stor + 1.0j * E_loss) * 0.05
        cls.tau_i, cls.E_i, cls.quality = smooth_prony_fit(
            cls.omega, E_stor, E_loss, E_stor_std=std, E_loss_std=std,
            N=20, smoothness=0.3, solid=True, return_fit_quality=True,
        )

    def test_tan_delta_narrower_than_uncorrelated_combination(self):
        """E' and E'' share every coefficient, so the directly propagated
        tan delta sigma is typically below tan_d * hypot(s'/E', s''/E'').
        Not at every frequency: the correlation can change sign."""
        cov = self.quality.covariance
        self.assertIsNotNone(cov)
        curve = compute_complex(self.tau_i, self.E_i)
        freq = curve['Frequency'].to_numpy()
        E_stor = curve['E Storage'].to_numpy()
        E_loss = curve['E Loss'].to_numpy()
        got = _uncertainty().complex_modulus_sigma(
            freq, self.tau_i, self.E_i, cov)
        uncorrelated = (E_loss / E_stor) * np.hypot(
            got['E Storage'] / E_stor, got['E Loss'] / E_loss)
        self.assertLess(np.median(got['tan delta'] / uncorrelated), 1.0)
