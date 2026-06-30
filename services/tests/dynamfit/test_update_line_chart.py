"""
`update_line_chart` — the orchestration layer that turns uploaded data into the
chart figures + coefficient table. Covers the frequency and temperature
domains, the validation / contract-assertion paths, and the std error-column
wiring into smooth_prony_fit.

Some tests load real fixture files from app/dynamfit/files/ (via upload_init),
so this subset touches disk and is slower than the pure-math suites. It does
NOT spin up a Flask app — that's test_routes / test_routes_e2e.

    python -m unittest tests.dynamfit.test_update_line_chart
"""
import unittest
import os
os.environ['OPENBLAS_NUM_THREADS'] = '1'
import sys
import numpy as np
from unittest.mock import patch

# Append the directory above 'tests' to sys.path to find the 'app' module
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))

from app.dynamfit.dynamfit2 import wlf_shift, update_line_chart
from app.config import Config
from app.utils.util import upload_init


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
