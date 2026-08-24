"""
Time–temperature superposition shift factors and the TTS frequency/temperature
conversions: WLF, Arrhenius (`_arr_shift`), the piecewise `hybrid_shift`, the
inverse WLF and inverse hybrid, and the `tts_*` DataFrame transforms that
apply them.

Pure functions — no Flask app, no disk access. Run while iterating on shift
math or the TTS collapse/scatter logic.

    python -m unittest tests.trive.test_shift_factors
"""
import unittest
import os
os.environ['OPENBLAS_NUM_THREADS'] = '1'
import sys
import numpy as np
import pandas as pd

# Append the directory above 'tests' to sys.path to find the 'app' module
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))

from app.trive.shift import (
    wlf_shift,
    _arr_shift,
    hybrid_shift,
    inverse_wlf_shift,
    _inverse_arr_shift,
    inverse_hybrid_shift,
)
from app.trive.tts import (
    tts_temperature_to_frequency_V2,
    tts_frequency_to_temperature,
    tts_frequency_to_temperature_hybrid,
    tts_frequency_to_temperature_V2,
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

    def test_accepts_duplicate_temperatures(self):
        # Real ramps carry repeated temperature rows (the bundled VeroCyan
        # sample has one), so ties must not trip the monotonicity check:
        # duplicates get identical shift factors that agree with the tie-free
        # evaluation.
        T_ties = np.array([10.0, 20.0, 20.0, 30.0, 40.0])
        T_uniq = np.array([10.0, 20.0, 30.0, 40.0])
        a_ties = hybrid_shift(T_ties, self.T_REF, self.C1, self.C2, self.EA)
        a_uniq = hybrid_shift(T_uniq, self.T_REF, self.C1, self.C2, self.EA)
        self.assertEqual(a_ties[1], a_ties[2])
        np.testing.assert_allclose(a_ties[[0, 1, 3, 4]], a_uniq)

    def test_accepts_duplicate_temperatures_descending(self):
        T = np.array([40.0, 30.0, 20.0, 20.0, 10.0])
        result = hybrid_shift(T, self.T_REF, self.C1, self.C2, self.EA)
        reversed_eval = hybrid_shift(
            T[::-1], self.T_REF, self.C1, self.C2, self.EA,
        )
        np.testing.assert_allclose(result, reversed_eval[::-1])

    def test_accepts_all_constant_temperatures(self):
        # An all-tie array satisfies both direction tests; it lands in the
        # ascending branch, where the direction is irrelevant anyway.
        T = np.full(3, self.T_REF + 10.0)
        result = hybrid_shift(T, self.T_REF, self.C1, self.C2, self.EA)
        self.assertEqual(result.shape, T.shape)
        self.assertTrue(np.all(result == result[0]))

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


class TestInverseHybridShift(unittest.TestCase):
    """
    Inverse of the piecewise hybrid model. The branch decision is a threshold
    at a_T == a_T_ref (the hybrid's value at T_ref): at-or-above inverts
    through Arrhenius, below through WLF — exact for physical parameters,
    where both branches are monotone decreasing and meet at (T_ref, a_T_ref).
    """

    T_REF = 25.0
    C1 = 17.44
    C2 = 51.6
    EA = 200.0

    def test_identity_at_a_T_unity(self):
        result = inverse_hybrid_shift(np.array([1.0]), self.T_REF,
                                      self.C1, self.C2, self.EA)
        np.testing.assert_allclose(result, [self.T_REF])

    def test_round_trip_spanning_the_crossover(self):
        # Forward then inverse recovers T on BOTH sides of T_REF, including
        # points close to the kink.
        T = np.array([-20.0, 0.0, 24.0, 25.0, 26.0, 60.0, 120.0])
        a_T = hybrid_shift(T, self.T_REF, self.C1, self.C2, self.EA)
        T_back = inverse_hybrid_shift(a_T, self.T_REF, self.C1, self.C2, self.EA)
        np.testing.assert_allclose(T_back, T, atol=1e-9)

    def test_branches_match_the_dedicated_inverses(self):
        # Cold side (a_T > 1) is pure inverse Arrhenius; hot side (a_T < 1)
        # is pure inverse WLF about the same reference.
        cold = np.array([10.0, 1e3])
        hot = np.array([0.5, 1e-3])
        got_hot = inverse_hybrid_shift(hot, self.T_REF, self.C1, self.C2, self.EA)
        np.testing.assert_allclose(
            got_hot, inverse_wlf_shift(hot, self.T_REF, self.C1, self.C2))
        got_cold = inverse_hybrid_shift(cold, self.T_REF, self.C1, self.C2, self.EA)
        expected_cold = _inverse_arr_shift(cold, self.T_REF, self.EA)
        self.assertTrue(np.all(got_cold <= self.T_REF))
        np.testing.assert_allclose(got_cold, expected_cold)

    def test_a_T_ref_rescales_the_threshold(self):
        # Data referenced off T_REF: forward with a_T_ref K, inverse with the
        # same K, round-trips.
        K = 10.0 ** 1.7
        T = np.array([-10.0, 25.0, 80.0])
        a_T = hybrid_shift(T, self.T_REF, self.C1, self.C2, self.EA, a_T_ref=K)
        T_back = inverse_hybrid_shift(a_T, self.T_REF, self.C1, self.C2,
                                      self.EA, a_T_ref=K)
        np.testing.assert_allclose(T_back, T, atol=1e-9)

    def test_preserves_input_order_without_sorting(self):
        # Unlike hybrid_shift, the input needs no sort order (the branch test
        # is elementwise); output stays aligned with input.
        T = np.array([60.0, -20.0, 25.0, 120.0, 0.0])
        a_T = np.concatenate([
            hybrid_shift(np.sort(T), self.T_REF, self.C1, self.C2, self.EA)
        ])[np.argsort(np.argsort(T))]
        T_back = inverse_hybrid_shift(a_T, self.T_REF, self.C1, self.C2, self.EA)
        np.testing.assert_allclose(T_back, T, atol=1e-9)

    def test_accepts_scalar(self):
        result = inverse_hybrid_shift(1.0, self.T_REF, self.C1, self.C2, self.EA)
        self.assertIsInstance(result, np.ndarray)
        self.assertEqual(result.shape, (1,))

    def test_raises_on_nonpositive_a_T(self):
        for bad in (0.0, -1.0, np.nan):
            with self.assertRaises(ValueError):
                inverse_hybrid_shift(np.array([bad]), self.T_REF,
                                     self.C1, self.C2, self.EA)

    def test_raises_beyond_the_wlf_horizon(self):
        # log10(a_T) <= -C1 is reached by WLF only as T → ∞; past it the raw
        # inverse-WLF formula would return a finite wrong-branch temperature,
        # so the hybrid inverse must refuse instead.
        beyond = np.array([10.0 ** (-self.C1 - 0.5)])
        with self.assertRaises(ValueError) as ctx:
            inverse_hybrid_shift(beyond, self.T_REF, self.C1, self.C2, self.EA)
        self.assertIn('horizon', str(ctx.exception))

    def test_raises_on_unphysical_parameters(self):
        # Negative Ea makes the Arrhenius side increase with T, contradicting
        # the split; the branch-consistency check catches it.
        with self.assertRaises(ValueError):
            inverse_hybrid_shift(np.array([100.0]), self.T_REF,
                                 self.C1, self.C2, -self.EA)


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
        # T_REF stands in for both Tg (WLF reference) and TC (hybrid crossover);
        # the fixture data round-trips for either interpretation.
        kwargs = dict(Tg=self.T_REF, TC=self.T_REF,
                      C1=self.C1, C2=self.C2, Ea=self.EA)
        kwargs.update(overrides)
        return kwargs

    def _plain_df(self, T_values):
        # A minimal df with unit source frequency, so post-shift Frequency == a_T
        # and clamping is driven purely by the WLF shift magnitude.
        T = np.array(T_values, dtype=float)
        n = len(T)
        return pd.DataFrame({
            'Temperature': T,
            'Frequency': np.ones(n),
            "E'": np.full(n, 100.0),
            "E''": np.full(n, 10.0),
        })

    def test_clamps_rows_beyond_valid_shift_window(self):
        # Tg=25, C2=51.6 → WLF singularity at -26.6°C. T=-20°C sits near it and
        # yields |log10 a_T| ≈ 119 ≫ MAX_ABS_LOG10_SHIFT, so that row must be
        # dropped rather than blow the frequency axis out to ~1e120.
        df = self._plain_df([-20.0, 25.0, 40.0])
        result = tts_temperature_to_frequency_V2(df, 'WLF', **self._params())
        self.assertEqual(len(result), 2)  # the T=-20 row is clamped away
        self.assertTrue(np.all(np.isfinite(result['Frequency'].to_numpy())))

    def test_raises_when_all_rows_outside_shift_window(self):
        # Every row near the singularity → nothing survives the window → error.
        df = self._plain_df([-20.0, -22.0])
        with self.assertRaisesRegex(ValueError, 'valid shift-factor window'):
            tts_temperature_to_frequency_V2(df, 'WLF', **self._params())

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
        # shift_model parameters are ignored. With a Temperature column the
        # factors are interpolated onto the data temperatures — an identity here
        # since the grids coincide.
        df = self._input_df([25.0, 30.0, 35.0])
        shiftData = {'Temperature': [25.0, 30.0, 35.0], 'a_T': [0.5, 1.5, 2.0]}
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
        shiftData = {'Temperature': [25.0, 30.0, 35.0], 'a_T': [0.5, 1.5, 2.0]}
        result = tts_temperature_to_frequency_V2(
            df, 'manual', shiftData=shiftData,
        )
        expected = df['Frequency'].values * np.array([0.5, 1.5, 2.0])
        np.testing.assert_allclose(
            np.sort(result['Frequency'].values), np.sort(expected),
        )

    def test_shiftData_interpolates_mismatched_row_count(self):
        # Shift file (5 rows) and data file (3 rows) need not match: a_T is
        # interpolated in log10 space onto the data temperatures.
        df = self._input_df([25.0, 30.0, 35.0])
        shiftData = {
            'Temperature': [20.0, 25.0, 30.0, 35.0, 40.0],
            'a_T': [10.0, 1.0, 0.1, 0.01, 0.001],  # log-linear: -0.2 decades/°C
        }
        result = tts_temperature_to_frequency_V2(df, 'manual', shiftData=shiftData)
        self.assertEqual(len(result), 3)  # one row per data temperature
        # log10(a_T) is linear in T, so interpolation at 25/30/35 → 1.0/0.1/0.01.
        expected = df['Frequency'].values * np.array([1.0, 0.1, 0.01])
        np.testing.assert_allclose(
            np.sort(result['Frequency'].values), np.sort(expected), rtol=1e-6,
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


class TestTtsFrequencyToTemperatureV2(unittest.TestCase):
    """
    The manual + WLF + hybrid frequency→temperature visualization inverse.
    Anything else — incomplete WLF/hybrid parameters, an uninvertible table —
    RAISES so the route's 400 snackbar tells the user their inputs were
    unusable (the old silent universal-WLF fallback is gone).
    """

    OMEGA_REF = 1.0
    # Monotonic shift table: log10(a_T) = [2, 1, 0, -1, -2]; a_T == 1 at T = 30.
    SHIFT_T = [10.0, 20.0, 30.0, 40.0, 50.0]
    SHIFT_A_T = [1e2, 1e1, 1e0, 1e-1, 1e-2]

    def _shift(self, **over):
        d = {'Temperature': list(self.SHIFT_T), 'a_T': list(self.SHIFT_A_T)}
        d.update(over)
        return d

    def _master_df(self, freqs, ep=100.0, epp=10.0):
        freqs = np.asarray(freqs, dtype=float)
        n = len(freqs)
        return pd.DataFrame(
            {'Frequency': freqs, "E'": np.full(n, ep), "E''": np.full(n, epp)}
        )

    # --- manual path ---
    def test_manual_round_trip_against_temp_V2(self):
        # Scatter a temp sweep to a master curve with the forward V2 manual path,
        # then invert with V2 manual → recover the original temperatures.
        temps = [15.0, 25.0, 35.0]
        temp_df = pd.DataFrame(
            {'Temperature': temps, "E'": [1.0, 2.0, 3.0], "E''": [0.1, 0.2, 0.3]}
        )
        scattered = tts_temperature_to_frequency_V2(
            temp_df, 'manual', shiftData=self._shift(),
        )
        recovered = tts_frequency_to_temperature_V2(
            scattered, 'manual', shiftData=self._shift(),
        )
        np.testing.assert_allclose(
            np.sort(recovered['Temperature'].values), sorted(temps), atol=1e-6,
        )

    def test_manual_a_T_unity_maps_to_reference_T(self):
        # Frequency == omega_ref → a_T == 1 → the table's a_T=1 temperature (30).
        df = self._master_df([self.OMEGA_REF])
        result = tts_frequency_to_temperature_V2(df, 'manual', shiftData=self._shift())
        np.testing.assert_allclose(result['Temperature'].values, [30.0])

    def test_manual_differs_from_typed_wlf(self):
        # The shift table actually reaches the mapping — its temperatures are
        # not just a WLF evaluation at the same reference.
        df = self._master_df([0.1, 1.0, 10.0])
        manual = tts_frequency_to_temperature_V2(df, 'manual', shiftData=self._shift())
        wlf = tts_frequency_to_temperature_V2(
            df, 'WLF', Tg=30.0, C1=17.44, C2=51.6,
        )
        self.assertFalse(np.allclose(
            np.sort(manual['Temperature'].values),
            np.sort(wlf['Temperature'].values),
        ))

    def test_mismatched_grid_interpolates(self):
        # 5-row shift table, 3-row master curve → 3 temperatures.
        df = self._master_df([0.1, 1.0, 10.0])
        result = tts_frequency_to_temperature_V2(df, 'manual', shiftData=self._shift())
        self.assertEqual(len(result), 3)

    # --- WLF path ---
    def test_WLF_path_matches_old_function(self):
        df = self._master_df([0.1, 1.0, 10.0])
        Tg, C1, C2 = 30.0, 17.44, 51.6
        got = tts_frequency_to_temperature_V2(df, 'WLF', Tg=Tg, C1=C1, C2=C2)
        exp = tts_frequency_to_temperature(df, self.OMEGA_REF, Tg, C1, C2)
        np.testing.assert_allclose(got['Temperature'].values, exp['Temperature'].values)

    def test_insufficient_WLF_params_raises_naming_the_gap(self):
        df = self._master_df([0.1, 1.0, 10.0])
        with self.assertRaises(ValueError) as ctx:
            tts_frequency_to_temperature_V2(df, 'WLF', Tg=30.0, C1=None, C2=51.6)
        self.assertIn('C1', str(ctx.exception))

    def test_WLF_without_Tg_raises_and_says_enter_it(self):
        # Tg cannot be estimated from a master curve, so the message must
        # steer the user to type it.
        df = self._master_df([0.1, 1.0, 10.0])
        with self.assertRaises(ValueError) as ctx:
            tts_frequency_to_temperature_V2(df, 'WLF', C1=17.44, C2=51.6)
        self.assertIn('Tg', str(ctx.exception))
        self.assertIn('enter it directly', str(ctx.exception))

    # --- hybrid path ---
    def test_hybrid_path_matches_dedicated_function(self):
        df = self._master_df([0.1, 1.0, 10.0])
        TC, C1, C2, Ea = 20.0, 17.44, 51.6, 200.0
        got = tts_frequency_to_temperature_V2(
            df, 'hybrid', TC=TC, C1=C1, C2=C2, Ea=Ea,
        )
        exp = tts_frequency_to_temperature_hybrid(
            df, self.OMEGA_REF, TC, C1, C2, Ea,
        )
        np.testing.assert_allclose(got['Temperature'].values,
                                   exp['Temperature'].values)

    def test_hybrid_round_trip_against_temp_V2(self):
        # Scatter a temp sweep spanning the crossover with the forward hybrid,
        # then invert with the V2 hybrid path → recover the temperatures.
        TC, C1, C2, Ea = 25.0, 17.44, 51.6, 200.0
        temps = [5.0, 25.0, 45.0]
        temp_df = pd.DataFrame(
            {'Temperature': temps, "E'": [1.0, 2.0, 3.0], "E''": [0.1, 0.2, 0.3]}
        )
        scattered = tts_temperature_to_frequency_V2(
            temp_df, 'hybrid', TC=TC, C1=C1, C2=C2, Ea=Ea,
        )
        recovered = tts_frequency_to_temperature_V2(
            scattered, 'hybrid', TC=TC, C1=C1, C2=C2, Ea=Ea,
        )
        np.testing.assert_allclose(
            np.sort(recovered['Temperature'].values), sorted(temps), atol=1e-9,
        )

    def test_insufficient_hybrid_params_raises_naming_the_gap(self):
        df = self._master_df([0.1, 1.0, 10.0])
        with self.assertRaises(ValueError) as ctx:
            tts_frequency_to_temperature_V2(
                df, 'hybrid', TC=20.0, C1=17.44, C2=51.6, Ea=None,
            )
        self.assertIn('Ea', str(ctx.exception))

    def test_hybrid_without_TC_raises_and_says_enter_it(self):
        # Same contract as WLF's Tg: the crossover cannot be estimated from a
        # master curve, so the message must steer the user to type it.
        df = self._master_df([0.1, 1.0, 10.0])
        with self.assertRaises(ValueError) as ctx:
            tts_frequency_to_temperature_V2(
                df, 'hybrid', C1=17.44, C2=51.6, Ea=200.0,
            )
        self.assertIn('Tc', str(ctx.exception))
        self.assertIn('enter it directly', str(ctx.exception))

    # --- error paths (the old silent universal-WLF fallback is gone) ---

    def test_manual_without_shiftData_raises(self):
        # Now mirrors tts_temperature_to_frequency_V2's manual contract.
        df = self._master_df([0.1, 1.0, 10.0])
        with self.assertRaises(ValueError) as ctx:
            tts_frequency_to_temperature_V2(df, 'manual', shiftData=None)
        self.assertIn('no shift-factor file', str(ctx.exception))

    def test_shift_table_without_Temperature_raises(self):
        df = self._master_df([0.1, 1.0, 10.0])
        with self.assertRaises(ValueError) as ctx:
            tts_frequency_to_temperature_V2(
                df, 'manual', shiftData={'a_T': [0.5, 1.0, 2.0]},
            )
        self.assertIn('could not be inverted', str(ctx.exception))

    def test_unusable_table_raises(self):
        df = self._master_df([0.1, 1.0, 10.0])
        # single row, and all-nonpositive a_T: both leave < 2 usable points.
        for bad in ({'Temperature': [30.0], 'a_T': [1.0]},
                    {'Temperature': [10.0, 20.0], 'a_T': [-1.0, -2.0]}):
            with self.assertRaises(ValueError):
                tts_frequency_to_temperature_V2(df, 'manual', shiftData=bad)

    # --- noisy / non-monotonic shift tables ---
    def test_manual_noisy_nonmonotonic_table(self):
        # a_T noise flips the local ordering at one row; ordering the pairs by
        # log10(a_T) keeps np.interp valid, does NOT raise, and stays close to
        # the clean-table result.
        clean = self._shift()
        noisy = self._shift()
        a = np.array(noisy['a_T'], dtype=float)
        a[2] = 10 ** 1.1  # was 10**0, now exceeds its neighbour at T=20 (10**1)
        noisy['a_T'] = a.tolist()
        df = self._master_df([0.05, 0.5, 5.0, 50.0])
        r_clean = tts_frequency_to_temperature_V2(df, 'manual', shiftData=clean)
        r_noisy = tts_frequency_to_temperature_V2(df, 'manual', shiftData=noisy)
        np.testing.assert_allclose(
            np.sort(r_noisy['Temperature'].values),
            np.sort(r_clean['Temperature'].values), atol=5.0,
        )

    def test_manual_flat_table_raises(self):
        # A shift table with no a_T trend (equal ends) is not invertible.
        df = self._master_df([0.1, 1.0, 10.0])
        flat = {'Temperature': [10.0, 20.0, 30.0], 'a_T': [5.0, 5.0, 5.0]}
        with self.assertRaises(ValueError):
            tts_frequency_to_temperature_V2(df, 'manual', shiftData=flat)

    # --- output contract ---
    def test_output_columns(self):
        df = self._master_df([0.1, 1.0, 10.0])
        result = tts_frequency_to_temperature_V2(df, 'manual', shiftData=self._shift())
        self.assertListEqual(list(result.columns), ['Frequency', 'Temperature', "E'", "E''"])

    def test_frequency_column_is_omega_ref(self):
        df = self._master_df([0.1, 1.0, 10.0])
        result = tts_frequency_to_temperature_V2(df, 'manual', shiftData=self._shift())
        np.testing.assert_array_equal(
            result['Frequency'].values, np.full(len(df), self.OMEGA_REF),
        )

    def test_output_sorted_by_temperature(self):
        df = self._master_df([10.0, 0.1, 1.0])  # unsorted frequencies
        result = tts_frequency_to_temperature_V2(df, 'manual', shiftData=self._shift())
        self.assertTrue(np.all(np.diff(result['Temperature'].values) >= 0))

    def test_output_has_reset_index(self):
        df = self._master_df([0.1, 1.0, 10.0])
        result = tts_frequency_to_temperature_V2(df, 'manual', shiftData=self._shift())
        self.assertListEqual(list(result.index), list(range(len(result))))

    def test_does_not_mutate_input(self):
        df = self._master_df([0.1, 1.0, 10.0])
        original_columns = list(df.columns)
        original_freq = df['Frequency'].to_numpy().copy()
        tts_frequency_to_temperature_V2(df, 'manual', shiftData=self._shift())
        self.assertListEqual(list(df.columns), original_columns)
        np.testing.assert_array_equal(df['Frequency'].values, original_freq)


if __name__ == '__main__':
    unittest.main()
