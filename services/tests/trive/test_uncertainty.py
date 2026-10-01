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
    """1-sigma of E(t) = sum_i E_i exp(-t/tau_i), equilibrium term excluded."""

    def setUp(self):
        self.rng = np.random.default_rng(23)
        self.tau_i = np.logspace(-2, 2, 6)
        self.t = np.logspace(-3, 3, 12)
        self.E_i = np.abs(self.rng.normal(size=7)) + 0.5  # solid, E_eq first
        self.cov = _random_cov(self.rng, 7)

    def test_matches_brute_force_over_the_decaying_block(self):
        """sqrt(g Sigma g.T) with g_j = E_j exp(-t/tau_j) over the decaying
        rows and columns of the covariance."""
        got = _uncertainty().relaxation_sigma(
            self.t, self.tau_i, self.E_i, self.cov)
        G = np.exp(-np.outer(self.t, 1 / self.tau_i)) * self.E_i[1:]
        np.testing.assert_allclose(
            got, _quadratic_forms(G, self.cov[1:, 1:]), rtol=1e-10)

    def test_equilibrium_row_is_marginalized_exactly(self):
        """Dropping the equilibrium row is exact: the result equals the
        viscous and clamped calls and ignores the row's contents."""
        u = _uncertainty()
        got = u.relaxation_sigma(self.t, self.tau_i, self.E_i, self.cov)
        dec = self.cov[1:, 1:]
        np.testing.assert_allclose(
            got, u.relaxation_sigma(self.t, self.tau_i, self.E_i[1:], dec),
            rtol=1e-12)
        E_clamped = np.concatenate(([0.0], self.E_i[1:]))
        np.testing.assert_allclose(
            got, u.relaxation_sigma(self.t, self.tau_i, E_clamped, dec),
            rtol=1e-12)
        other = self.cov.copy()
        other[0, :] = other[:, 0] = 0.3
        other[0, 0] = 50.0
        np.testing.assert_array_equal(
            got, u.relaxation_sigma(self.t, self.tau_i, self.E_i, other))


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
