"""
Time–temperature superposition shift factors and the TTS frequency/temperature
conversions: WLF, Arrhenius (`_arr_shift`), the piecewise `hybrid_shift`, the
inverse WLF, and the two `tts_*` DataFrame transforms that apply them.

Pure functions — no Flask app, no disk access. Run while iterating on shift
math or the TTS collapse/scatter logic.

    python -m unittest tests.dynamfit.test_shift_factors
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
    wlf_shift,
    _arr_shift,
    hybrid_shift,
    inverse_wlf_shift,
    tts_temperature_to_frequency_V2,
    tts_frequency_to_temperature,
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


if __name__ == '__main__':
    unittest.main()
