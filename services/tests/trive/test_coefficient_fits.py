"""
Shift-coefficient calibration: `fit_wlf_coefficients` (recovers C1/C2) and
`fit_hybrid_coefficients` (recovers C1/C2/Ea) from measured shift-factor data.
Both co-fit the a_T_ref offset — the data's shift factor at the model's anchor.
`search_hybrid_tc` chooses Tc itself by a grid search and a 1D refinement.

Pure functions running the real optimizer on small synthetic data — no Flask
app, no disk. Run when changing the fit math, the pole-avoidance bounds, the
free-Ea bounds, the Tc search, or the degenerate-segment guards.

    python -m unittest tests.trive.test_coefficient_fits
"""
import unittest
import os
os.environ['OPENBLAS_NUM_THREADS'] = '1'
import sys
import numpy as np

# Append the directory above 'tests' to sys.path to find the 'app' module
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))

from app.trive.shift import (
    wlf_shift,
    _arr_shift,
    hybrid_shift,
    UNIVERSAL_WLF_C1,
    UNIVERSAL_WLF_C2,
)
from app.trive.calibration import fit_wlf_coefficients, fit_hybrid_coefficients
import app.trive as trive

from ._tc_scan import (
    assert_search_properties,
    candidate_grid,
    chi2_sum,
    scan_candidates,
)


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
        C1_fit, C2_fit, _ = fit_wlf_coefficients(
            self.T, self.a_T, self.T_REF,
            C1=self.C1_TRUE, C2=self.C2_TRUE,
        )
        self.assertAlmostEqual(C1_fit, self.C1_TRUE, places=4)
        self.assertAlmostEqual(C2_fit, self.C2_TRUE, places=4)

    def test_fixed_C1_returned_exactly_and_C2_fitted(self):
        # C1 is pinned; C2 must be fitted back to truth.
        C1_fit, C2_fit, _ = fit_wlf_coefficients(
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
        C1_fit, C2_fit, _ = fit_wlf_coefficients(T, a_T, self.T_REF)
        self.assertAlmostEqual(C1_fit, UNIVERSAL_WLF_C1, places=4)
        self.assertAlmostEqual(C2_fit, UNIVERSAL_WLF_C2, places=4)

    def test_returns_a_T_ref_near_one_for_Tg_referenced_data(self):
        # setUpClass data is exact WLF at T_REF (a_T == 1 there), so the
        # co-fitted offset must come back at 1.0 and leave C1/C2 alone.
        *_, a_T_ref = fit_wlf_coefficients(self.T, self.a_T, self.T_REF)
        self.assertAlmostEqual(a_T_ref, 1.0, places=6)

    def test_recovers_offset_when_data_is_not_referenced_to_Tg(self):
        # A master curve built at some other temperature carries a_T == 1
        # there, not at Tg — the whole table is scaled by a constant. The fit
        # must attribute that constant to a_T_ref and still return the true
        # shape parameters, over decades of offset in both directions.
        for K in (1.0e3, 1.0e-6):
            with self.subTest(K=K):
                C1_fit, C2_fit, a_T_ref = fit_wlf_coefficients(
                    self.T, self.a_T * K, self.T_REF)
                self.assertAlmostEqual(C1_fit, self.C1_TRUE, places=4)
                self.assertAlmostEqual(C2_fit, self.C2_TRUE, places=4)
                self.assertAlmostEqual(a_T_ref / K, 1.0, places=4)

    def test_offset_is_fitted_even_with_both_shape_params_fixed(self):
        # C1/C2 fixed leaves the offset as the only free parameter — a
        # one-parameter linear least squares, not "nothing to optimize".
        K = 250.0
        C1_fit, C2_fit, a_T_ref = fit_wlf_coefficients(
            self.T, self.a_T * K, self.T_REF,
            C1=self.C1_TRUE, C2=self.C2_TRUE, fix_C1=True, fix_C2=True,
        )
        self.assertEqual((C1_fit, C2_fit), (self.C1_TRUE, self.C2_TRUE))
        self.assertAlmostEqual(a_T_ref / K, 1.0, places=6)

    def test_offset_beats_the_anchored_fit_on_offset_data(self):
        # The point of co-fitting: anchoring at a_T == 1 forces C1/C2 to absorb
        # the offset, which they cannot do without distorting the shape.
        K = 100.0
        C1_fit, C2_fit, a_T_ref = fit_wlf_coefficients(
            self.T, self.a_T * K, self.T_REF)
        free = np.log10(wlf_shift(self.T, self.T_REF, C1_fit, C2_fit, a_T_ref))
        anchored = np.log10(wlf_shift(self.T, self.T_REF, C1_fit, C2_fit))
        target = np.log10(self.a_T * K)
        self.assertLess(np.abs(free - target).max(), 1e-6)
        self.assertGreater(np.abs(anchored - target).max(), 1.0)

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
        C1_fit, C2_fit, _ = fit_wlf_coefficients(T, a_T, T_ref_local)

        self.assertTrue(np.isfinite(C1_fit) and C1_fit > 0,
                        f"Expected finite positive C1, got {C1_fit}")
        self.assertGreaterEqual(C2_fit, c2_min,
                                f"C2_fit {C2_fit:.4f} < c2_min {c2_min:.4f} — bound not respected")


class TestFitHybridCoefficients(unittest.TestCase):
    """Tests for fit_hybrid_coefficients — pure function, no Flask app needed."""

    TC = 25.0       # WLF/Arrhenius crossover — required input, never fitted
    C1_TRUE = 14.0
    C2_TRUE = 45.0
    EA_TRUE = 200.0  # kJ/mol — inside the free-Ea bounds, away from either

    @classmethod
    def setUpClass(cls):
        # Span both sides of TC so both Arrhenius and WLF branches are exercised.
        cls.T = np.linspace(5.0, 70.0, 30)
        cls.a_T = hybrid_shift(cls.T, cls.TC, cls.C1_TRUE, cls.C2_TRUE, cls.EA_TRUE)

    def test_round_trip_recovers_C1_C2_and_Ea(self):
        C1_fit, C2_fit, Ea_fit, a_T_ref = fit_hybrid_coefficients(
            self.T, self.a_T, self.TC,
            C1=self.C1_TRUE, C2=self.C2_TRUE, Ea=self.EA_TRUE,
        )
        self.assertAlmostEqual(C1_fit, self.C1_TRUE, places=4)
        self.assertAlmostEqual(C2_fit, self.C2_TRUE, places=4)
        self.assertAlmostEqual(Ea_fit, self.EA_TRUE, places=4)

    def test_fixed_Ea_returned_exactly_and_others_fitted(self):
        # Ea is pinned; C1 and C2 must be recovered from the data.
        C1_fit, C2_fit, Ea_fit, a_T_ref = fit_hybrid_coefficients(
            self.T, self.a_T, self.TC,
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
            fit_hybrid_coefficients(self.T, bad_a_T, self.TC)

    def test_returns_a_T_ref_near_one_for_TL_referenced_data(self):
        # setUpClass data is built referenced to TC (hybrid_shift, a_T_ref=1), so
        # the co-fitted a_T_ref recovers ~1.0.
        *_, a_T_ref = fit_hybrid_coefficients(
            self.T, self.a_T, self.TC,
            C1=self.C1_TRUE, C2=self.C2_TRUE, Ea=self.EA_TRUE,
        )
        self.assertAlmostEqual(a_T_ref, 1.0, places=4)

    def test_cofits_offset_for_unreferenced_data(self):
        # Data scaled by a known constant K (reference shifted off TC): the fit
        # recovers K as a_T_ref and the same C1/C2/Ea.
        K = 12.0
        C1_fit, C2_fit, Ea_fit, a_T_ref = fit_hybrid_coefficients(
            self.T, K * self.a_T, self.TC,
            C1=self.C1_TRUE, C2=self.C2_TRUE, Ea=self.EA_TRUE,
        )
        self.assertAlmostEqual(a_T_ref, K, places=3)
        self.assertAlmostEqual(C1_fit, self.C1_TRUE, places=3)
        self.assertAlmostEqual(C2_fit, self.C2_TRUE, places=3)
        self.assertAlmostEqual(Ea_fit, self.EA_TRUE, places=3)

    def test_degenerate_Arrhenius_guard_fires_and_suppressed_by_fix_Ea(self):
        # All data above TC → empty Arrhenius segment → ValueError while Ea is
        # free; fixing Ea suppresses the guard and the WLF-only fit succeeds.
        T = np.linspace(30.0, 70.0, 20)
        a_T = wlf_shift(T, 25.0, self.C1_TRUE, self.C2_TRUE)
        with self.assertRaises(ValueError):
            fit_hybrid_coefficients(T, a_T, TC=25.0)
        C1_fit, C2_fit, Ea_fit, _ = fit_hybrid_coefficients(
            T, a_T, TC=25.0, Ea=self.EA_TRUE, fix_Ea=True,
        )
        self.assertEqual(Ea_fit, self.EA_TRUE)
        self.assertAlmostEqual(C1_fit, self.C1_TRUE, places=3)
        self.assertAlmostEqual(C2_fit, self.C2_TRUE, places=3)

    def test_degenerate_WLF_guard_fires_and_suppressed_by_fix_C(self):
        # All data below TC → empty WLF segment → ValueError while C1/C2 are
        # free; fixing them suppresses the guard and the Arrhenius-only fit
        # recovers Ea.
        T = np.linspace(5.0, 20.0, 20)
        a_T = _arr_shift(T, 25.0, self.EA_TRUE)
        with self.assertRaises(ValueError):
            fit_hybrid_coefficients(T, a_T, TC=25.0)
        C1_fit, C2_fit, Ea_fit, _ = fit_hybrid_coefficients(
            T, a_T, TC=25.0, C1=self.C1_TRUE, C2=self.C2_TRUE,
            fix_C1=True, fix_C2=True,
        )
        self.assertEqual((C1_fit, C2_fit), (self.C1_TRUE, self.C2_TRUE))
        self.assertAlmostEqual(Ea_fit, self.EA_TRUE, places=3)

    def test_all_fixed_returns_four_tuple_and_cofits_offset(self):
        # C1/C2/Ea all fixed → echoed exactly; a_T_ref is still co-fitted.
        K = 7.0
        C1_fit, C2_fit, Ea_fit, a_T_ref = fit_hybrid_coefficients(
            self.T, K * self.a_T, self.TC,
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
        # the direction handling of the model and its co-fitted a_T_ref.
        C1_fit, C2_fit, Ea_fit, a_T_ref = fit_hybrid_coefficients(
            self.T[::-1], self.a_T[::-1], self.TC,
            C1=self.C1_TRUE, C2=self.C2_TRUE, Ea=self.EA_TRUE,
        )
        self.assertAlmostEqual(C1_fit, self.C1_TRUE, places=4)
        self.assertAlmostEqual(C2_fit, self.C2_TRUE, places=4)
        self.assertAlmostEqual(Ea_fit, self.EA_TRUE, places=4)
        self.assertAlmostEqual(a_T_ref, 1.0, places=4)


class TestHybridEaBounds(unittest.TestCase):
    """A free Ea is optimized within [100, 400] kJ/mol, bounds included; a
    fixed Ea is not optimized, so the bounds do not apply to it."""

    TC = 25.0
    C1_TRUE = 14.0
    C2_TRUE = 45.0
    EA_MIN = 100.0
    EA_MAX = 400.0
    # A solver may stop just inside an active bound, never outside it.
    AT_BOUND = 1e-3  # kJ/mol

    @classmethod
    def setUpClass(cls):
        cls.T = np.linspace(5.0, 70.0, 30)

    def _data(self, Ea):
        return hybrid_shift(self.T, self.TC, self.C1_TRUE, self.C2_TRUE, Ea)

    def _fit(self, Ea_true, **kwargs):
        return fit_hybrid_coefficients(
            self.T, self._data(Ea_true), self.TC,
            C1=self.C1_TRUE, C2=self.C2_TRUE, **kwargs,
        )

    def _assert_at_bound(self, Ea_fit, bound):
        self.assertGreaterEqual(Ea_fit, self.EA_MIN)
        self.assertLessEqual(Ea_fit, self.EA_MAX)
        self.assertAlmostEqual(Ea_fit, bound, delta=self.AT_BOUND)

    def test_free_Ea_optimum_below_range_returns_lower_bound(self):
        """Data whose optimum Ea is 60 fits at the 100 kJ/mol bound."""
        _, _, Ea_fit, _ = self._fit(60.0)
        self._assert_at_bound(Ea_fit, self.EA_MIN)

    def test_free_Ea_optimum_above_range_returns_upper_bound(self):
        """Data whose optimum Ea is 600 fits at the 400 kJ/mol bound."""
        _, _, Ea_fit, _ = self._fit(600.0)
        self._assert_at_bound(Ea_fit, self.EA_MAX)

    def test_other_coefficients_are_optimized_against_the_active_bound(self):
        """A fit stopped at a bound equals the fit with Ea fixed there, so the
        bound constrains the optimization, not only the reported Ea. A free
        Ea counts as a parameter even at its bound, so chi2 keeps nu = n - 4
        where the Ea-held fit has nu = n - 3."""
        n = self.T.size
        for Ea_true, bound in ((60.0, self.EA_MIN), (600.0, self.EA_MAX)):
            with self.subTest(Ea_true=Ea_true):
                C1_fit, C2_fit, _, a_T_ref, chi2 = self._fit(
                    Ea_true, return_quality=True)
                C1_held, C2_held, _, a_T_ref_held, chi2_held = self._fit(
                    Ea_true, Ea=bound, fix_Ea=True, return_quality=True)
                np.testing.assert_allclose(
                    [C1_fit, C2_fit, a_T_ref],
                    [C1_held, C2_held, a_T_ref_held],
                    rtol=1e-2,
                )
                np.testing.assert_allclose(
                    chi2, chi2_held * (n - 3) / (n - 4), rtol=1e-2)

    def test_out_of_range_initial_guess_is_clipped_into_range(self):
        """A free Ea guess outside the bounds is a start point, not an error:
        the fit still finds an in-range optimum and still stops at a bound."""
        cases = (
            (50.0, 200.0, 200.0),
            (900.0, 200.0, 200.0),
            (50.0, 60.0, self.EA_MIN),
            (900.0, 600.0, self.EA_MAX),
        )
        for guess, Ea_true, expected in cases:
            with self.subTest(guess=guess, Ea_true=Ea_true):
                _, _, Ea_fit, _ = self._fit(Ea_true, Ea=guess)
                self.assertAlmostEqual(
                    Ea_fit, expected, delta=self.AT_BOUND)

    def test_fixed_out_of_range_Ea_is_returned_exactly(self):
        """fix_Ea holds any supplied value, inside the bounds or not."""
        for Ea in (80.0, 500.0):
            with self.subTest(Ea=Ea):
                C1_fit, C2_fit, Ea_fit, _ = self._fit(Ea, Ea=Ea, fix_Ea=True)
                self.assertEqual(Ea_fit, Ea)
                self.assertAlmostEqual(C1_fit, self.C1_TRUE, places=4)
                self.assertAlmostEqual(C2_fit, self.C2_TRUE, places=4)


class TestSearchHybridTc(unittest.TestCase):
    """search_hybrid_tc chooses Tc from the table's measured temperatures,
    keeping two points on either side, then refines across the best one's
    left and right neighbours on that grid."""

    C1_TRUE = 14.0
    C2_TRUE = 45.0
    EA_TRUE = 120.0  # shallow Arrhenius against WLF's C1/C2 slope at Tc
    TC_OFF_GRID = 27.3
    # On noiseless data the objective is sharply quadratic about the true Tc,
    # and a grid-only answer is 2.3 degC away.
    TC_RECOVERY = 0.1

    @classmethod
    def setUpClass(cls):
        cls.T = np.arange(-20.0, 91.0, 5.0)
        cls.T_NOISY = np.arange(-20.0, 71.0, 5.0)
        # Deterministic multiplicative noise, ~0.1 decades.
        rng = np.random.RandomState(0)
        cls.a_T_noisy = hybrid_shift(
            cls.T_NOISY, 22.0, cls.C1_TRUE, cls.C2_TRUE, 150.0,
        ) * 10.0 ** (0.1 * rng.randn(len(cls.T_NOISY)))

    def _table(self, TC, Ea=None, a_T_ref=1.0):
        return hybrid_shift(self.T, TC, self.C1_TRUE, self.C2_TRUE,
                            self.EA_TRUE if Ea is None else Ea, a_T_ref)

    def test_noiseless_off_grid_tc_and_coefficients_are_recovered(self):
        """A true Tc between measured temperatures is found by the refinement,
        with the coefficients and offset that belong to it."""
        a_T = self._table(self.TC_OFF_GRID, a_T_ref=3.0)
        result = trive.search_hybrid_tc(self.T, a_T)
        TC, C1, C2, Ea, a_T_ref, _ = result
        self.assertAlmostEqual(TC, self.TC_OFF_GRID, delta=self.TC_RECOVERY)
        self.assertAlmostEqual(C1, self.C1_TRUE, delta=0.2)
        self.assertAlmostEqual(C2, self.C2_TRUE, delta=1.0)
        self.assertAlmostEqual(Ea, self.EA_TRUE, delta=1.0)
        self.assertAlmostEqual(a_T_ref, 3.0, delta=0.2)
        assert_search_properties(self, self.T, a_T, result)

    def test_held_coefficients_are_returned_exactly_while_tc_is_searched(self):
        """Tc is searched with supplied values held, and a held Ea may lie
        outside the free-Ea range."""
        cases = (
            (120.0, {'Ea': 120.0, 'fix_Ea': True}),
            (60.0, {'Ea': 60.0, 'fix_Ea': True}),
            (120.0, {'C1': 14.0, 'fix_C1': True}),
            (120.0, {'C1': 14.0, 'C2': 45.0, 'fix_C1': True, 'fix_C2': True}),
        )
        for Ea_true, hold in cases:
            with self.subTest(hold=hold):
                a_T = self._table(self.TC_OFF_GRID, Ea=Ea_true)
                result = trive.search_hybrid_tc(self.T, a_T, **hold)
                self.assertAlmostEqual(
                    result[0], self.TC_OFF_GRID, delta=self.TC_RECOVERY)
                assert_search_properties(self, self.T, a_T, result, **hold)

    def test_all_coefficients_held_positionally_leaves_only_tc_and_offset(self):
        """The signature takes the guesses, then the fix flags, after a_T."""
        a_T = self._table(self.TC_OFF_GRID, a_T_ref=3.0)
        result = trive.search_hybrid_tc(
            self.T, a_T, 14.0, 45.0, 120.0, True, True, True)
        self.assertAlmostEqual(
            result[0], self.TC_OFF_GRID, delta=self.TC_RECOVERY)
        assert_search_properties(
            self, self.T, a_T, result, C1=14.0, C2=45.0, Ea=120.0,
            fix_C1=True, fix_C2=True, fix_Ea=True)

    def test_noisy_table_result_has_the_search_properties(self):
        """Between the best candidate's neighbours, no worse than any
        candidate, and chi2_reduced over n - (5 - fixes), for any set of held
        values."""
        for hold in ({},
                     {'Ea': 150.0, 'fix_Ea': True},
                     {'C1': 14.0, 'fix_C1': True},
                     {'C1': 14.0, 'C2': 45.0, 'fix_C1': True, 'fix_C2': True},
                     {'C1': 14.0, 'C2': 45.0, 'Ea': 150.0, 'fix_C1': True,
                      'fix_C2': True, 'fix_Ea': True}):
            with self.subTest(hold=hold):
                result = trive.search_hybrid_tc(
                    self.T_NOISY, self.a_T_noisy, **hold)
                assert_search_properties(
                    self, self.T_NOISY, self.a_T_noisy, result, **hold)

    def test_refinement_reaches_side_away_from_an_adjacent_second_best(self):
        """A noiseless true Tc beside the best candidate is recovered when the
        second best is the neighbour on the other side of the best."""
        cold = [-20.0, -10.0, 0.0]
        hot = [50.0, 60.0, 70.0, 80.0, 90.0]
        for middle, expected_best, expected_second in (
                ([15.0, 28.0, 30.0, 40.0], 28.0, 30.0),
                ([10.0, 25.0, 27.0, 40.0], 27.0, 25.0)):
            with self.subTest(middle=middle):
                T = np.array(cold + middle + hot)
                a_T = hybrid_shift(T, self.TC_OFF_GRID, self.C1_TRUE,
                                   self.C2_TRUE, self.EA_TRUE)
                (_, best_TC), (_, second_TC) = scan_candidates(T, a_T)[:2]
                self.assertEqual(
                    (best_TC, second_TC), (expected_best, expected_second))

                result = trive.search_hybrid_tc(T, a_T)
                self.assertAlmostEqual(
                    result[0], self.TC_OFF_GRID, delta=self.TC_RECOVERY)
                assert_search_properties(self, T, a_T, result)

    def test_refinement_reaches_a_dip_away_from_a_distant_second_best(self):
        """The second best lies two grid steps above the best, and the lower
        objective is just below the best, inside its left neighbour."""
        T = np.arange(0.0, 76.0, 5.0)
        rng = np.random.RandomState(0)
        a_T = hybrid_shift(T, 30.0, self.C1_TRUE, self.C2_TRUE, 150.0) \
            * 10.0 ** (0.6 * rng.randn(len(T)))
        (best, best_TC), (_, second_TC) = scan_candidates(T, a_T)[:2]
        self.assertEqual((best_TC, second_TC), (20.0, 30.0))

        result = trive.search_hybrid_tc(T, a_T)
        self.assertLess(result[0], best_TC)
        self.assertLess(chi2_sum(T, a_T, *result[:5]), best)
        assert_search_properties(self, T, a_T, result)

    def test_refinement_stops_at_the_only_neighbour_at_an_end_of_the_grid(self):
        """The best candidate first or last on the grid refines toward its one
        neighbour, so a lower objective past that neighbour is not reached,
        even at a second best further along the grid."""
        for n, seed, amplitude, TC_true, end, neighbour, second in (
                (12, 424, 0.6, 10.0, 0, 1, 30.0),
                (10, 224, 0.3, 30.0, -1, -2, 25.0)):
            with self.subTest(end=end):
                T = np.arange(0.0, n * 5.0, 5.0)
                rng = np.random.RandomState(seed)
                a_T = hybrid_shift(
                    T, TC_true, self.C1_TRUE, self.C2_TRUE, 150.0,
                ) * 10.0 ** (amplitude * rng.randn(n))
                grid = candidate_grid(T)
                (_, best_TC), (_, second_TC) = scan_candidates(T, a_T)[:2]
                self.assertEqual((best_TC, second_TC), (grid[end], second))

                result = trive.search_hybrid_tc(T, a_T)
                self.assertGreaterEqual(
                    result[0], min(grid[end], grid[neighbour]))
                self.assertLessEqual(
                    result[0], max(grid[end], grid[neighbour]))
                assert_search_properties(self, T, a_T, result)

    def test_refinement_at_an_end_of_the_grid_finds_tc_in_the_interval(self):
        """A noiseless true Tc between an end candidate and its one neighbour
        is recovered from either end."""
        grid = candidate_grid(self.T)
        for TC_true, expected_best in ((grid[0] + 1.5, grid[0]),
                                       (grid[-1] - 1.0, grid[-1])):
            with self.subTest(TC_true=TC_true):
                a_T = self._table(TC_true)
                self.assertEqual(scan_candidates(self.T, a_T)[0][1],
                                 expected_best)
                result = trive.search_hybrid_tc(self.T, a_T)
                self.assertAlmostEqual(
                    result[0], TC_true, delta=self.TC_RECOVERY)
                assert_search_properties(self, self.T, a_T, result)

    def test_a_neighbour_whose_fit_fails_still_bounds_the_refinement(self):
        """Neighbours are adjacent on the grid however they scored: with these
        C1 and C2 held the 35 degC fit raises, yet refinement around the best
        candidate, 40 degC, still reaches the true Tc on that side of it."""
        T = np.arange(0.0, 71.0, 5.0)
        hold = {'C1': -400.0, 'C2': 10.0, 'fix_C1': True, 'fix_C2': True}
        a_T = hybrid_shift(T, 39.0, -400.0, 10.0, 150.0)
        scan = scan_candidates(T, a_T, **hold)
        self.assertEqual((scan[0][1], scan[1][1]), (40.0, 45.0))
        self.assertNotIn(35.0, [TC for _, TC in scan])

        result = trive.search_hybrid_tc(T, a_T, **hold)
        self.assertAlmostEqual(result[0], 39.0, delta=self.TC_RECOVERY)
        assert_search_properties(self, T, a_T, result, **hold)

    def test_result_is_never_worse_than_the_best_candidate(self):
        """Noiseless data whose true Tc is a measured temperature cannot be
        improved on: any point strictly inside the interval scores higher, so
        the candidate itself comes back."""
        a_T = self._table(25.0)
        result = trive.search_hybrid_tc(self.T, a_T)
        self.assertAlmostEqual(result[0], 25.0, delta=1e-3)
        # The candidate scores ~5e-19; 1e-5 degC away from it scores ~2e-12.
        self.assertLess(chi2_sum(self.T, a_T, *result[:5]), 1e-16)
        assert_search_properties(self, self.T, a_T, result)

    def test_candidates_stop_two_temperatures_from_each_end(self):
        """T[1] and T[n-3] are the end candidates, since a point at Tc is on
        the cold side; a best fit further out is not available."""
        n = len(self.T)
        for k, on_candidate, hold in (
                (1, True, {}),
                (n - 3, True, {}),
                (0, False, {'Ea': 120.0, 'fix_Ea': True}),
                (n - 2, False, {})):
            with self.subTest(T_true=self.T[k]):
                a_T = self._table(self.T[k])
                result = trive.search_hybrid_tc(self.T, a_T, **hold)
                self.assertGreaterEqual(result[0], self.T[1])
                self.assertLessEqual(result[0], self.T[n - 3])
                if on_candidate:
                    self.assertAlmostEqual(result[0], self.T[k], delta=1e-3)
                assert_search_properties(self, self.T, a_T, result, **hold)

    def test_five_rows_search_only_two_candidates_and_count_tc_as_free(self):
        """Five rows have no surplus against five free parameters, so
        chi2_reduced is None until a coefficient is held."""
        T = np.array([0.0, 10.0, 20.0, 30.0, 40.0])
        a_T = np.array([3.0, 2.0, 1.0, 0.5, 0.25])
        result = trive.search_hybrid_tc(T, a_T)
        self.assertIsNone(result[5])
        assert_search_properties(self, T, a_T, result)
        hold = {'Ea': 150.0, 'fix_Ea': True}
        result = trive.search_hybrid_tc(T, a_T, **hold)
        self.assertIsNotNone(result[5])
        assert_search_properties(self, T, a_T, result, **hold)

    def test_four_rows_fit_at_the_only_candidate_without_refinement(self):
        """T[1] is the one feasible Tc, so it comes back exactly, however
        much the data would prefer another."""
        T = np.array([0.0, 10.0, 20.0, 30.0])
        a_T = hybrid_shift(T, 15.0, self.C1_TRUE, self.C2_TRUE, 150.0)
        TC, C1, C2, Ea, a_T_ref, chi2 = trive.search_hybrid_tc(T, a_T)
        self.assertEqual(TC, 10.0)
        np.testing.assert_allclose(
            [C1, C2, Ea, a_T_ref],
            fit_hybrid_coefficients(T, a_T, 10.0), rtol=1e-6)
        self.assertIsNone(chi2)

    def test_fewer_than_four_rows_raises_value_error(self):
        T = np.array([0.0, 10.0, 20.0])
        a_T = np.array([3.0, 1.0, 0.5])
        for n in (1, 2, 3):
            with self.subTest(n=n):
                with self.assertRaises(ValueError):
                    trive.search_hybrid_tc(T[:n], a_T[:n])

    def test_candidates_whose_fit_fails_are_skipped(self):
        """With these C1 and C2 held, WLF overflows when the hottest point is
        over 33.5 degC above Tc, so the fits below 40 degC raise ValueError."""
        T = np.arange(0.0, 71.0, 5.0)
        hold = {'C1': -400.0, 'C2': 10.0, 'fix_C1': True, 'fix_C2': True}
        a_T = hybrid_shift(T, 50.0, -400.0, 10.0, 150.0)
        result = trive.search_hybrid_tc(T, a_T, **hold)
        self.assertAlmostEqual(result[0], 50.0, delta=1e-3)
        assert_search_properties(self, T, a_T, result, **hold)

    def test_every_candidate_failing_raises_value_error(self):
        overflow_T = np.array([0.0, 40.0, 80.0, 120.0, 160.0, 200.0])
        overflow_a_T = np.array([3.0, 2.0, 1.0, 0.5, 0.25, 0.1])
        with self.subTest('every fit overflows'):
            with self.assertRaises(ValueError):
                trive.search_hybrid_tc(
                    overflow_T, overflow_a_T, C1=-400.0, C2=10.0,
                    fix_C1=True, fix_C2=True)
        with self.subTest('a non-positive shift factor'):
            bad_a_T = self._table(25.0)
            bad_a_T[5] = 0.0
            with self.assertRaises(ValueError):
                trive.search_hybrid_tc(self.T, bad_a_T)

    def test_duplicate_temperatures_stay_an_assertion_error(self):
        """The fit's sortedness assert is not a failed candidate to skip."""
        T = np.array([0.0, 0.0, 10.0, 20.0, 30.0, 40.0, 50.0])
        a_T = np.array([9.0, 8.0, 4.0, 1.0, 0.5, 0.25, 0.1])
        with self.assertRaises(AssertionError):
            trive.search_hybrid_tc(T, a_T)

    def test_sigma_weights_decide_the_search(self):
        """The objective is sigma-weighted: a table whose cold half has its
        kink at 5 degC and hot half at 45 degC follows whichever half the
        Error column trusts."""
        T = self.T_NOISY
        a_T = np.where(
            T < 25.0,
            hybrid_shift(T, 5.0, self.C1_TRUE, self.C2_TRUE, 150.0),
            hybrid_shift(T, 45.0, self.C1_TRUE, self.C2_TRUE, 150.0))
        sigma = a_T * np.log(10.0) * 0.1
        for ignored, low, high in ((T < 25.0, 30.0, 70.0),
                                   (T >= 25.0, -20.0, 20.0)):
            with self.subTest(low=low, high=high):
                sigma_a_T = np.where(ignored, 100.0 * sigma, sigma)
                result = trive.search_hybrid_tc(T, a_T, sigma_a_T=sigma_a_T)
                self.assertGreater(result[0], low)
                self.assertLess(result[0], high)
                assert_search_properties(
                    self, T, a_T, result, sigma_a_T=sigma_a_T)


class TestHybridOffsetFarFromTC(unittest.TestCase):
    """fit_hybrid_coefficients finds a_T_ref in log space: data referenced
    many decades away from TC fits as accurately as data referenced near it."""

    TC = 25.0
    # Coefficients the fit is seeded with (and pinned to when fixed; a free
    # EA seed is clipped into its bounds first). The data
    # below is generated with different ones plus noise, so the optimum
    # offset is not simply the data's value at TC.
    C1 = 14.0
    C2 = 45.0
    EA = 80.0
    FACTORS = (1e10, 1e-10)

    @classmethod
    def setUpClass(cls):
        cls.T = np.linspace(5.0, 70.0, 30)
        noise = 0.05 * np.random.default_rng(0).standard_normal(cls.T.size)
        cls.a_T = hybrid_shift(cls.T, cls.TC, 12.0, 50.0, 95.0) * 10 ** noise

    def _fit(self, a_T, fixed, **kwargs):
        return fit_hybrid_coefficients(
            self.T, a_T, self.TC, C1=self.C1, C2=self.C2, Ea=self.EA,
            fix_C1=fixed, fix_C2=fixed, fix_Ea=fixed, **kwargs,
        )

    def _assert_offset_equivariant(self, fixed):
        # Rescaling a_T only moves the reference, so the offset must scale by
        # the same factor and the shape coefficients must not move at all.
        *coeffs_0, a_T_ref_0 = self._fit(self.a_T, fixed)
        for factor in self.FACTORS:
            with self.subTest(factor=factor):
                *coeffs, a_T_ref = self._fit(factor * self.a_T, fixed)
                np.testing.assert_allclose(
                    a_T_ref, factor * a_T_ref_0, rtol=1e-6)
                np.testing.assert_allclose(coeffs, coeffs_0, rtol=1e-6)

    def test_offset_scales_with_data_when_all_coefficients_fixed(self):
        # The offset is the only free parameter here, the reported failure.
        self._assert_offset_equivariant(fixed=True)

    def test_offset_scales_with_data_when_coefficients_free(self):
        self._assert_offset_equivariant(fixed=False)

    def test_all_fixed_offset_is_weighted_mean_log_residual_far_from_TC(self):
        # With C1/C2/Ea pinned the model is linear in log10(a_T_ref), so the
        # least-squares offset is the 1/sigma^2-weighted mean of the residual
        # against the unit-referenced model. Unequal sigmas check the weights.
        factor = 1e10
        a_T = factor * self.a_T
        sigma_log10 = np.linspace(0.02, 0.2, self.T.size)
        sigma_a_T = sigma_log10 * a_T * np.log(10.0)
        resid = np.log10(a_T) - np.log10(
            hybrid_shift(self.T, self.TC, self.C1, self.C2, self.EA))
        weights = sigma_log10 ** -2
        expected = float(weights @ resid / weights.sum())
        # Guard: the optimum is not simply the data's interpolated value at TC.
        seed = np.interp(self.TC, self.T, np.log10(a_T))
        self.assertGreater(abs(expected - seed), 0.1)

        *_, a_T_ref = self._fit(a_T, fixed=True, sigma_a_T=sigma_a_T)
        self.assertAlmostEqual(np.log10(a_T_ref), expected, places=6)


class TestShiftFitQuality(unittest.TestCase):
    """
    return_quality / sigma_a_T behavior of both shift-coefficient fits.

    The chi-squared is computed in log10(a_T) space with sigma converted by
    first-order propagation (sigma / (a_T ln 10)); with no Error column every
    point gets unit sigma in decades, which reproduces curve_fit's implicit
    unweighted fit exactly.
    """

    T_REF = 25.0
    C1_TRUE = 14.0
    C2_TRUE = 45.0

    @classmethod
    def setUpClass(cls):
        cls.T = np.linspace(30.0, 80.0, 20)
        cls.a_T = wlf_shift(cls.T, cls.T_REF, cls.C1_TRUE, cls.C2_TRUE)
        # Deterministic multiplicative noise, ~0.1 decades.
        rng = np.random.RandomState(0)
        cls.a_T_noisy = cls.a_T * 10.0 ** (0.1 * rng.randn(len(cls.T)))

    def test_default_arity_carries_the_co_fitted_offset(self):
        self.assertEqual(
            len(fit_wlf_coefficients(self.T, self.a_T, self.T_REF)), 3)

    def test_wlf_quality_arity_and_exact_data_chi2_is_zero(self):
        result = fit_wlf_coefficients(
            self.T, self.a_T, self.T_REF, return_quality=True)
        self.assertEqual(len(result), 4)
        self.assertLess(result[3], 1e-10)

    def test_hybrid_quality_arity_and_exact_data_chi2_is_zero(self):
        T = np.linspace(-10.0, 90.0, 25)
        a_T = hybrid_shift(T, 40.0, self.C1_TRUE, self.C2_TRUE, 120.0, 3.0, True)
        result = fit_hybrid_coefficients(T, a_T, TC=40.0, return_quality=True)
        self.assertEqual(len(result), 5)
        self.assertLess(result[4], 1e-8)

    def test_noisy_data_chi2_is_order_of_noise(self):
        # Unit sigma is one decade; 0.1-decade noise gives chi2/nu ~ 0.01.
        *_, chi2 = fit_wlf_coefficients(
            self.T, self.a_T_noisy, self.T_REF, return_quality=True)
        self.assertGreater(chi2, 1e-4)
        self.assertLess(chi2, 1.0)

    def test_dof_not_positive_gives_none(self):
        # 2 points, 3 free params (C1, C2 and the offset) → nu < 0 → undefined.
        *_, chi2 = fit_wlf_coefficients(
            self.T[:2], self.a_T[:2], self.T_REF, return_quality=True)
        self.assertIsNone(chi2)

    def test_both_fixed_scores_supplied_model_against_fitted_offset(self):
        # Only the offset is optimized (n_free=1); C1/C2 are echoed and the
        # supplied curve is still scored.
        C1_fit, C2_fit, _a_T_ref, chi2 = fit_wlf_coefficients(
            self.T, self.a_T_noisy, self.T_REF,
            C1=self.C1_TRUE, C2=self.C2_TRUE, fix_C1=True, fix_C2=True,
            return_quality=True,
        )
        self.assertEqual((C1_fit, C2_fit), (self.C1_TRUE, self.C2_TRUE))
        self.assertIsNotNone(chi2)

    def test_uniform_sigma_scaling_leaves_fit_but_scales_chi2(self):
        # Doubling a uniform sigma cannot move the optimum (it rescales the
        # objective), but must quarter the reported chi2.
        sigma = np.abs(self.a_T_noisy) * 0.1 * np.log(10.0)
        r1 = fit_wlf_coefficients(self.T, self.a_T_noisy, self.T_REF,
                                  sigma_a_T=sigma, return_quality=True)
        r2 = fit_wlf_coefficients(self.T, self.a_T_noisy, self.T_REF,
                                  sigma_a_T=2.0 * sigma, return_quality=True)
        np.testing.assert_allclose(r1[:3], r2[:3], rtol=1e-6)
        self.assertAlmostEqual(r1[3] / r2[3], 4.0, places=6)

    def test_ones_sigma_reproduces_unweighted_fit(self):
        # sigma_log10 == 1 for every point is curve_fit's implicit default.
        unweighted = fit_wlf_coefficients(self.T, self.a_T_noisy, self.T_REF)
        ones = fit_wlf_coefficients(
            self.T, self.a_T_noisy, self.T_REF,
            sigma_a_T=np.abs(self.a_T_noisy) * np.log(10.0))
        np.testing.assert_allclose(unweighted, ones, rtol=0, atol=0)

    def test_nonuniform_sigma_moves_the_fit(self):
        # Point weights must actually reach the optimizer, not just the score.
        sigma = np.abs(self.a_T_noisy) * np.log(10.0)
        lopsided = sigma.copy()
        lopsided[: len(lopsided) // 2] *= 100.0  # nearly ignore the cold half
        even = fit_wlf_coefficients(self.T, self.a_T_noisy, self.T_REF,
                                    sigma_a_T=sigma)
        skewed = fit_wlf_coefficients(self.T, self.a_T_noisy, self.T_REF,
                                      sigma_a_T=lopsided)
        self.assertFalse(np.allclose(even, skewed, rtol=1e-6))

    def test_nonpositive_sigma_raises_value_error(self):
        sigma = np.ones_like(self.a_T)
        sigma[3] = 0.0
        with self.assertRaises(ValueError):
            fit_wlf_coefficients(self.T, self.a_T, self.T_REF,
                                 sigma_a_T=sigma)


if __name__ == '__main__':
    unittest.main()
