"""
`update_line_chart` — the orchestration layer that turns uploaded data into the
chart figures + coefficient table. Covers the frequency and temperature
domains, the validation / contract-assertion paths, and the std error-column
wiring into smooth_prony_fit.

Some tests load real fixture files from app/trive/files/ (via upload_init),
so this subset touches disk and is slower than the pure-math suites. It does
NOT spin up a Flask app — that's test_routes / test_routes_e2e.

    python -m unittest tests.trive.test_update_line_chart
"""
import unittest
import os
os.environ['OPENBLAS_NUM_THREADS'] = '1'
import sys
import base64
import json
import re
import numpy as np
from unittest.mock import patch

# Append the directory above 'tests' to sys.path to find the 'app' module
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))

from app.trive.prony import compute_complex, prony_basis, prony_terms_for_span
from app.trive.quality import _FitQuality
from app.trive.fit import smooth_prony_fit
from app.trive.shift import wlf_shift, inverse_wlf_shift, inverse_hybrid_shift
from app.trive.tts import MAX_ABS_LOG10_SHIFT
from app.trive.figures import (
    _PLOT_MAX_POINTS, _build_coef_records, _build_complex_figures,
    _build_relaxation_figures,
)
from app.trive.chart import update_line_chart
from app.trive.uncertainty import (
    _SIGMA_DISPLAY_CAP, complex_modulus_sigma, relaxation_sigma,
    sigma_log_coefficients, spectrum_error_bars,
)
import app.trive.reduction as reduction
from app.config import Config
from app.utils.util import upload_init


DATA_DIR = os.path.abspath(os.path.join(
    os.path.dirname(__file__), '..', '..', 'app', 'trive', 'files',
))


class TestUpdateLineChartFrequency(unittest.TestCase):
    """Characterization tests for the frequency-domain branch of update_line_chart."""

    @classmethod
    def setUpClass(cls):
        Config.FILES_DIRECTORY = DATA_DIR
        cls.uploadData = upload_init(
            'agilus30 (8) master curve 20C.txt', 'frequency',
        )
        cls.N = 10
        cls.result = update_line_chart(
            cls.uploadData,
            number_of_prony=cls.N,
            smoothness=0.1,
            fit_settings=True,
            domain='frequency',
        )

    def test_returns_10_tuple(self):
        self.assertEqual(len(self.result), 10)

    def test_coef_df_schema(self):
        coef_df = self.result[6]
        self.assertIsInstance(coef_df, list)
        self.assertGreater(len(coef_df), 0)
        for row in coef_df:
            self.assertLessEqual({'i', 'tau_i', 'E_i'}, set(row))
            self.assertLessEqual(set(row) - {'i', 'tau_i', 'E_i'},
                                 {'E_i_lower', 'E_i_upper'})
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

    def test_fig2_trace_counts_with_fit_settings_true(self):
        # fit_settings=True → fig2 is an overlay fig (line + basis scatter).
        fig2 = self.result[2]
        self.assertEqual(
            sum(1 for t in fig2.data if t.name != '±1σ credible'), 2)
        names2 = {t.name for t in fig2.data}
        self.assertTrue(any('Basis' in n for n in names2))

    def test_fig3_is_discrete_spectrum_dot_plot(self):
        # fig3 is the discrete relaxation spectrum: the Prony coefficients as
        # a marker trace at (tau_i, E_i), plus a horizontal dashed line at the
        # long-term (equilibrium) modulus. No Alfrey-style continuous spectrum.
        fig3 = self.result[3]
        self.assertEqual(len(fig3.data), 2)
        names3 = [t.name for t in fig3.data]
        self.assertFalse(any('Basis' in n for n in names3))
        dots = next(t for t in fig3.data if 'Term Prony' in t.name)
        self.assertEqual(dots.mode, 'markers')
        self.assertEqual(len(dots.x), self.N)
        # Every figure labels the decaying terms only — the equilibrium
        # coefficient is a separate parameter, drawn here as its own trace — so
        # this label matches the one on the E(t) figure exactly.
        curve = next(t for t in self.result[2].data if 'Term Prony' in t.name)
        decaying = int(curve.name.split('-')[0])
        self.assertEqual(dots.name, f'{decaying}-Term Prony')
        hline = next(t for t in fig3.data if t.name == 'Long-Term Modulus')
        self.assertEqual(hline.mode, 'lines')
        self.assertEqual(len(hline.y), 2)
        self.assertEqual(hline.y[0], hline.y[1])
        self.assertGreater(hline.y[0], 0)

    def test_fig11_tan_delta_ticks_sit_on_the_outside_edge(self):
        # tan delta cannot share the modulus panel's scale, so its facet keeps
        # its own tick labels; on the default left side they overlap the plot
        # to their left. fig1's facets DO share a scale, so its second axis
        # draws no labels and needs no such treatment.
        fig1, fig11 = self.result[0], self.result[1]
        self.assertTrue(fig11.layout.yaxis2.showticklabels)
        self.assertEqual(fig11.layout.yaxis2.side, 'right')
        self.assertFalse(fig1.layout.yaxis2.showticklabels)
        # Those labels land in the legend's lane — automargin reserves room for
        # the legend but not for them — so the legend clears its 1.02 default.
        self.assertGreater(fig11.layout.legend.x, 1.02)
        self.assertIsNone(fig1.layout.legend.x)

    def test_fig4_fig41_empty_without_a_transform_request(self):
        # The class fixture asks for no shift model, so the temperature axis —
        # a transform of the upload rather than the upload itself — is not
        # drawn. Previously it was synthesized from universal-WLF constants.
        fig4, fig41 = self.result[4], self.result[5]
        for fig in (fig4, fig41):
            self.assertEqual(len(fig.data), 0)

    def test_fig4_fig41_have_only_experiment_traces(self):
        # In frequency domain, fig4/fig41 visualize the inverse-WLF temperature
        # conversion of the input — no Prony fit is overlaid there.
        result = update_line_chart(
            self.uploadData, number_of_prony=self.N, smoothness=0.1,
            fit_settings=True, domain='frequency',
            shift_model='WLF', Tg=20.0, C1=17.44, C2=51.6,
        )
        fig4, fig41 = result[4], result[5]
        for fig in (fig4, fig41):
            names = {t.name for t in fig.data}
            self.assertEqual(names, {'Experiment'})

    def test_fit_settings_false_drops_fig2_basis_overlay_only(self):
        result = update_line_chart(
            self.uploadData, number_of_prony=self.N, smoothness=0.1,
            fit_settings=False, domain='frequency',
        )
        fig2, fig3 = result[2], result[3]
        self.assertEqual(
            sum(1 for t in fig2.data if t.name != '±1σ credible'), 1)
        self.assertNotIn('Basis', {t.name for t in fig2.data})
        # fig3 is the discrete-spectrum dot plot regardless of fit_settings.
        self.assertEqual(
            [t.name for t in fig3.data],
            [t.name for t in self.result[3].data],
        )


class TestUpdateLineChartFrequencyShift(unittest.TestCase):
    """
    Frequency-domain shift-model paths (manual / WLF / hybrid) that drive the
    temperature-axis visualization (fig4/fig41). Unusable inputs RAISE out of
    tts_frequency_to_temperature_V2 (no silent universal-WLF fallback), so a
    requested-but-broken transform blocks the response like any other input
    error; only an unrequested transform leaves the fit standing alone.
    """

    @classmethod
    def setUpClass(cls):
        Config.FILES_DIRECTORY = DATA_DIR
        cls.uploadData = upload_init(
            'agilus30 (8) master curve 20C.txt', 'frequency',
        )
        # Monotonic synthetic shift table; a_T decreasing through 1.0 at T = 30.
        T = np.linspace(-20.0, 80.0, 21)
        cls.shiftData = {'Temperature': T, 'a_T': 10.0 ** np.linspace(6.0, -6.0, len(T))}

    def _run(self, **kw):
        return update_line_chart(
            self.uploadData, number_of_prony=8, smoothness=0.1,
            fit_settings=True, domain='frequency', **kw,
        )

    @staticmethod
    def _fig4_temps(result):
        # fig4 is px.line(x="Temperature", facet_col='Modulus'); both facets carry
        # the same temperature axis, so dedupe to the underlying sorted set.
        fig4 = result[4]
        return np.unique(np.concatenate([np.asarray(t.x, float) for t in fig4.data]))

    def test_frequency_manual_uses_shiftData(self):
        manual = self._run(shift_model='manual', shiftData=self.shiftData)
        wlf = self._run(shift_model='WLF', Tg=30.0, C1=17.44, C2=51.6)
        self.assertEqual(len(manual), 10)
        # The manual mapping reached fig4: its temperature axis differs from a
        # WLF evaluation (a different shape alone already proves it, since
        # np.interp clamps).
        mt, dt = self._fig4_temps(manual), self._fig4_temps(wlf)
        self.assertFalse(mt.shape == dt.shape and np.allclose(mt, dt))

    def test_frequency_WLF_populates_temp_figs(self):
        Tg, C1, C2 = 20.0, 17.44, 51.6
        result = self._run(shift_model='WLF', Tg=Tg, C1=C1, C2=C2)
        omega = self.uploadData['Frequency']
        expected = np.unique(inverse_wlf_shift(omega / 1.0, Tg, C1, C2))
        np.testing.assert_allclose(self._fig4_temps(result), expected, rtol=1e-6)

    def test_frequency_hybrid_populates_temp_figs(self):
        TC, C1, C2, Ea = 20.0, 17.44, 51.6, 200.0
        result = self._run(shift_model='hybrid', TC=TC, C1=C1, C2=C2, Ea=Ea)
        omega = self.uploadData['Frequency']
        expected = np.unique(inverse_hybrid_shift(omega / 1.0, TC, C1, C2, Ea))
        np.testing.assert_allclose(self._fig4_temps(result), expected, rtol=1e-6)

    def test_frequency_hybrid_missing_Ea_raises(self):
        with self.assertRaises(ValueError) as ctx:
            self._run(shift_model='hybrid', TC=20.0, C1=17.44, C2=51.6)
        self.assertIn('Ea', str(ctx.exception))

    def test_frequency_manual_without_shiftData_raises(self):
        # Same contract as the temperature branch's forward transform: manual
        # without a file is a user error, not a silent degradation.
        with self.assertRaises(ValueError) as ctx:
            self._run(shift_model='manual', shiftData=None)
        self.assertIn('no shift-factor file', str(ctx.exception))

    def test_frequency_WLF_missing_Tg_raises(self):
        with self.assertRaises(ValueError) as ctx:
            self._run(shift_model='WLF', C1=17.44, C2=51.6)
        self.assertIn('Tg', str(ctx.exception))

    def test_frequency_temp_view_carries_provenance_caption(self):
        # The "labeled" half of the contract: the synthesized temperature axis
        # names the inverse that produced it.
        wlf = self._run(shift_model='WLF', Tg=30.0, C1=17.44, C2=51.6)
        hybrid = self._run(shift_model='hybrid', TC=20.0, C1=17.44, C2=51.6,
                           Ea=200.0)
        manual = self._run(shift_model='manual', shiftData=self.shiftData)
        for result, needle in ((wlf, 'inverse WLF at Tg = 30'),
                               (hybrid, 'inverse hybrid at Tc = 20'),
                               (manual, 'uploaded shift factors')):
            for fig in (result[4], result[5]):
                texts = [a.text for a in fig.layout.annotations if a.text]
                self.assertTrue(any(needle in t for t in texts),
                                f'missing "{needle}" in {texts}')

    def test_frequency_none_suppresses_temp_figs_but_not_the_fit(self):
        # 'none' means the caller did not ask for a transform, so the
        # temperature axis is not drawn — but the Prony fit runs on the
        # frequency data directly and is unaffected.
        result = self._run(shift_model='none')
        self.assertEqual(len(result[4].data), 0)
        self.assertEqual(len(result[5].data), 0)
        self.assertGreater(len(result[0].data), 0)  # fig1 still built
        self.assertGreater(len(result[6]), 0)       # coef_df non-empty

    def test_frequency_unspecified_shift_model_matches_none(self):
        # The Python default (None) and the wire value ('none') mean the same
        # thing: nothing was requested.
        omitted, explicit = self._run(), self._run(shift_model='none')
        for fig_idx in (4, 5):
            self.assertEqual(len(omitted[fig_idx].data), 0)
            self.assertEqual(len(explicit[fig_idx].data), 0)

    def test_frequency_none_with_shiftData_still_builds_temp_figs(self):
        # A shift table is itself a request for a transform, so it wins over
        # a 'none' model rather than being silently discarded.
        result = self._run(shift_model='none', shiftData=self.shiftData)
        self.assertGreater(len(result[4].data), 0)
        self.assertGreater(len(result[5].data), 0)

    def test_prony_fit_unaffected_by_shift_params(self):
        def exp_y(result):
            fig1 = result[0]
            return sorted(
                (tuple(t.y) for t in fig1.data if t.name == 'Experiment'),
                key=lambda ys: ys[0],
            )
        with_shift = self._run(shift_model='manual', shiftData=self.shiftData)
        without = self._run()
        for got, want in zip(exp_y(with_shift), exp_y(without)):
            np.testing.assert_array_equal(got, want)


class TestUpdateLineChartShiftFigure(unittest.TestCase):
    """
    The shift-factor figure and table (elements 7 and 8 of the return):
    measured markers, model curve, pole masking, the chi2 stamp, and the
    empty-figure conventions.
    """

    T_REF = 25.0
    C1 = 17.44
    C2 = 51.6

    @classmethod
    def setUpClass(cls):
        Config.FILES_DIRECTORY = DATA_DIR
        T = np.linspace(0.0, 80.0, 30)
        cls.temp_data = {
            'Temperature': T,
            'E Storage': np.linspace(1000.0, 10.0, len(T)),
            'E Loss': np.full(len(T), 50.0),
        }
        Ts = np.linspace(0.0, 80.0, 9)
        cls.shiftData = {
            'Temperature': Ts,
            'a_T': 10.0 ** np.linspace(3.0, -3.0, len(Ts)),
        }

    def _run(self, **kw):
        return update_line_chart(
            self.temp_data, number_of_prony=8, smoothness=0.1,
            fit_settings=True, domain='temperature', **kw,
        )

    @staticmethod
    def _trace(fig, name):
        matches = [t for t in fig.data if t.name == name]
        assert len(matches) == 1, [t.name for t in fig.data]
        return matches[0]

    def test_no_transform_yields_empty_figure_and_table(self):
        # Temperature early-exit (no shift params) — nothing to draw.
        *_, shift_fig, shift_records, _ = self._run()
        self.assertEqual(len(shift_fig.data), 0)
        self.assertEqual(shift_records, [])

    def test_frequency_none_yields_empty_figure_and_table(self):
        freq_data = upload_init(
            'agilus30 (8) master curve 20C.txt', 'frequency')
        *_, shift_fig, shift_records, _ = update_line_chart(
            freq_data, number_of_prony=8, smoothness=0.1,
            fit_settings=True, domain='frequency', shift_model='none',
        )
        self.assertEqual(len(shift_fig.data), 0)
        self.assertEqual(shift_records, [])

    def test_manual_draws_markers_only(self):
        # 'manual' has no model curve of its own — Experiment markers only.
        *_, shift_fig, shift_records, _ = self._run(
            shift_model='manual', shiftData=self.shiftData)
        self.assertEqual([t.name for t in shift_fig.data], ['Experiment'])
        self.assertEqual(self._trace(shift_fig, 'Experiment').mode, 'markers')
        # Table rows carry the measured values; no model column values.
        self.assertEqual(len(shift_records), len(self.shiftData['a_T']))
        self.assertTrue(all(r['a_T (model)'] is None for r in shift_records))
        self.assertEqual(shift_records[0]['a_T (measured)'],
                         float(self.shiftData['a_T'][0]))

    def test_wlf_with_shift_file_draws_markers_and_dashed_curve(self):
        *_, shift_fig, shift_records, _ = self._run(
            shift_model='WLF', Tg=self.T_REF, C1=self.C1, C2=self.C2,
            shiftData=self.shiftData)
        self.assertEqual({t.name for t in shift_fig.data},
                         {'Experiment', 'WLF fit'})
        curve = self._trace(shift_fig, 'WLF fit')
        self.assertEqual(curve.line.dash, 'dash')
        self.assertEqual(self._trace(shift_fig, 'Experiment').mode, 'markers')
        # Model column now populated at the measured temperatures, and it
        # matches the WLF equation there — except where the model leaves the
        # |log10 a_T| <= MAX_ABS_LOG10_SHIFT window (the coldest points here),
        # which are masked to None exactly as the transform drops those rows.
        expected = wlf_shift(np.asarray(self.shiftData['Temperature']),
                             self.T_REF, self.C1, self.C2)
        in_window = np.abs(np.log10(expected)) <= MAX_ABS_LOG10_SHIFT
        self.assertTrue(in_window.any() and not in_window.all())
        got = [r['a_T (model)'] for r in shift_records]
        for g, e, ok in zip(got, expected, in_window):
            if ok:
                self.assertAlmostEqual(g / e, 1.0, places=6)
            else:
                self.assertIsNone(g)

    def test_model_only_wlf_draws_curve_over_data_range(self):
        *_, shift_fig, shift_records, _ = self._run(
            shift_model='WLF', Tg=self.T_REF, C1=self.C1, C2=self.C2)
        self.assertEqual([t.name for t in shift_fig.data], ['WLF fit'])
        curve = self._trace(shift_fig, 'WLF fit')
        # The grid spans the data's temperature range, minus the cold points
        # the |log10 a_T| window masks off; the warm end is inside the window.
        self.assertGreaterEqual(min(curve.x), 0.0)
        self.assertLess(min(curve.x), 5.0)
        self.assertAlmostEqual(max(curve.x), 80.0)
        y = np.asarray(curve.y, dtype=float)
        self.assertTrue(np.all(np.abs(np.log10(y)) <= MAX_ABS_LOG10_SHIFT))
        # Model-only table is the thinned grid.
        self.assertLessEqual(len(shift_records), 50)
        self.assertTrue(all(set(r) == {'Temperature', 'a_T (model)'}
                            for r in shift_records))

    def test_wlf_curve_honors_a_T_ref_offset(self):
        # The WLF curve carries the same co-fitted offset the hybrid one does;
        # without it a fit against a table referenced away from Tg draws a
        # curve parallel to — and decades off — its own Experiment markers.
        kwargs = dict(shift_model='WLF', Tg=self.T_REF, C1=self.C1, C2=self.C2)
        *_, fig_unit, _, _ = self._run(**kwargs)
        *_, fig_shifted, _, _ = self._run(a_T_ref=100.0, **kwargs)
        unit = self._trace(fig_unit, 'WLF fit')
        shifted = self._trace(fig_shifted, 'WLF fit')
        # Compare at shared temperatures, not by position: the offset moves
        # which grid points clear the |log10 a_T| window, so the two traces
        # are drawn over different (overlapping) spans of the same grid.
        common, i_unit, i_shift = np.intersect1d(
            np.array(unit.x), np.array(shifted.x), return_indices=True)
        self.assertGreater(len(common), 0)
        np.testing.assert_allclose(
            np.array(shifted.y)[i_shift] / np.array(unit.y)[i_unit],
            100.0, rtol=1e-9)

    def test_hybrid_curve_honors_a_T_ref_offset(self):
        kwargs = dict(shift_model='hybrid', TC=40.0, C1=self.C1, C2=self.C2,
                      Ea=150.0)
        *_, fig_unit, _, _ = self._run(**kwargs)
        *_, fig_shifted, _, _ = self._run(a_T_ref=100.0, **kwargs)
        y_unit = np.array(self._trace(fig_unit, 'hybrid fit').y)
        y_shifted = np.array(self._trace(fig_shifted, 'hybrid fit').y)
        # Same grid, curve multiplied by the offset (where both are drawn).
        n = min(len(y_unit), len(y_shifted))
        np.testing.assert_allclose(y_shifted[:n] / y_unit[:n], 100.0,
                                   rtol=1e-9)

    def test_shift_reference_draws_markers_without_driving_transform(self):
        # A display-only reference file: Experiment markers appear alongside
        # the model curve, but the transform must still come from the model —
        # unlike shiftData, whose table would override it.
        kwargs = dict(shift_model='WLF', Tg=self.T_REF, C1=self.C1, C2=self.C2)
        with_ref = self._run(shift_reference=self.shiftData, **kwargs)
        without = self._run(**kwargs)
        fig_ref = with_ref[7]
        self.assertEqual({t.name for t in fig_ref.data},
                         {'Experiment', 'WLF fit'})
        # Identical master curves prove the reference never reached the
        # transform (the interpolated table would shift the frequencies).
        def experiment_x(fig):
            return next(t.x for t in fig.data
                        if t.name == 'Experiment' and t.xaxis == 'x')
        np.testing.assert_array_equal(
            experiment_x(with_ref[0]), experiment_x(without[0]))

    def test_shiftdata_wins_over_shift_reference_for_markers(self):
        # When both are present the applied table is the honest marker source.
        ref = {'Temperature': np.array([10.0, 20.0]),
               'a_T': np.array([123.0, 1.0])}
        *_, shift_fig, shift_records, _ = self._run(
            shift_model='manual', shiftData=self.shiftData,
            shift_reference=ref)
        self.assertEqual(len(shift_records), len(self.shiftData['a_T']))

    def test_wlf_pole_in_range_is_masked_not_raised(self):
        # Fixed C2 puts the pole at Tg - C2 = 15, inside the 0-80 data range.
        # The transform itself would raise; the figure must instead draw the
        # valid window and skip the rest — so use a shift file to carry the
        # transform and hand the curve bad parameters.
        *_, shift_fig, _, _ = self._run(
            shift_model='WLF', Tg=self.T_REF, C1=self.C1, C2=10.0,
            shiftData=self.shiftData)
        curve = self._trace(shift_fig, 'WLF fit')
        y = np.asarray(curve.y, dtype=float)
        self.assertTrue(np.all(np.isfinite(y)))
        self.assertTrue(np.all(np.abs(np.log10(y)) <= MAX_ABS_LOG10_SHIFT))

    def test_chi2_stamp_present_iff_passed(self):
        kwargs = dict(shift_model='WLF', Tg=self.T_REF, C1=self.C1,
                      C2=self.C2, shiftData=self.shiftData)

        def notices(fig):
            return [a.text for a in (fig.layout.annotations or ())
                    if getattr(a, 'name', '') == 'figure-notice']

        *_, without, _, _ = self._run(**kwargs)
        self.assertEqual(notices(without), [])
        *_, with_stamp, _, _ = self._run(shift_chi2_reduced=0.123, **kwargs)
        self.assertEqual(notices(with_stamp),
                         ['misfit (χ²/ν) = 0.123 | lower is better'])

    def test_figure_and_table_survive_json_round_trip(self):
        import json as _json
        *_, shift_fig, shift_records, _ = self._run(
            shift_model='WLF', Tg=self.T_REF, C1=self.C1, C2=self.C2,
            shiftData=self.shiftData, shift_chi2_reduced=0.5)
        blob = _json.dumps({'shift-chart': _json.loads(shift_fig.to_json()),
                            'shift-table': shift_records})
        self.assertIn('"shift-table"', blob)


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
        (fig1, fig11, fig2, fig3, fig4, fig41, coef_df,
         shift_fig, shift_records, _) = update_line_chart(
            self.real_temp_data, number_of_prony=10, smoothness=0.1,
            fit_settings=True, domain='temperature',
        )
        for empty in (fig1, fig11, fig2, fig3):
            self.assertEqual(len(empty.data), 0)
        self.assertEqual(coef_df, [])
        self.assertGreater(len(fig4.data), 0)
        self.assertGreater(len(fig41.data), 0)
        # Same unshared-tan-delta axis as the frequency figure: outside edge,
        # with the legend moved off it.
        self.assertTrue(fig41.layout.yaxis2.showticklabels)
        self.assertEqual(fig41.layout.yaxis2.side, 'right')
        self.assertGreater(fig41.layout.legend.x, 1.02)
        self.assertFalse(fig4.layout.yaxis2.showticklabels)
        self.assertIsNone(fig4.layout.legend.x)

    def test_WLF_shift_populates_all_figures(self):
        result = update_line_chart(
            self.synthetic_temp_data, number_of_prony=8, smoothness=0.1,
            fit_settings=True, domain='temperature',
            Tg=self.T_REF, C1=self.C1, C2=self.C2, shift_model='WLF',
        )
        fig1, fig11, fig2, fig3, fig4, fig41, coef_df, _, _, _ = result
        for fig in (fig1, fig11, fig2, fig3, fig4, fig41):
            self.assertGreater(len(fig.data), 0)
        self.assertIsInstance(coef_df, list)
        self.assertGreater(len(coef_df), 0)

    def test_hybrid_shift_populates_all_figures(self):
        result = update_line_chart(
            self.synthetic_temp_data, number_of_prony=8, smoothness=0.1,
            fit_settings=True, domain='temperature',
            Tg=self.T_REF, TC=self.T_REF, C1=self.C1, C2=self.C2,
            Ea=self.EA, shift_model='hybrid',
        )
        fig1, fig11, fig2, fig3, fig4, fig41, coef_df, _, _, _ = result
        for fig in (fig1, fig11, fig2, fig3, fig4, fig41):
            self.assertGreater(len(fig.data), 0)
        self.assertGreater(len(coef_df), 0)

    def test_hybrid_tolerates_duplicate_temperature_rows(self):
        # upload_init keeps duplicate-temperature rows (the bundled VeroCyan
        # ramp contains one), and hybrid_shift used to reject the tie with an
        # AssertionError that escaped the route as a 500 instead of the usual
        # 400-with-message.
        data = {
            k: np.append(np.asarray(v), np.asarray(v)[-1])
            for k, v in self.synthetic_temp_data.items()
        }
        result = update_line_chart(
            data, number_of_prony=8, smoothness=0.1,
            fit_settings=True, domain='temperature',
            TC=self.T_REF, C1=self.C1, C2=self.C2,
            Ea=self.EA, shift_model='hybrid',
        )
        fig1, fig11, fig2, fig3, fig4, fig41, coef_df, _, _, _ = result
        for fig in (fig1, fig11, fig2, fig3, fig4, fig41):
            self.assertGreater(len(fig.data), 0)
        self.assertGreater(len(coef_df), 0)

    def test_hybrid_works_without_Tg(self):
        # hybrid_shift uses TC (not Tg) as the WLF/Arrhenius crossover, so
        # update_line_chart should drive the master-curve path even when Tg is
        # not supplied.
        result = update_line_chart(
            self.synthetic_temp_data, number_of_prony=8, smoothness=0.1,
            fit_settings=True, domain='temperature',
            TC=self.T_REF, C1=self.C1, C2=self.C2, Ea=self.EA,
            shift_model='hybrid',
        )
        fig1, fig11, fig2, fig3, fig4, fig41, coef_df, _, _, _ = result
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
        fig1, fig11, fig2, fig3, fig4, fig41, coef_df, _, _, _ = result
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
        fig1, fig11, fig2, fig3, fig4, fig41, coef_df, _, _, _ = result
        for fig in (fig1, fig11, fig2, fig3, fig4, fig41):
            self.assertGreater(len(fig.data), 0)
        self.assertGreater(len(coef_df), 0)


class TestUpdateLineChartTermLabels(unittest.TestCase):
    """
    Every "N-Term Prony" label counts decaying terms only. The equilibrium
    coefficient is a separate parameter — no tau_i, exempt from the smoothness
    penalty, split into its own trace on fig3, dropped from the coefficient
    table — so it must not appear in any term count.
    """

    @staticmethod
    def _upload():
        # Nine-mode source, densely sampled: NNLS has real structure to select
        # from, so the unsmoothed path lands well short of the grid size.
        tau = np.logspace(-4.0, 4.0, 9)
        E_input = np.concatenate(
            ([1e6], np.exp(-(np.log10(tau)) ** 2 / 4.0) * 1e9))
        df = compute_complex(tau, E_input, num_pts=200)
        return {
            'Frequency': df['Frequency'].to_numpy(),
            'E Storage': df['E Storage'].to_numpy(),
            'E Loss': df['E Loss'].to_numpy(),
        }

    @staticmethod
    def _label_counts(figs):
        return {int(t.name.split('-')[0])
                for fig in figs for t in fig.data if 'Term Prony' in t.name}

    def _run(self, N, smoothness):
        return update_line_chart(
            self._upload(), number_of_prony=N, smoothness=smoothness,
            fit_settings=True, domain='frequency',
        )

    def test_smoothed_labels_match_the_coefficient_table(self):
        # Regression: on this path every coefficient is exp(...) and so never
        # exactly zero, which made the old count_nonzero over the whole vector
        # report the grid size plus the equilibrium term — 24 terms for a
        # 23-point grid whose table listed 23 rows.
        fig1, fig11, fig2, fig3, _, _, coef_df, _, _, _ = self._run(23, 0.04)
        self.assertEqual(len(coef_df), 23)
        self.assertEqual(self._label_counts((fig1, fig11, fig2, fig3)), {23})

    def test_unsmoothed_labels_match_the_coefficient_table(self):
        # NNLS zeroes coefficients outright, so here the count is genuinely
        # below the grid size — and still must not pick up the equilibrium term.
        fig1, fig11, fig2, fig3, _, _, coef_df, _, _, _ = self._run(23, 0.0)
        self.assertLess(len(coef_df), 23)
        self.assertEqual(self._label_counts((fig1, fig11, fig2, fig3)),
                         {len(coef_df)})

    def test_basis_overlay_label_matches_too(self):
        # fig2's basis scatter is drawn over tau_i, which has no equilibrium
        # entry either.
        fig2 = self._run(23, 0.04)[2]
        basis = [t.name for t in fig2.data if 'Term Basis' in t.name]
        self.assertEqual(basis, ['23-Term Basis'])


class TestUpdateLineChartCredibleBands(unittest.TestCase):
    """
    A smoothed fit draws +-1 sigma credible ribbons under its curves and
    error bars on its spectrum; without a covariance (unsmoothed, or a
    Hessian that is not positive definite) the figures are unchanged.
    """

    BAND = '±1σ credible'
    FILE = 'agilus30 (8) master curve 20C.txt'
    N = 20

    @classmethod
    def _run(cls, smoothness, fit_settings=True):
        """update_line_chart on the bundled file, plus the fit it used."""
        fits = []

        def record(*args, **kwargs):
            out = smooth_prony_fit(*args, **kwargs)
            fits.append(out)
            return out

        with patch('app.trive.chart.smooth_prony_fit', side_effect=record):
            result = update_line_chart(
                cls.uploadData, number_of_prony=cls.N,
                smoothness=smoothness, fit_settings=fit_settings,
                domain='frequency',
            )
        tau_i, E_i, quality = fits[-1]
        return result, (tau_i, E_i, quality.covariance)

    @classmethod
    def setUpClass(cls):
        Config.FILES_DIRECTORY = DATA_DIR
        cls.uploadData = upload_init(cls.FILE, 'frequency')
        cls.result, cls.fit = cls._run(0.3)
        cls.result_no_basis, cls.fit_no_basis = cls._run(0.3, False)
        # Weak smoothing: some log-sigmas exceed the display cap here.
        cls.weak, cls.weak_fit = cls._run(0.004)
        cls.unsmoothed, _ = cls._run(0.0)
        with patch('app.trive.quality._cholesky_or_none', return_value=None):
            cls.no_cov, cls.no_cov_fit = cls._run(0.3)

    # --- helpers ---------------------------------------------------------

    @classmethod
    def _bands(cls, fig):
        return [t for t in fig.data if t.name == cls.BAND]

    @staticmethod
    def _prony(fig, xaxis=None):
        return next(t for t in fig.data if 'Term Prony' in (t.name or '')
                    and (xaxis is None or t.xaxis == xaxis))

    @staticmethod
    def _rgb(color):
        if color.startswith('#'):
            return tuple(int(color[i:i + 2], 16) for i in (1, 3, 5))
        return tuple(int(float(v)) for v in re.findall(r'[\d.]+', color)[:3])

    @staticmethod
    def _expected_edges(y, sigma, log_panel):
        y = np.asarray(y, dtype=float)
        sigma_c = np.minimum(sigma, y * np.expm1(_SIGMA_DISPLAY_CAP))
        upper = y + sigma_c
        lower = y ** 2 / (y + sigma_c) if log_panel \
            else np.maximum(y - sigma, 0.0)
        return lower, upper

    def _pairs(self, fig):
        """The ribbon pairs, checked to lead fig.data as (lower, upper);
        only the wider prediction ribbons may be drawn before them."""
        bands = self._bands(fig)
        self.assertGreater(len(bands), 0, 'no credible ribbon drawn')
        self.assertEqual(len(bands) % 2, 0)
        rest = [t for t in fig.data if t.name != '±1σ prediction']
        self.assertEqual(rest[:len(bands)], bands,
                         'ribbons must precede every other trace')
        return [tuple(bands[k:k + 2]) for k in range(0, len(bands), 2)]

    def _check_edge_style(self, fig):
        bands = self._bands(fig)
        for t in bands:
            self.assertEqual(t.mode, 'lines')
            self.assertEqual(t.line.width, 0)
            self.assertEqual(t.hoverinfo, 'skip')
            self.assertEqual(t.legendgroup, self.BAND)
        shown = [t.showlegend for t in bands]
        self.assertEqual(shown.count(True), 1)
        self.assertEqual(shown.count(False), len(bands) - 1)
        prony = self._prony(fig)
        for lower, upper in self._pairs(fig):
            self.assertNotEqual(lower.fill, 'tonexty')
            self.assertEqual(upper.fill, 'tonexty')
            self.assertTrue(upper.fillcolor.startswith('rgba('))
            alpha = float(re.findall(r'[\d.]+', upper.fillcolor)[3])
            self.assertEqual(self._rgb(upper.fillcolor),
                             self._rgb(prony.line.color))
            self.assertAlmostEqual(alpha, 0.25)

    def _check_complex_ribbons(self, fig, col2_key, col2_log, fit):
        tau_i, E_i, cov = fit
        pairs = self._pairs(fig)
        self.assertEqual(len(pairs), 2)
        self.assertEqual(
            sorted((lo.xaxis, lo.yaxis, hi.xaxis, hi.yaxis)
                   for lo, hi in pairs),
            [('x', 'y', 'x', 'y'), ('x2', 'y2', 'x2', 'y2')])
        for lower, upper in pairs:
            col2 = lower.xaxis == 'x2'
            key = col2_key if col2 else 'E Storage'
            log_panel = col2_log if col2 else True
            curve = self._prony(fig, lower.xaxis)
            x = np.asarray(curve.x, dtype=float)
            sigma = complex_modulus_sigma(x, tau_i, E_i, cov)[key]
            want_lo, want_hi = self._expected_edges(curve.y, sigma, log_panel)
            for edge in (lower, upper):
                np.testing.assert_array_equal(edge.x, curve.x)
            np.testing.assert_allclose(lower.y, want_lo, rtol=1e-9)
            np.testing.assert_allclose(upper.y, want_hi, rtol=1e-9)

    def _check_relaxation_ribbon(self, fig, fit):
        tau_i, E_i, cov = fit
        pairs = self._pairs(fig)
        self.assertEqual(len(pairs), 1)
        lower, upper = pairs[0]
        curve = self._prony(fig)
        x = np.asarray(curve.x, dtype=float)
        sigma = relaxation_sigma(x, tau_i, E_i, cov)
        want_lo, want_hi = self._expected_edges(curve.y, sigma, True)
        for edge in (lower, upper):
            np.testing.assert_array_equal(edge.x, curve.x)
        np.testing.assert_allclose(lower.y, want_lo, rtol=1e-9)
        np.testing.assert_allclose(upper.y, want_hi, rtol=1e-9)

    def _spectrum_dots(self, fig):
        return next(t for t in fig.data if 'Term Prony' in (t.name or '')
                    and t.mode == 'markers')

    # --- (1) complex-modulus and tan-delta ribbons -----------------------

    def test_complex_figure_has_a_credible_ribbon_in_each_facet(self):
        self.assertIsNotNone(self.fit[2])
        self._check_complex_ribbons(self.result[0], 'E Loss', True, self.fit)

    def test_tan_delta_figure_has_a_credible_ribbon_in_each_facet(self):
        self._check_complex_ribbons(
            self.result[1], 'tan delta', False, self.fit)

    def test_ribbon_edges_are_styled_as_one_legend_entry(self):
        for fig in self.result[:3]:
            self._check_edge_style(fig)

    def test_log_panel_lower_edges_stay_positive(self):
        for result in (self.result, self.weak):
            for fig in (result[0], result[2]):
                for lower, _ in self._pairs(fig):
                    y = np.asarray(lower.y, dtype=float)
                    self.assertTrue(np.isfinite(y).all())
                    self.assertTrue((y > 0).all())

    # --- (2) relaxation-modulus ribbon -----------------------------------

    def test_relaxation_figure_has_a_credible_ribbon(self):
        self._check_relaxation_ribbon(self.result[2], self.fit)

    def test_relaxation_ribbon_without_the_basis_overlay(self):
        fig2 = self.result_no_basis[2]
        self._check_relaxation_ribbon(fig2, self.fit_no_basis)
        self._check_edge_style(fig2)

    # --- (3) spectrum error bars -----------------------------------------

    def test_spectrum_dots_carry_asymmetric_error_bars(self):
        tau_i, E_i, cov = self.fit
        n = len(tau_i)
        dots = self._spectrum_dots(self.result[3])
        self.assertIsNotNone(dots.error_y.array)
        self.assertIsNotNone(dots.error_y.arrayminus)
        plus = np.asarray(dots.error_y.array, dtype=float)
        minus = np.asarray(dots.error_y.arrayminus, dtype=float)
        want_plus, want_minus = spectrum_error_bars(
            E_i[-n:], sigma_log_coefficients(cov)[-n:])
        np.testing.assert_allclose(plus, want_plus, rtol=1e-9)
        np.testing.assert_allclose(minus, want_minus, rtol=1e-9)
        for bar in (plus, minus):
            self.assertTrue(np.isfinite(bar).all())
            self.assertTrue((bar >= 0).all())
        self.assertTrue((minus < np.asarray(dots.y, dtype=float)).all())
        self.assertFalse(np.allclose(plus, minus))

    def test_long_term_modulus_line_has_no_error_bars(self):
        hline = next(t for t in self.result[3].data
                     if t.name == 'Long-Term Modulus')
        self.assertIsNone(hline.error_y.array)
        self.assertIsNone(hline.error_y.arrayminus)

    def test_error_bars_add_no_spectrum_traces(self):
        self.assertEqual(len(self.result[3].data), len(self.no_cov[3].data))

    # --- (4) no covariance, no display -----------------------------------

    def _check_display_absent(self, result):
        fig1, fig11, fig2, fig3 = result[:4]
        for fig in (fig1, fig11, fig2, fig3):
            self.assertEqual(self._bands(fig), [])
        self.assertEqual(len(fig1.data), 4)
        self.assertEqual(len(fig11.data), 4)
        self.assertEqual(len(fig2.data), 2)
        self.assertEqual(len(fig3.data), 2)
        self.assertIsNone(self._spectrum_dots(fig3).error_y.array)
        self.assertIsNone(self._spectrum_dots(fig3).error_y.arrayminus)

    def test_unsmoothed_fit_draws_no_uncertainty(self):
        self._check_display_absent(self.unsmoothed)

    def test_missing_covariance_draws_no_uncertainty(self):
        self.assertIsNone(self.no_cov_fit[2])
        self._check_display_absent(self.no_cov)

    def test_table_without_covariance_keeps_three_keys(self):
        for result in (self.unsmoothed, self.no_cov):
            self.assertGreater(len(result[6]), 0)
            for row in result[6]:
                self.assertSetEqual(set(row), {'i', 'tau_i', 'E_i'})

    def test_table_bounds_match_the_spectrum_error_bars(self):
        # Row 'i' is the pre-filter term index, one dot per tau_i in fig3.
        for result in (self.result, self.weak):
            dots = self._spectrum_dots(result[3])
            plus = np.asarray(dots.error_y.array, dtype=float)
            minus = np.asarray(dots.error_y.arrayminus, dtype=float)
            self.assertGreater(len(result[6]), 0)
            for row in result[6]:
                self.assertSetEqual(
                    set(row), {'i', 'tau_i', 'E_i', 'E_i_lower', 'E_i_upper'})
                lower, upper = row['E_i_lower'], row['E_i_upper']
                E = row['E_i']
                self.assertTrue(np.isfinite([lower, upper]).all())
                self.assertGreater(lower, 0.0)
                self.assertLessEqual(lower, E)
                self.assertLessEqual(E, upper)
                np.testing.assert_allclose(upper - E, plus[row['i']],
                                           rtol=1e-9)
                np.testing.assert_allclose(E - lower, minus[row['i']],
                                           rtol=1e-9)

    # --- (5) serialization -----------------------------------------------

    def _assert_wire_finite(self, values):
        """A serialized array: a plain list or plotly's base64 typed array."""
        self.assertIsNotNone(values)
        if isinstance(values, dict):
            arr = np.frombuffer(base64.b64decode(values['bdata']),
                                dtype=np.dtype(values['dtype']))
        else:
            # plotly writes NaN and inf in plain lists as null.
            self.assertNotIn(None, values)
            arr = np.asarray(values, dtype=float)
        self.assertGreater(arr.size, 0)
        self.assertTrue(np.isfinite(arr).all())

    @staticmethod
    def _load_strict(text):
        """json.loads that fails on a bare NaN / Infinity token. A substring
        search would also hit those letters inside base64 array data."""
        def reject(token):
            raise AssertionError(f'non-finite {token} in the figure JSON')
        return json.loads(text, parse_constant=reject)

    def _check_serializes_finite(self, result):
        for fig in result[:4]:
            for trace in self._load_strict(fig.to_json())['data']:
                if trace.get('name') == self.BAND:
                    self._assert_wire_finite(trace['y'])
                if 'array' in trace.get('error_y', {}):
                    self._assert_wire_finite(trace['error_y']['array'])
                    self._assert_wire_finite(
                        trace['error_y'].get('arrayminus'))
        self.assertGreater(len(self._bands(result[0])), 0)
        self.assertIsNotNone(self._spectrum_dots(result[3]).error_y.array)

    def test_figures_serialize_without_non_finite_values(self):
        self._check_serializes_finite(self.result)

    def test_weak_smoothing_hits_the_cap_and_still_serializes(self):
        cov = self.weak_fit[2]
        self.assertIsNotNone(cov)
        self.assertTrue(
            (sigma_log_coefficients(cov) > _SIGMA_DISPLAY_CAP).any())
        self._check_serializes_finite(self.weak)
        self._check_complex_ribbons(self.weak[0], 'E Loss', True,
                                    self.weak_fit)


class TestUpdateLineChartPredictionBands(unittest.TestCase):
    """
    Where the instrument measures (the E', E'' and tan delta figures) a
    smoothed fit also draws +-1 sigma prediction ribbons: the credible sigma
    and the measurement noise the fit ran with, in quadrature. The
    relaxation and spectrum figures measure nothing and get none.
    """

    PRED = '±1σ prediction'
    CRED = '±1σ credible'
    FILE = 'agilus30 (8) master curve 20C.txt'
    N = 20
    ERROR_SCALE = 1.5

    @classmethod
    def _run(cls, upload, smoothness, **kwargs):
        """update_line_chart, plus the fit it ran and the kwargs it ran on."""
        calls = []

        def record(*args, **kw):
            out = smooth_prony_fit(*args, **kw)
            calls.append((kw, out))
            return out

        with patch('app.trive.chart.smooth_prony_fit', side_effect=record):
            result = update_line_chart(
                upload, number_of_prony=cls.N, smoothness=smoothness,
                fit_settings=True, domain='frequency', **kwargs,
            )
        kw, (tau_i, E_i, quality) = calls[-1]
        return result, (tau_i, E_i, quality.covariance, kw)

    @classmethod
    def setUpClass(cls):
        Config.FILES_DIRECTORY = DATA_DIR
        upload = upload_init(cls.FILE, 'frequency')
        cls.result, cls.fit = cls._run(upload, 0.3)
        # Weak smoothing: the display cap bites on some points.
        cls.weak, cls.weak_fit = cls._run(upload, 0.004)
        cls.unsmoothed, _ = cls._run(upload, 0.0)
        with patch('app.trive.quality._cholesky_or_none', return_value=None):
            cls.no_cov, cls.no_cov_fit = cls._run(upload, 0.3)
        # Uploaded error columns with two different relative profiles.
        cls.err_upload = dict(upload)
        mag = np.abs(upload['E Storage'] + 1.0j * upload['E Loss'])
        n = len(mag)
        cls.err_upload['E Storage Error'] = mag * np.logspace(-2, -1, n)
        cls.err_upload['E Loss Error'] = mag * np.logspace(-1, -2, n)
        cls.err, cls.err_fit = cls._run(cls.err_upload, 0.3,
                                        error_scale=cls.ERROR_SCALE)

    # --- helpers ---------------------------------------------------------

    @staticmethod
    def _named(fig, name):
        return [t for t in fig.data if t.name == name]

    @staticmethod
    def _prony(fig, xaxis):
        return next(t for t in fig.data if 'Term Prony' in (t.name or '')
                    and t.xaxis == xaxis)

    @staticmethod
    def _by_facet(bands):
        """{(xaxis, yaxis): (lower, upper)} for consecutive edge pairs."""
        return {(bands[k].xaxis, bands[k].yaxis): (bands[k], bands[k + 1])
                for k in range(0, len(bands), 2)}

    @staticmethod
    def _fit_magnitude(x, tau_i, E_i):
        """|E*| of the fitted series at x, straight from the basis."""
        basis = prony_basis(x, tau_i, len(E_i) > len(tau_i))
        curve = basis @ E_i
        return np.abs(curve[:len(x)] + 1.0j * curve[len(x):])

    @staticmethod
    def _profile_the_fit_ran_with(kw):
        """(omega_data, rel_stor, rel_loss) from the fit's own arguments."""
        mag = np.abs(kw['E_stor'] + 1.0j * kw['E_loss'])
        return (kw['omega'], kw['E_stor_std'] * kw['std_scale'] / mag,
                kw['E_loss_std'] * kw['std_scale'] / mag)

    def _check_edges(self, fig, xaxis, yaxis, sigma, log_panel):
        pairs = self._by_facet(self._named(fig, self.PRED))
        self.assertIn((xaxis, yaxis), pairs, 'no prediction ribbon here')
        lower, upper = pairs[(xaxis, yaxis)]
        curve = self._prony(fig, xaxis)
        want_lo, want_hi = TestUpdateLineChartCredibleBands._expected_edges(
            curve.y, sigma, log_panel)
        for edge in (lower, upper):
            np.testing.assert_array_equal(edge.x, curve.x)
        np.testing.assert_allclose(lower.y, want_lo, rtol=1e-9)
        np.testing.assert_allclose(upper.y, want_hi, rtol=1e-9)

    def _check_prediction_ribbons(self, fig, col2_key, col2_log, fit,
                                  profile):
        from app.trive.uncertainty import complex_modulus_noise
        tau_i, E_i, cov = fit[:3]
        pred = self._named(fig, self.PRED)
        self.assertEqual(len(pred), 4, 'expected one ribbon per facet')
        self.assertEqual(sorted(self._by_facet(pred)),
                         [('x', 'y'), ('x2', 'y2')])
        for xaxis, yaxis, key, log_panel in (
                ('x', 'y', 'E Storage', True),
                ('x2', 'y2', col2_key, col2_log)):
            x = np.asarray(self._prony(fig, xaxis).x, dtype=float)
            cred = complex_modulus_sigma(x, tau_i, E_i, cov)[key]
            noise = complex_modulus_noise(x, tau_i, E_i, *profile)[key]
            self._check_edges(fig, xaxis, yaxis, np.hypot(cred, noise),
                              log_panel)

    # --- (1) one prediction ribbon per frequency-domain facet ------------

    def test_complex_figure_has_a_prediction_ribbon_in_each_facet(self):
        self.assertIsNotNone(self.fit[2])
        self._check_prediction_ribbons(
            self.result[0], 'E Loss', True, self.fit,
            self._profile_the_fit_ran_with(self.fit[3]))

    def test_tan_delta_figure_has_a_prediction_ribbon_in_each_facet(self):
        self._check_prediction_ribbons(
            self.result[1], 'tan delta', False, self.fit,
            self._profile_the_fit_ran_with(self.fit[3]))

    def test_cap_applies_to_the_combined_sigma_under_weak_smoothing(self):
        self.assertIsNotNone(self.weak_fit[2])
        profile = self._profile_the_fit_ran_with(self.weak_fit[3])
        self._check_prediction_ribbons(
            self.weak[0], 'E Loss', True, self.weak_fit, profile)
        self._check_prediction_ribbons(
            self.weak[1], 'tan delta', False, self.weak_fit, profile)

    # --- (2) the noise is the noise the fit ran with ---------------------

    def test_relative_error_noise_is_r_times_the_fitted_magnitude(self):
        """Relative Error r (no error columns): the storage facet's sigma is
        exactly hypot(credible, r |E*_fit|)."""
        tau_i, E_i, cov, kw = self.fit
        self.assertEqual(kw['std_scale'], 0.2)  # the default setting
        for fig in self.result[:2]:
            x = np.asarray(self._prony(fig, 'x').x, dtype=float)
            cred = complex_modulus_sigma(x, tau_i, E_i, cov)['E Storage']
            noise = 0.2 * self._fit_magnitude(x, tau_i, E_i)
            self._check_edges(fig, 'x', 'y', np.hypot(cred, noise), True)

    def test_uploaded_error_columns_set_the_noise_profile(self):
        """With error columns the profile is column * error_scale / |E*_data|
        at the uploaded frequencies, storage and loss each their own."""
        self.assertIsNotNone(self.err_fit[2])
        up = self.err_upload
        mag = np.abs(up['E Storage'] + 1.0j * up['E Loss'])
        profile = (up['Frequency'],
                   up['E Storage Error'] * self.ERROR_SCALE / mag,
                   up['E Loss Error'] * self.ERROR_SCALE / mag)
        self._check_prediction_ribbons(
            self.err[0], 'E Loss', True, self.err_fit, profile)
        self._check_prediction_ribbons(
            self.err[1], 'tan delta', False, self.err_fit, profile)

    # --- (3) draw order and styling --------------------------------------

    def test_prediction_ribbons_are_drawn_first_then_credible(self):
        for fig in self.result[:2]:
            names = [t.name for t in fig.data]
            self.assertEqual(names[:8], [self.PRED] * 4 + [self.CRED] * 4)
            self.assertFalse(any((n or '').startswith('±1σ')
                                 for n in names[8:]))

    def test_prediction_ribbons_are_styled_as_their_own_legend_entry(self):
        for fig in self.result[:2]:
            pred = self._named(fig, self.PRED)
            cred = self._named(fig, self.CRED)
            for t in pred:
                self.assertEqual(t.mode, 'lines')
                self.assertEqual(t.line.width, 0)
                self.assertEqual(t.hoverinfo, 'skip')
                self.assertEqual(t.legendgroup, self.PRED)
            self.assertEqual([t.showlegend for t in pred].count(True), 1)
            self.assertEqual([t.showlegend for t in cred].count(True), 1)
            experiment = next(t for t in fig.data if t.name == 'Experiment')
            rgb = TestUpdateLineChartCredibleBands._rgb
            for lower, upper in self._by_facet(pred).values():
                self.assertNotEqual(lower.fill, 'tonexty')
                self.assertEqual(upper.fill, 'tonexty')
                self.assertTrue(upper.fillcolor.startswith('rgba('))
                alpha = float(re.findall(r'[\d.]+', upper.fillcolor)[3])
                self.assertAlmostEqual(alpha, 0.25)
                self.assertEqual(rgb(upper.fillcolor),
                                 rgb(experiment.line.color))
                self.assertNotEqual(upper.fillcolor, cred[1].fillcolor)

    def test_prediction_band_contains_the_credible_band(self):
        for result in (self.result, self.err):
            for fig in result[:2]:
                pred = self._by_facet(self._named(fig, self.PRED))
                cred = self._by_facet(self._named(fig, self.CRED))
                self.assertEqual(set(pred), set(cred))
                for facet, (c_lo, c_hi) in cred.items():
                    p_lo, p_hi = pred[facet]
                    p_hi_y = np.asarray(p_hi.y, dtype=float)
                    c_hi_y = np.asarray(c_hi.y, dtype=float)
                    self.assertTrue((p_hi_y >= c_hi_y).all(), facet)
                    self.assertTrue((np.asarray(p_lo.y, dtype=float)
                                     <= np.asarray(c_lo.y, dtype=float))
                                    .all(), facet)
                    # The noise is visible, not lost in the credible sigma.
                    self.assertFalse(np.allclose(p_hi_y, c_hi_y, rtol=1e-3),
                                     facet)

    # --- (4) nothing measured, no prediction -----------------------------

    def test_relaxation_and_spectrum_figures_get_no_prediction_ribbon(self):
        self.assertGreater(len(self._named(self.result[2], self.CRED)), 0)
        for fig in self.result[2:4]:
            self.assertEqual(self._named(fig, self.PRED), [])

    def test_no_covariance_draws_neither_band(self):
        self.assertIsNone(self.no_cov_fit[2])
        for result in (self.unsmoothed, self.no_cov):
            for fig in result[:4]:
                self.assertEqual(self._named(fig, self.PRED), [])
                self.assertEqual(self._named(fig, self.CRED), [])

    # --- (5) serialization -----------------------------------------------

    def test_figures_with_both_bands_serialize_finite(self):
        for result in (self.result, self.weak, self.err):
            for fig in result[:2]:
                data = TestUpdateLineChartCredibleBands._load_strict(
                    fig.to_json())['data']
                traces = [t for t in data if t.get('name') == self.PRED]
                self.assertEqual(len(traces), 4)
                for trace in traces:
                    TestUpdateLineChartCredibleBands._assert_wire_finite(
                        self, trace['y'])


_BANDS = ('±1σ credible', '±1σ prediction')
# Floating-point slack on window membership and on range comparisons.
_RTOL = 1e-9


def _chart_and_fit(upload, N, smoothness):
    """update_line_chart on upload, plus the (tau_i, E_i, quality) it fit."""
    fits = []

    def record(*args, **kwargs):
        out = smooth_prony_fit(*args, **kwargs)
        fits.append(out)
        return out

    with patch('app.trive.chart.smooth_prony_fit', side_effect=record):
        result = update_line_chart(
            upload, number_of_prony=N, smoothness=smoothness,
            fit_settings=True, domain='frequency',
        )
    return result, fits[-1]


def _prony_curve(fig, xaxis='x'):
    """The Prony line on the given x axis (not fig3's spectrum dots)."""
    return next(t for t in fig.data if 'Term Prony' in (t.name or '')
                and t.xaxis == xaxis and t.mode != 'markers')


def _frequency_window(tau_i):
    return 1.0 / np.max(tau_i), 1.0 / np.min(tau_i)


def _time_window(tau_i):
    return np.min(tau_i), np.max(tau_i)


def _ribbon_pairs(fig):
    """[(lower, upper)] per band and facet, in drawing order."""
    groups = {}
    for t in fig.data:
        if t.name in _BANDS:
            groups.setdefault((t.name, t.xaxis), []).append(t)
    return [tuple(pair) for pair in groups.values()]


def _is_log(fig, yaxis):
    return fig.layout['yaxis' + yaxis[1:]].type == 'log'


class TestExtendedPronyCurves(unittest.TestCase):
    """
    The fit runs on the data window only, but the drawn Prony curves and
    their ribbons run one decade past it on each side, on the smoothed and
    unsmoothed paths alike. The spectrum, table and labels are unchanged.
    """

    FILE = 'agilus30 (8) master curve 20C.txt'
    N = 20

    @classmethod
    def setUpClass(cls):
        Config.FILES_DIRECTORY = DATA_DIR
        upload = upload_init(cls.FILE, 'frequency')
        cls.smoothed, cls.smoothed_fit = _chart_and_fit(upload, cls.N, 0.3)
        cls.unsmoothed, cls.unsmoothed_fit = _chart_and_fit(
            upload, cls.N, 0.0)
        cls.runs = ((cls.smoothed, cls.smoothed_fit),
                    (cls.unsmoothed, cls.unsmoothed_fit))

    def _assert_span(self, trace, lo, hi):
        x = np.asarray(trace.x, dtype=float)
        np.testing.assert_allclose([x.min(), x.max()], [lo, hi], rtol=_RTOL)

    def test_frequency_curves_run_one_decade_past_the_window(self):
        """fig1 and fig11 draw the series from 1/(10 max tau) to
        10/min tau in both facets."""
        for result, (tau_i, _, _) in self.runs:
            lo, hi = _frequency_window(tau_i)
            for fig in result[:2]:
                for xaxis in ('x', 'x2'):
                    self._assert_span(_prony_curve(fig, xaxis),
                                      lo / 10, hi * 10)

    def test_relaxation_curve_runs_one_decade_past_the_window(self):
        """fig2 draws E(t) from min tau / 10 to 10 max tau."""
        for result, (tau_i, _, _) in self.runs:
            lo, hi = _time_window(tau_i)
            self._assert_span(_prony_curve(result[2]), lo / 10, hi * 10)

    def test_x_extent_is_the_same_with_smoothing_on_and_off(self):
        """Same file, same N: the drawn x range does not depend on whether
        smoothing is on, and both reach past the window."""
        tau_i = self.smoothed_fit[0]
        np.testing.assert_array_equal(self.unsmoothed_fit[0], tau_i)
        for k, xaxis, (lo, hi) in (
                (0, 'x', _frequency_window(tau_i)),
                (0, 'x2', _frequency_window(tau_i)),
                (1, 'x', _frequency_window(tau_i)),
                (1, 'x2', _frequency_window(tau_i)),
                (2, 'x', _time_window(tau_i))):
            on = np.asarray(_prony_curve(self.smoothed[k], xaxis).x, float)
            off = np.asarray(_prony_curve(self.unsmoothed[k], xaxis).x, float)
            self.assertEqual((on.min(), on.max()), (off.min(), off.max()))
            self.assertLess(on.min(), lo * (1 - _RTOL))
            self.assertGreater(on.max(), hi * (1 + _RTOL))

    def test_ribbons_ride_the_extended_grid(self):
        """Every ribbon edge shares the x of the Prony curve on its axis,
        so it too reaches one decade past the window."""
        result, (tau_i, _, _) = self.runs[0]
        windows = (_frequency_window(tau_i),) * 2 + (_time_window(tau_i),)
        for fig, (lo, hi) in zip(result[:3], windows):
            pairs = _ribbon_pairs(fig)
            self.assertGreater(len(pairs), 0)
            for pair in pairs:
                curve = _prony_curve(fig, pair[0].xaxis)
                for edge in pair:
                    np.testing.assert_array_equal(edge.x, curve.x)
                    self._assert_span(edge, lo / 10, hi * 10)

    def test_ribbon_edges_at_the_extension_ends_are_finite_and_capped(self):
        """At both ends of the extended grid the edges are finite, bracket
        the curve, stay within six decades of it, and are positive on log
        panels."""
        cap = np.exp(_SIGMA_DISPLAY_CAP)
        fig_names = ('fig1', 'fig11', 'fig2')
        for name, fig in zip(fig_names, self.smoothed[:3]):
            for lower, upper in _ribbon_pairs(fig):
                curve = _prony_curve(fig, lower.xaxis)
                log = _is_log(fig, lower.yaxis)
                for end in (0, -1):
                    where = f'{name} {lower.name} {lower.xaxis} end {end}'
                    y = float(curve.y[end])
                    lo, hi = float(lower.y[end]), float(upper.y[end])
                    self.assertTrue(np.isfinite([lo, hi]).all(), where)
                    self.assertLessEqual(lo, y, where)
                    self.assertGreaterEqual(hi, y, where)
                    self.assertLessEqual(hi, y * cap * (1 + _RTOL), where)
                    if log:
                        self.assertGreater(lo, 0.0, where)
                        self.assertGreaterEqual(
                            lo, y / cap * (1 - _RTOL), where)
                    else:
                        self.assertGreaterEqual(lo, 0.0, where)

    def test_spectrum_table_and_labels_are_unchanged(self):
        """No terms exist past the window: fig3's dots sit at tau_i, the
        long-term line spans [min tau, max tau], the table is the fitted
        coefficients and every label counts the decaying terms."""
        for result, (tau_i, E_i, quality) in self.runs:
            self.assertEqual(len(result), 10)
            fig3 = result[3]
            dots = next(t for t in fig3.data
                        if 'Term Prony' in (t.name or '')
                        and t.mode == 'markers')
            np.testing.assert_array_equal(dots.x, tau_i)
            hline = next(t for t in fig3.data
                         if t.name == 'Long-Term Modulus')
            self.assertEqual(tuple(hline.x), (tau_i.min(), tau_i.max()))
            self.assertEqual(
                result[6],
                _build_coef_records(tau_i, E_i, quality.covariance))
            n_nz = np.count_nonzero(E_i[len(E_i) - len(tau_i):])
            labels = {t.name for fig in result[:4] for t in fig.data
                      if 'Term Prony' in (t.name or '')}
            self.assertEqual(labels, {f'{n_nz}-Term Prony'})


class TestExtendedFigureAxisPin(unittest.TestCase):
    """
    Past the window the model heads somewhere uninteresting (E(t) to zero,
    E'' down a decade per decade, E' down on a liquid fit), so every axis
    carrying an extended Prony curve has its y range set from what lies
    inside the window: it brackets the in-window curve, data and ribbons
    and does not stretch to the out-of-window tail.
    """

    @classmethod
    def setUpClass(cls):
        Config.FILES_DIRECTORY = DATA_DIR
        agilus = upload_init('agilus30 (8) master curve 20C.txt', 'frequency')
        pmma = upload_init('PMMA_shifted_R10_data.txt', 'frequency')
        # Smoothed: both ribbons, and four nonpositive E'' rows whose
        # negative tan delta the linear panel must still show.
        cls.agilus, cls.agilus_fit = _chart_and_fit(agilus, 20, 0.3)
        # Unsmoothed PMMA: the extended E'' falls to ~0.07, against an
        # in-window minimum of 0.308 (the data) — 0.64 decades of headroom.
        cls.pmma, cls.pmma_fit = _chart_and_fit(pmma, 20, 0.0)
        cls.runs = ((cls.agilus, cls.agilus_fit), (cls.pmma, cls.pmma_fit))

    # --- helpers ---------------------------------------------------------

    @staticmethod
    def _governing_axis(fig, yaxis):
        """The layout axis whose range is drawn: a matched axis follows the
        one it matches, so an explicit range there is shared."""
        axis = fig.layout['yaxis' + yaxis[1:]]
        if axis.matches:
            axis = fig.layout['yaxis' + axis.matches[1:]]
        return axis

    def _pinned_range(self, fig, yaxis):
        axis = self._governing_axis(fig, yaxis)
        self.assertIsNotNone(axis.range, f'{yaxis} range is not pinned')
        self.assertIsNot(axis.autorange, True)
        return tuple(float(v) for v in axis.range)

    @staticmethod
    def _in_window(fig, yaxis, lo, hi):
        """y of the Prony curve, data and ribbon edges on yaxis at
        lo <= x <= hi; positive values only on a log axis."""
        log = _is_log(fig, yaxis)
        values = []
        for t in fig.data:
            name = t.name or ''
            if t.yaxis != yaxis or not (
                    name == 'Experiment' or name in _BANDS
                    or ('Term Prony' in name and t.mode != 'markers')):
                continue
            x = np.asarray(t.x, dtype=float)
            y = np.asarray(t.y, dtype=float)
            keep = ((x >= lo * (1 - _RTOL)) & (x <= hi * (1 + _RTOL))
                    & np.isfinite(y))
            if log:
                keep &= y > 0
            values.append(y[keep])
        return np.concatenate(values)

    def _assert_brackets(self, fig, yaxis, lo, hi, where):
        r0, r1 = self._pinned_range(fig, yaxis)
        values = self._in_window(fig, yaxis, lo, hi)
        self.assertGreater(len(values), 0, where)
        if _is_log(fig, yaxis):
            vmin, vmax = np.log10(values.min()), np.log10(values.max())
        else:
            vmin, vmax = values.min(), values.max()
        slack = _RTOL * max(1.0, abs(vmin), abs(vmax))
        self.assertLessEqual(r0, vmin + slack, where)
        self.assertGreaterEqual(r1, vmax - slack, where)

    # --- bracketing --------------------------------------------------------

    def test_complex_figure_ranges_bracket_the_in_window_content(self):
        for result, (tau_i, _, _) in self.runs:
            lo, hi = _frequency_window(tau_i)
            for yaxis in ('y', 'y2'):
                self._assert_brackets(result[0], yaxis, lo, hi,
                                      f'fig1 {yaxis}')

    def test_tan_delta_figure_ranges_bracket_the_in_window_content(self):
        """The E' panel is log (range in log10 units), tan delta linear."""
        for result, (tau_i, _, _) in self.runs:
            lo, hi = _frequency_window(tau_i)
            fig11 = result[1]
            self.assertTrue(_is_log(fig11, 'y'))
            self.assertFalse(_is_log(fig11, 'y2'))
            for yaxis in ('y', 'y2'):
                self._assert_brackets(fig11, yaxis, lo, hi,
                                      f'fig11 {yaxis}')

    def test_relaxation_figure_range_brackets_the_in_window_content(self):
        for result, (tau_i, _, _) in self.runs:
            lo, hi = _time_window(tau_i)
            self._assert_brackets(result[2], 'y', lo, hi, 'fig2 y')

    def test_tan_delta_ticks_stay_on_the_right_with_the_pinned_range(self):
        for result, _ in self.runs:
            fig11 = result[1]
            self.assertTrue(fig11.layout.yaxis2.showticklabels)
            self.assertEqual(fig11.layout.yaxis2.side, 'right')
            self.assertGreater(fig11.layout.legend.x, 1.02)

    # --- exclusion ---------------------------------------------------------

    def test_relaxation_range_ignores_the_decaying_tail(self):
        """E(t) omits the equilibrium modulus and heads to zero past
        max tau; the range bottom stays above where it ends up."""
        for result, (tau_i, _, _) in self.runs:
            fig2 = result[2]
            drawn = np.asarray(_prony_curve(fig2).y, dtype=float)
            inside = self._in_window(fig2, 'y', *_time_window(tau_i))
            self.assertGreater(drawn.min(), 0.0)
            self.assertLess(drawn.min(), inside.min() / 100)
            r0, _ = self._pinned_range(fig2, 'y')
            self.assertGreater(10 ** r0, drawn.min())

    def test_loss_range_ignores_the_high_frequency_tail(self):
        """PMMA, unsmoothed: the extended E'' falls below anything in the
        window, and the E'' panel's range does not follow it."""
        tau_i = self.pmma_fit[0]
        fig1 = self.pmma[0]
        drawn = np.asarray(_prony_curve(fig1, 'x2').y, dtype=float)
        inside = self._in_window(fig1, 'y2', *_frequency_window(tau_i))
        self.assertLess(drawn.min(), inside.min() / 2)
        r0, _ = self._pinned_range(fig1, 'y2')
        self.assertGreater(10 ** r0, drawn.min())

    def test_storage_range_ignores_a_liquid_low_frequency_tail(self):
        """With no equilibrium modulus (clamped to zero, or absent) E'
        falls as omega^2 past the low-frequency edge; neither figure's E'
        range follows it."""
        tau_i = np.logspace(-3.0, 3.0, 13)
        lo, hi = _frequency_window(tau_i)
        for label, E_i in (
                ('clamped', np.concatenate(([0.0], np.full(13, 1e6)))),
                ('liquid', np.full(13, 1e6))):
            with self.subTest(label):
                _, fig3 = _build_relaxation_figures(tau_i, E_i, 13, True)
                self.assertNotIn('Long-Term Modulus',
                                 [t.name for t in fig3.data])
                data = compute_complex(tau_i, E_i, num_pts=60)
                fig1, fig11 = _build_complex_figures(data, tau_i, E_i, 13)
                for name, fig in (('fig1', fig1), ('fig11', fig11)):
                    curve = _prony_curve(fig, 'x')
                    x = np.asarray(curve.x, dtype=float)
                    y = np.asarray(curve.y, dtype=float)
                    self.assertLess(x[np.argmin(y)], lo)
                    self.assertLess(y.min(),
                                    self._in_window(fig, 'y', lo, hi).min()
                                    / 10)
                    self._assert_brackets(fig, 'y', lo, hi, f'{name} y')
                    r0, _ = self._pinned_range(fig, 'y')
                    self.assertGreater(10 ** r0, y.min(), name)
                self._assert_brackets(fig1, 'y2', lo, hi, 'fig1 y2')


class TestUpdateLineChartTemperaturePronyTerms(unittest.TestCase):
    """
    A temperature upload has no frequency axis for the client to measure, so it
    sends the store default of PRONY_TERMS_MAX terms however short the ramp.
    update_line_chart sizes the series against the master curve the ω-T
    transform produces and treats the request as a ceiling.
    """

    T_REF = 25.0
    C1 = 17.44
    C2 = 51.6

    # Short ramp, in the spirit of the bundled 1 Hz temperature files (13 and 19
    # rows): far too few points to carry 100 Prony terms.
    SHORT_RAMP = {
        'Temperature': np.linspace(0.0, 80.0, 13),
        'E Storage': np.linspace(1000.0, 10.0, 13),
        'E Loss': np.full(13, 50.0),
    }

    def _run(self, number_of_prony, data=None, **kwargs):
        return update_line_chart(
            data if data is not None else self.SHORT_RAMP,
            number_of_prony=number_of_prony, smoothness=0.1,
            fit_settings=False, domain='temperature',
            Tg=self.T_REF, C1=self.C1, C2=self.C2, shift_model='WLF',
            **kwargs,
        )

    @staticmethod
    def _spy():
        return patch(
            'app.trive.chart.smooth_prony_fit',
            return_value=(np.array([1.0]), np.array([1.0]),
                          _FitQuality(1.0, 2.0, 3.0)),
        )

    @staticmethod
    def _quality_readouts(fig):
        return [a.text for a in fig.layout.annotations
                if a.text and 'lower is better' in a.text]

    def test_request_is_capped_by_the_transformed_span(self):
        with self._spy() as spy:
            self._run(100)
        N = spy.call_args.kwargs['N']
        omega = spy.call_args.kwargs['omega']
        self.assertLess(N, 100)
        self.assertEqual(N, prony_terms_for_span(omega))

    def test_lower_request_is_honored_unchanged(self):
        # The ceiling must not become a replacement: turning the term count
        # down is still the user's call in this domain.
        with self._spy() as spy:
            self._run(4)
        self.assertEqual(spy.call_args.kwargs['N'], 4)

    def test_short_ramp_at_the_default_still_reports_a_misfit(self):
        # Regression: at N = 100 the series carried more parameters than a
        # 13-row ramp has residuals, so chi-squared had no degrees of freedom,
        # _prony_fit_quality returned None for it, and _annotate_fit_quality
        # dropped it — the readout showed curvature and surprisal only.
        fig1, fig11 = self._run(100)[:2]
        for fig in (fig1, fig11):
            readouts = self._quality_readouts(fig)
            self.assertEqual(len(readouts), 1)
            self.assertIn('χ²/ν', readouts[0])

    def test_frequency_domain_request_is_untouched(self):
        # The client already sizes the series from the file itself there, so an
        # explicit term count is passed through as given.
        freq_data = {
            'Frequency': np.logspace(-2, 2, 13),
            'E Storage': np.linspace(1000.0, 10.0, 13),
            'E Loss': np.full(13, 50.0),
        }
        with self._spy() as spy:
            update_line_chart(
                freq_data, number_of_prony=100, smoothness=0.1,
                fit_settings=False, domain='frequency',
            )
        self.assertEqual(spy.call_args.kwargs['N'], 100)


class TestUpdateLineChartMaxProny(unittest.TestCase):
    """
    The tenth element is max_prony, the term count the fitted master curve
    can carry (reduction.prony_rank_limit on the fit's own arrays), or None
    on the temperature preview path where no master curve exists.
    """

    @staticmethod
    def _debye(n=120):
        omega = np.logspace(0.0, 4.0, n)
        E_stor = 1e3 + 1e6 * omega ** 2 / (1 + omega ** 2)
        E_loss = 1e6 * omega / (1 + omega ** 2) + 1e2
        return {'Frequency': omega, 'E Storage': E_stor, 'E Loss': E_loss}

    def _run_with_spy(self, data, domain, **kwargs):
        """Run update_line_chart; return (result, rank limit recomputed on
        exactly the arrays and std_scale the fit was handed)."""
        with patch('app.trive.chart.smooth_prony_fit',
                   wraps=smooth_prony_fit) as spy:
            result = update_line_chart(
                data, number_of_prony=8, smoothness=0.1,
                fit_settings=False, domain=domain, **kwargs,
            )
        fit = spy.call_args.kwargs
        expected = reduction.prony_rank_limit(
            fit['omega'], fit['E_stor'], fit['E_loss'],
            fit['E_stor_std'], fit['E_loss_std'],
            std_scale=fit['std_scale'],
        )
        return result, expected

    def test_frequency_upload_reports_the_fit_curve_limit(self):
        result, expected = self._run_with_spy(self._debye(), 'frequency')
        self.assertEqual(len(result), 10)
        self.assertIs(type(result[9]), int)
        self.assertEqual(result[9], expected)

    def test_upload_error_column_shapes_the_limit(self):
        # The probe weights rows by the upload's own sigma, as the fit does;
        # this column's shape moves the count off the |E*| default.
        data = self._debye()
        modulus = np.abs(data['E Storage'] + 1.0j * data['E Loss'])
        data['Error'] = modulus * np.logspace(0.0, 4.0, len(modulus))
        result, expected = self._run_with_spy(data, 'frequency')
        self.assertEqual(result[9], expected)
        default = reduction.prony_rank_limit(
            data['Frequency'], data['E Storage'], data['E Loss'],
            modulus, modulus)
        self.assertNotEqual(result[9], default)

    def test_temperature_upload_reports_the_master_curve_limit(self):
        T = np.linspace(0.0, 80.0, 30)
        data = {
            'Temperature': T,
            'E Storage': np.linspace(1000.0, 10.0, len(T)),
            'E Loss': np.full(len(T), 50.0),
        }
        result, expected = self._run_with_spy(
            data, 'temperature',
            Tg=25.0, C1=17.44, C2=51.6, shift_model='WLF',
        )
        self.assertIs(type(result[9]), int)
        self.assertEqual(result[9], expected)

    def test_temperature_preview_reports_none(self):
        T = np.linspace(0.0, 80.0, 30)
        data = {
            'Temperature': T,
            'E Storage': np.linspace(1000.0, 10.0, len(T)),
            'E Loss': np.full(len(T), 50.0),
        }
        result = update_line_chart(
            data, number_of_prony=8, smoothness=0.1,
            fit_settings=False, domain='temperature',
        )
        self.assertEqual(len(result), 10)
        self.assertIsNone(result[9])


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

    # --- optional error columns must be strictly positive -------------------
    # They divide the residuals as 1/sigma weights, so a zero blows up the
    # weighted design matrix and a negative is silently meaningless.

    def test_zero_shared_error_column_raises_value_error(self):
        bad = self._freq([1.0, 2.0, 3.0], [100.0, 200.0, 300.0], [10.0, 20.0, 30.0])
        bad['Error'] = np.asarray([1.0, 0.0, 3.0], float)
        with self.assertRaisesRegex(ValueError, "'Error'.*positive"):
            self._call(bad, domain='frequency')

    def test_negative_shared_error_column_raises_value_error(self):
        # Accepted silently before this check: the squared residual is
        # sign-invariant, so a negative sigma fits without complaint.
        bad = self._freq([1.0, 2.0, 3.0], [100.0, 200.0, 300.0], [10.0, 20.0, 30.0])
        bad['Error'] = np.asarray([1.0, -2.0, 3.0], float)
        with self.assertRaisesRegex(ValueError, "'Error'.*positive"):
            self._call(bad, domain='frequency')

    def test_zero_storage_error_column_names_that_column(self):
        bad = self._freq([1.0, 2.0, 3.0], [100.0, 200.0, 300.0], [10.0, 20.0, 30.0])
        bad['E Storage Error'] = np.asarray([5.0, 0.0, 15.0], float)
        bad['E Loss Error'] = np.asarray([0.5, 1.0, 1.5], float)
        with self.assertRaisesRegex(ValueError, "'E Storage Error'.*positive"):
            self._call(bad, domain='frequency')

    def test_zero_loss_error_column_names_that_column(self):
        # Mirrors the above so the loop can't be shown to short-circuit on the
        # first error column it inspects.
        bad = self._freq([1.0, 2.0, 3.0], [100.0, 200.0, 300.0], [10.0, 20.0, 30.0])
        bad['E Storage Error'] = np.asarray([5.0, 10.0, 15.0], float)
        bad['E Loss Error'] = np.asarray([0.5, 0.0, 1.5], float)
        with self.assertRaisesRegex(ValueError, "'E Loss Error'.*positive"):
            self._call(bad, domain='frequency')

    def test_positive_error_columns_pass_validation(self):
        # Negative control: the new check must not over-reject valid files.
        ok = self._freq([1.0, 2.0, 3.0], [100.0, 200.0, 300.0], [10.0, 20.0, 30.0])
        ok['E Storage Error'] = np.asarray([5.0, 10.0, 15.0], float)
        ok['E Loss Error'] = np.asarray([0.5, 1.0, 1.5], float)
        self.assertEqual(len(self._call(ok, domain='frequency')), 10)

    def test_temperature_domain_zero_error_raises_value_error(self):
        # WLF params chosen as in TestUpdateLineChartErrorColumns so every row
        # stays inside the valid shift window.
        bad = self._temp([10.0, 25.0, 40.0], [100.0, 200.0, 300.0], [10.0, 20.0, 30.0])
        bad['Error'] = np.asarray([1.0, 0.0, 3.0], float)
        with self.assertRaisesRegex(ValueError, "'Error'.*positive"):
            self._call(bad, domain='temperature',
                       Tg=25.0, C1=17.44, C2=51.6, shift_model='WLF')

    def test_temperature_domain_zero_error_raises_before_shift_param_shortcut(self):
        # With no shift params the temperature branch returns placeholder
        # figures early, never reaching the fit. The check must still fire, which
        # pins it ahead of that shortcut rather than beside the sigma lookup.
        bad = self._temp([10.0, 25.0, 40.0], [100.0, 200.0, 300.0], [10.0, 20.0, 30.0])
        bad['Error'] = np.asarray([1.0, 0.0, 3.0], float)
        with self.assertRaisesRegex(ValueError, "'Error'.*positive"):
            self._call(bad, domain='temperature')

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

    def test_shiftdata_positional_length_mismatch_raises_value_error(self):
        # Legacy positional shiftData (no Temperature column) still requires the
        # row count to match. With a Temperature column it would instead
        # interpolate onto the data temperatures (see test_shift_factors).
        temp = self._temp([0.0, 25.0, 50.0], [100.0, 200.0, 300.0], [10.0, 20.0, 30.0])
        bad_shift = {'a_T': [1.0, 1.0]}
        with self.assertRaisesRegex(ValueError, 'row'):
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
        # Temperatures stay within the WLF valid window for Tg=25, C2=51.6
        # (|log10 a_T| < MAX_ABS_LOG10_SHIFT) so tts_temperature_to_frequency_V2
        # keeps all three rows; the post-shift Frequency sort still reverses
        # their order, which is what the flow-through test exercises.
        d = {
            'Temperature': np.array([10.0, 25.0, 40.0]),
            'E Storage':   np.array([100.0, 200.0, 300.0]),
            'E Loss':      np.array([10.0, 20.0, 30.0]),
        }
        if extras:
            d.update(extras)
        return d

    def _spy(self):
        # Return a minimal valid fit result so downstream figure builders run.
        # update_line_chart asks for return_fit_quality, hence the third element.
        spy_target = patch(
            'app.trive.chart.smooth_prony_fit',
            return_value=(np.array([1.0]), np.array([1.0]),
                          _FitQuality(1.0, 2.0, 3.0)),
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
        # The factor rides in std_scale rather than the array, so the sigma the
        # fit actually sees is the product. Asserting the product keeps this
        # test about the weighting rather than about where the factor is held.
        np.testing.assert_allclose(
            kwargs['E_stor_std'] * kwargs['std_scale'], expected)
        np.testing.assert_allclose(
            kwargs['E_loss_std'] * kwargs['std_scale'], expected)

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
        np.testing.assert_allclose(
            kwargs['E_stor_std'] * kwargs['std_scale'], expected)
        np.testing.assert_allclose(
            kwargs['E_loss_std'] * kwargs['std_scale'], expected)
        # The array itself must stay free of the factor — that is what lets two
        # relative-error moves share a reduction.
        np.testing.assert_allclose(
            kwargs['E_stor_std'],
            np.abs(data['E Storage'] + 1.0j * data['E Loss']))

    def test_error_columns_leave_std_scale_at_one(self):
        # relative_error is meaningless when the file supplies sigma, so the
        # factor must not leak into std_scale and rescale the user's own errors.
        data = self._freq_data({'Error': np.array([1.0, 2.0, 3.0])})
        with self._spy() as spy:
            update_line_chart(
                data, number_of_prony=5, smoothness=0.1,
                fit_settings=False, domain='frequency', relative_error=0.5,
            )
        self.assertEqual(spy.call_args.kwargs['std_scale'], 1.0)

    def test_error_scale_kwarg_rides_in_std_scale_with_columns(self):
        # The scale must ride in std_scale rather than the array, so every
        # move of the Error Scale widget shares one cached reduction — the
        # same trick relative_error uses on the no-columns path.
        err = np.array([1.0, 2.0, 3.0])
        data = self._freq_data({'Error': err})
        with self._spy() as spy:
            update_line_chart(
                data, number_of_prony=5, smoothness=0.1,
                fit_settings=False, domain='frequency', error_scale=2.0,
            )
        kwargs = spy.call_args.kwargs
        self.assertEqual(kwargs['std_scale'], 2.0)
        np.testing.assert_array_equal(kwargs['E_stor_std'], err)
        np.testing.assert_array_equal(kwargs['E_loss_std'], err)

    def test_error_scale_ignored_without_columns(self):
        # The mirror of test_error_columns_leave_std_scale_at_one: with no
        # columns the widget is in Relative Error mode, and the scale value
        # (sent on every request regardless) must not touch the fallback.
        data = self._freq_data()
        with self._spy() as spy:
            update_line_chart(
                data, number_of_prony=5, smoothness=0.1,
                fit_settings=False, domain='frequency',
                relative_error=0.5, error_scale=3.0,
            )
        self.assertEqual(spy.call_args.kwargs['std_scale'], 0.5)

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


class TestUpdateLineChartPlotDecimation(unittest.TestCase):
    """Plot-trace thinning for oversized uploads: figures shrink and carry a
    notice; the fit and coefficient table still use every row."""

    N_LARGE = 5001  # > _PLOT_MAX_POINTS, indivisible spacing

    @staticmethod
    def _frequency_upload(n_rows):
        # Peaked Prony source sampled densely — a miniature of the broadband
        # chirp master curves that motivated the thinning.
        tau = np.logspace(-4.0, 4.0, 9)
        E_input = np.concatenate(
            ([1e6], np.exp(-(np.log10(tau)) ** 2 / 4.0) * 1e9))
        df = compute_complex(tau, E_input, num_pts=n_rows)
        return {
            'Frequency': df['Frequency'].to_numpy(),
            'E Storage': df['E Storage'].to_numpy(),
            'E Loss': df['E Loss'].to_numpy(),
        }

    @staticmethod
    def _experiment_lengths(fig):
        return [len(t.x) for t in fig.data if t.name == 'Experiment']

    @staticmethod
    def _decimation_notices(fig):
        return [a.text for a in fig.layout.annotations
                if a.text and 'decimated by' in a.text]

    @staticmethod
    def _quality_readouts(fig):
        return [a.text for a in fig.layout.annotations
                if a.text and 'lower is better' in a.text]

    @classmethod
    def setUpClass(cls):
        cls.uploadData = cls._frequency_upload(cls.N_LARGE)
        # shift_model is required for fig4/fig41 to be built at all; the
        # decimation assertions below cover them, so ask for the transform.
        cls.result = update_line_chart(
            cls.uploadData, number_of_prony=10, smoothness=0.0,
            fit_settings=False, domain='frequency',
            shift_model='WLF', Tg=30.0, C1=17.44, C2=51.6,
        )

    def test_large_upload_experiment_traces_are_thinned(self):
        fig1, fig11, _, _, fig4, fig41, _, _, _, _ = self.result
        for fig in (fig1, fig11, fig4, fig41):
            lengths = self._experiment_lengths(fig)
            self.assertTrue(lengths)  # experiment traces exist
            self.assertTrue(all(n <= _PLOT_MAX_POINTS for n in lengths))
            # thinned, not truncated: still a substantial trace
            self.assertTrue(all(n > _PLOT_MAX_POINTS // 2 for n in lengths))

    def test_prony_model_traces_untouched(self):
        # The model overlay comes from compute_complex(num_pts=1000), not from
        # the experiment rows, so thinning must not alter it.
        fig1 = self.result[0]
        model_lengths = [len(t.x) for t in fig1.data if 'Term Prony' in t.name]
        self.assertEqual(model_lengths, [1000, 1000])

    def test_figures_carry_decimation_notice_with_percentage(self):
        fig1, fig11, _, _, fig4, fig41, _, _, _, _ = self.result
        expected_pct = int(round(100.0 * (1 - _PLOT_MAX_POINTS / self.N_LARGE)))
        for fig in (fig1, fig11, fig4, fig41):
            notices = self._decimation_notices(fig)
            self.assertEqual(len(notices), 1)
            self.assertIn('too many data points', notices[0])
            self.assertIn(f'{expected_pct}%', notices[0])

    def test_complex_figures_carry_fit_quality_readout(self):
        # The two figures that overlay the fit on the data get the scores; the
        # temperature-domain visualizations, which show no fit, do not.
        fig1, fig11, _, _, fig4, fig41, _, _, _, _ = self.result
        for fig in (fig1, fig11):
            readouts = self._quality_readouts(fig)
            self.assertEqual(len(readouts), 1)
            self.assertIn('χ²/ν', readouts[0])
            self.assertIn('lower is better', readouts[0])
        for fig in (fig4, fig41):
            self.assertEqual(self._quality_readouts(fig), [])

    @staticmethod
    def _notices(fig):
        return [a for a in fig.layout.annotations
                if a.text and ('decimated by' in a.text or 'lower is better' in a.text)]

    def test_decimation_and_quality_notices_do_not_share_a_row(self):
        # Both strings are long — the decimation notice runs 86 characters and
        # the readout over 100 — so each crosses the middle of the plot on its
        # own. Anchoring one left and the other right on a single row is not
        # enough to keep them apart; they have to stack.
        fig1, fig11 = self.result[0], self.result[1]
        for fig in (fig1, fig11):
            notices = self._notices(fig)
            self.assertEqual(len(notices), 2, msg='expected both notices')
            self.assertEqual(
                len({a.y for a in notices}), 2,
                msg='decimation notice and fit-quality readout share a row',
            )

    def test_fit_quality_sits_below_the_decimation_notice(self):
        # The readout is the number a user watches while dragging the sliders,
        # so it takes the row nearest the plot and the decimation notice — which
        # says the same thing on every move — stacks above it.
        fig1 = self.result[0]
        quality = [a for a in self._notices(fig1) if 'lower is better' in a.text][0]
        decimation = [a for a in self._notices(fig1) if 'decimated by' in a.text][0]
        self.assertLess(quality.y, decimation.y)

    def test_notices_are_right_aligned(self):
        # Ragged left, flush right: the readout's numbers change width from fit
        # to fit, and anchoring right keeps that from shifting the block.
        for fig in (self.result[0], self.result[1], self.result[4]):
            for a in self._notices(fig):
                self.assertEqual(a.xanchor, 'right')
                self.assertEqual(a.x, 1.0)

    def test_lone_notice_stays_on_the_bottom_row(self):
        # The temperature figures carry the decimation notice with no readout
        # beside it. Stacking must not push a solitary note up into the margin
        # and leave an empty row under it.
        fig1, fig4 = self.result[0], self.result[4]
        lone = self._notices(fig4)
        self.assertEqual(len(lone), 1)
        self.assertEqual(lone[0].y, min(a.y for a in self._notices(fig1)))

    def test_stacking_makes_headroom_for_the_upper_row(self):
        # A second row sits higher above the plot than plotly express's default
        # 60px top margin leaves room for, so it would be clipped without more.
        # The class fixture's fig1 stacks two rows (decimation + quality
        # readout); a small upload's fig1 carries the quality readout alone.
        one_row = update_line_chart(
            self._frequency_upload(200), number_of_prony=5, smoothness=0.0,
            fit_settings=False, domain='frequency',
        )[0]
        self.assertGreater(self.result[0].layout.margin.t,
                           one_row.layout.margin.t)

    def test_quality_readout_omits_posterior_when_unsmoothed(self):
        # setUpClass fits with smoothness=0, so there is no posterior over the
        # smoothing weight and only the misfit should be shown. The NNLS active
        # set also leaves exact zeros, so log-spectrum roughness is undefined.
        readout = self._quality_readouts(self.result[0])[0]
        self.assertNotIn('surprisal', readout)
        self.assertNotIn('curvature', readout)

    def test_quality_readout_shows_posterior_when_smoothed(self):
        smoothed = update_line_chart(
            self.uploadData, number_of_prony=10, smoothness=1.0,
            fit_settings=False, domain='frequency',
        )
        readout = self._quality_readouts(smoothed[0])[0]
        self.assertIn('χ²/ν', readout)
        self.assertIn('surprisal', readout)
        self.assertIn('curvature', readout)
        # The unit-rate exponential prior is charged on the user-facing knob
        # s², not on the internal weight λ, so the label names s².
        self.assertIn('−log π(s²)', readout)
        self.assertNotIn('π(λ)', readout)

    def test_quality_readout_puts_curvature_between_the_other_two(self):
        # chi-squared and curvature are the two L-curve coordinates, so they
        # read as a pair; the posterior is a separate criterion and goes last.
        smoothed = update_line_chart(
            self.uploadData, number_of_prony=10, smoothness=1.0,
            fit_settings=False, domain='frequency',
        )
        readout = self._quality_readouts(smoothed[0])[0]
        self.assertLess(readout.index('χ²/ν'), readout.index('curvature'))
        self.assertLess(readout.index('curvature'), readout.index('surprisal'))

    def test_annotations_preserve_plotly_express_facet_titles(self):
        # add_annotation is additive; update_layout(annotations=...) would have
        # replaced the facet labels these faceted figures depend on.
        for fig in (self.result[0], self.result[1]):
            facet_titles = [a.text for a in fig.layout.annotations
                            if a.text and a.text.startswith('Modulus=')]
            self.assertTrue(facet_titles)

    def test_fit_uses_all_rows_not_the_thinned_frame(self):
        # Fitting the full arrays directly must reproduce the coefficients
        # update_line_chart returned; a fit on thinned data would differ.
        freq = self.uploadData['Frequency']
        es = self.uploadData['E Storage']
        el = self.uploadData['E Loss']
        std = np.abs(es + 1.0j * el) * 0.2  # default relative_error path
        tau_i, E_i = smooth_prony_fit(
            freq, es, el, E_stor_std=std, E_loss_std=std,
            N=10, smoothness=0.0, solid=True,
        )
        coef = {row['i']: row['E_i'] for row in self.result[6]}
        expected = {i: e for i, e in enumerate(E_i[1:]) if e != 0}
        self.assertEqual(set(coef), set(expected))
        for i in coef:
            np.testing.assert_allclose(coef[i], expected[i], rtol=1e-10)

    def test_small_upload_untouched_and_unannotated(self):
        result = update_line_chart(
            self._frequency_upload(200), number_of_prony=5, smoothness=0.0,
            fit_settings=False, domain='frequency',
            shift_model='WLF', Tg=30.0, C1=17.44, C2=51.6,
        )
        fig1, _, _, _, fig4, _, _, _, _, _ = result
        self.assertTrue(all(n == 200 for n in self._experiment_lengths(fig1)))
        for fig in (fig1, fig4):
            self.assertEqual(self._decimation_notices(fig), [])

    def test_temperature_domain_figures_also_thinned(self):
        # Temperature branch without shift params: early return, only the
        # temperature figures are built — they must still thin and annotate.
        n = self.N_LARGE
        data = {
            'Temperature': np.linspace(-50.0, 150.0, n),
            'E Storage': np.linspace(1e9, 1e6, n),
            'E Loss': np.full(n, 1e5),
        }
        _, _, _, _, fig4, fig41, _, _, _, _ = update_line_chart(
            data, number_of_prony=5, smoothness=0.0,
            fit_settings=False, domain='temperature',
        )
        for fig in (fig4, fig41):
            lengths = self._experiment_lengths(fig)
            self.assertTrue(lengths)
            self.assertTrue(all(n_ <= _PLOT_MAX_POINTS for n_ in lengths))
            self.assertEqual(len(self._decimation_notices(fig)), 1)


if __name__ == '__main__':
    unittest.main()
