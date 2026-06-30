"""
Shift-coefficient calibration: `fit_wlf_coefficients` (recovers C1/C2) and
`fit_hybrid_coefficients` (recovers C1/C2/Ea and co-fits the a_T_ref offset)
from measured shift-factor data.

Pure functions running the real optimizer on small synthetic data — no Flask
app, no disk. Run when changing the fit math, the pole-avoidance bounds, or the
degenerate-segment guards.

    python -m unittest tests.dynamfit.test_coefficient_fits
"""
import unittest
import os
os.environ['OPENBLAS_NUM_THREADS'] = '1'
import sys
import numpy as np

# Append the directory above 'tests' to sys.path to find the 'app' module
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))

from app.dynamfit.dynamfit2 import (
    wlf_shift,
    _arr_shift,
    hybrid_shift,
    fit_wlf_coefficients,
    fit_hybrid_coefficients,
    UNIVERSAL_WLF_C1,
    UNIVERSAL_WLF_C2,
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


if __name__ == '__main__':
    unittest.main()
