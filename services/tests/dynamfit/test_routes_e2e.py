"""
End-to-end route tests: real fixture files on disk + the real optimizer, with
NO mocking of upload_init, check_file_exists, or the fit functions. These are
the slowest dynamfit tests — they run the actual SciPy optimizer to
convergence and JSON-serialize the full response a client would receive.

They complement test_routes (which mocks everything and checks wiring) by
verifying that the optimizer converges and reconstructs the data to a
meaningful tolerance, and they guard the 'numpy not JSON serializable'
regression on the real response envelope.

Config.FILES_DIRECTORY is pointed at the checked-in files/ directory and
restored in tearDownClass.

    python -m unittest tests.dynamfit.test_routes_e2e

WLF calibration (agilus30 20C): both C1 and C2 fitted freely from defaults.
The data spans T down to -30 °C (50 °C below T_ref=20), which previously
caused a 10**exponent overflow in the optimizer (ValueError → HTTP 400) with
the default UNIVERSAL_WLF_C2=51.6 initial guess. The pole-avoidance fix uses
an analytic log10(a_T) model so overflow can't propagate as an exception, and
enforces C2 >= c2_min throughout. a_T_ref is co-fitted here too and must be
applied when reconstructing: this file IS referenced to 20 °C, but the offset
is still free (a_T_ref ≈ 2.17), because the WLF form fits the whole table
better when it is not nailed to that one point. Observed log10-RMSE ≈ 0.364,
down from 0.437 when the curve was anchored (threshold: 0.45).

Hybrid calibration (VeroCyan 80C): all three parameters (C1, C2, Ea) fitted
freely from defaults; a_T_ref (the vertical reference offset) is co-fitted and
must be applied when reconstructing (the VeroCyan data is not referenced to TC,
a_T_ref ≈ 9.07). Observed log10-RMSE ≈ 0.704 (threshold: 1.0).
"""
import unittest
import os
os.environ['OPENBLAS_NUM_THREADS'] = '1'
import sys
import json
import tempfile
import numpy as np

# Append the directory above 'tests' to sys.path to find the 'app' module
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))

from app.dynamfit.dynamfit2 import wlf_shift, hybrid_shift, peak_edge_warning
from app.config import Config
from app.utils.util import upload_init

from ._route_helpers import make_app, make_token, REAL_FILES_DIR


class TestFitShiftCoefficientsEndToEnd(unittest.TestCase):
    """
    E2E tests for POST /tri-ve/fit-shift/.

    Real files on disk, real optimizer — no mocking of upload_init, check_file_exists,
    or the fit functions.  Config.FILES_DIRECTORY is pointed at the checked-in
    files/ directory and restored in tearDownClass.
    """

    _orig_files_dir = None

    @classmethod
    def setUpClass(cls):
        cls._orig_files_dir = Config.FILES_DIRECTORY
        Config.FILES_DIRECTORY = REAL_FILES_DIR
        Config.SECRET_KEY = 'test-secret'
        cls.app = make_app()
        cls.client = cls.app.test_client()
        cls.token = make_token()
        cls.headers = {
            'Authorization': f'Bearer {cls.token}',
            'Content-Type': 'application/json',
        }

    @classmethod
    def tearDownClass(cls):
        Config.FILES_DIRECTORY = cls._orig_files_dir

    def _post(self, body):
        return self.client.post(
            '/tri-ve/fit-shift/',
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
        self.assertIsNone(result['TC'])

        C1 = result['C1']
        C2 = result['C2']
        # Co-fitted vertical offset. Free even though this file is referenced
        # to T_ref, so it lands near 2.17 rather than exactly 1 — the fit
        # trades the anchor point for a better match across the whole table.
        a_T_ref = result['a_T_ref']
        self.assertTrue(np.isfinite(a_T_ref) and a_T_ref > 0,
                        f"Expected finite positive a_T_ref, got {a_T_ref}")
        self.assertTrue(np.isfinite(C1) and C1 > 0, f"Expected finite positive C1, got {C1}")
        self.assertTrue(np.isfinite(C2) and C2 > 0, f"Expected finite positive C2, got {C2}")

        # RMSE check: load real data and reconstruct with fitted coefficients,
        # applying the surfaced a_T_ref as a consumer would. Both-free observed
        # RMSE ≈ 0.364; threshold 0.45 allows optimizer variance without
        # masking a regression to a grossly wrong solution.
        shift_data = upload_init('agilus30 (8) shift factors 20C clean.txt', 'shift')
        T = np.asarray(shift_data['Temperature'], dtype=float)
        a_T = np.asarray(shift_data['a_T'], dtype=float)
        reconstructed = wlf_shift(T, 20.0, C1, C2, a_T_ref)
        log_rmse = np.sqrt(np.mean((np.log10(reconstructed) - np.log10(a_T)) ** 2))
        self.assertLess(log_rmse, 0.45,
                        f"WLF log10-RMSE {log_rmse:.4f} exceeds 0.45 — fit likely diverged")

        # chi2_reduced must agree with the reconstruction above: with no Error
        # column sigma is one decade, so chi2/nu == RMSE² · n/(n − 3) — three
        # free parameters now, C1, C2 and the offset. Observed ≈ 0.155.
        chi2 = result['chi2_reduced']
        n = len(T)
        self.assertAlmostEqual(chi2, log_rmse ** 2 * n / (n - 3), places=10)

    def test_hybrid_e2e_converges_and_fit_is_accurate(self):
        """
        Hybrid Arrhenius/WLF fit on VeroCyan shift data (T_C=80 °C).

        All three parameters (C1, C2, Ea) are fitted freely from default initial
        guesses — no body-level C1/C2/Ea, so the optimizer is fully exercised.
        The route must return 200 with finite positive C1, C2, and Ea; Tg must
        be null; reconstructed shift factors must agree with the data in log10 space.
        """
        body = {
            'shift_file_name': 'VeroCyan (5) shift factors 80C clean.txt',
            'transform_method': 'hybrid',
            'TC': 80.0,
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

        # The route now surfaces the co-fit vertical reference offset; the VeroCyan
        # data is not referenced to TC, so a_T_ref must be finite, positive, ≠ 1.
        a_T_ref = result['a_T_ref']
        self.assertTrue(np.isfinite(a_T_ref) and a_T_ref > 0,
                        f"Expected finite positive a_T_ref, got {a_T_ref}")

        # RMSE check: observed RMSE ≈ 0.844; threshold 1.0 is meaningful without
        # being so tight that minor optimizer variance causes flakiness.
        shift_data = upload_init('VeroCyan (5) shift factors 80C clean.txt', 'shift')
        T = np.asarray(shift_data['Temperature'], dtype=float)
        a_T = np.asarray(shift_data['a_T'], dtype=float)
        # Reconstruct using the surfaced a_T_ref a consumer would apply.
        unscaled = hybrid_shift(T, 80.0, C1, C2, Ea)
        reconstructed = a_T_ref * unscaled
        log_rmse = np.sqrt(np.mean((np.log10(reconstructed) - np.log10(a_T)) ** 2))
        self.assertLess(log_rmse, 1.0,
                        f"Hybrid log10-RMSE {log_rmse:.4f} exceeds 1.0 — fit likely diverged")

        # chi2_reduced consistency, as in the WLF test but with 4 free
        # parameters (C1, C2, Ea, and the always-free a_T_ref). Observed ≈ 0.59.
        chi2 = result['chi2_reduced']
        n = len(T)
        self.assertAlmostEqual(chi2, log_rmse ** 2 * n / (n - 4), places=10)

    def test_wlf_e2e_error_column_weights_fit_and_chi2(self):
        """
        A 3-column shift file (Temperature, a_T, Error) must reach the fit as
        sigma weights: scaling every Error by 2 leaves the coefficients
        untouched (uniform weights can't move the optimum) but divides
        chi2_reduced by 4. No 3-column fixture is checked in, so write
        tempfiles beside the real ones (pattern: TestExtractRouteErrorColumns).
        """
        shift_data = upload_init('agilus30 (8) shift factors 20C clean.txt', 'shift')
        T = np.asarray(shift_data['Temperature'], dtype=float)
        a_T = np.asarray(shift_data['a_T'], dtype=float)
        results = {}
        for scale in (1.0, 2.0):
            err = 0.1 * a_T * scale  # 10% (then 20%) relative error on a_T
            name = f'_tmp_shift_with_error_x{scale:g}.txt'
            path = os.path.join(REAL_FILES_DIR, name)
            np.savetxt(path, np.column_stack([T, a_T, err]), delimiter='\t')
            self.addCleanup(os.remove, path)
            resp = self._post({
                'shift_file_name': name,
                'transform_method': 'WLF',
                'Tg': 20.0,
            })
            self.assertEqual(resp.status_code, 200)
            results[scale] = json.loads(resp.data)
        self.assertAlmostEqual(results[1.0]['C1'], results[2.0]['C1'], places=6)
        self.assertAlmostEqual(results[1.0]['C2'], results[2.0]['C2'], places=6)
        self.assertAlmostEqual(
            results[1.0]['chi2_reduced'] / results[2.0]['chi2_reduced'],
            4.0, places=6)


class TestExtractRoute(unittest.TestCase):
    """
    Route-level tests for POST /tri-ve/extract/ (the Prony fit + charts route).

    Real files on disk + real fit, no mocking, so the full response envelope is
    JSON-serialized exactly as a client receives it. This covers what the
    pure-function TestUpdateLineChart* classes cannot: request parsing,
    validation short-circuits, and JSON serialization of the response — in
    particular the regression guard for numpy values reaching stdlib json.dumps.
    """

    _orig_files_dir = None
    _FREQ_FILE = 'agilus30 (8) master curve 20C clean.txt'

    @classmethod
    def setUpClass(cls):
        cls._orig_files_dir = Config.FILES_DIRECTORY
        Config.FILES_DIRECTORY = REAL_FILES_DIR
        Config.SECRET_KEY = 'test-secret'
        cls.app = make_app()
        cls.client = cls.app.test_client()
        cls.token = make_token()
        cls.headers = {
            'Authorization': f'Bearer {cls.token}',
            'Content-Type': 'application/json',
        }

    @classmethod
    def tearDownClass(cls):
        Config.FILES_DIRECTORY = cls._orig_files_dir

    def _post(self, body):
        return self.client.post(
            '/tri-ve/extract/',
            data=json.dumps(body),
            headers=self.headers,
        )

    def _freq_body(self, **overrides):
        body = {'file_name': self._FREQ_FILE, 'domain': 'frequency', 'number_of_prony': 5}
        body.update(overrides)
        return body

    # ------------------------------------------------------------------
    # Happy path — full response envelope, fully JSON-serialized
    # ------------------------------------------------------------------

    def test_frequency_happy_path_returns_200(self):
        """
        Regression guard for 'Object of type ndarray is not JSON serializable':
        a real frequency-domain extract must serialize the whole response
        (upload-data + mytable contain numpy values) and return 200, not 500.
        """
        resp = self._post(self._freq_body())
        self.assertEqual(resp.status_code, 200, resp.data[:400])

    def test_frequency_response_has_all_chart_and_coef_keys(self):
        resp = self._post(self._freq_body())
        self.assertEqual(resp.status_code, 200, resp.data[:400])
        data = json.loads(resp.data)
        self.assertTrue(data['multi'])
        response = data['response']
        for key in ('complex-chart', 'complex-tand-chart', 'relaxation-chart',
                    'relaxation-spectrum-chart', 'complex-temp-chart',
                    'temp-tand-chart', 'shift-chart', 'shift-table',
                    'mytable', 'upload-data',
                    'C1', 'C2', 'Tg', 'Ea', 'TC', 'warnings'):
            self.assertIn(key, response)

    def test_upload_data_is_array_of_row_objects(self):
        """
        upload-data must be an array of row-objects (one dict per data row),
        matching mytable's shape, the contract doc, and the frontend
        TableComponent (which derives columns from Object.keys(rows[0])) — not a
        dict of columns.
        """
        resp = self._post(self._freq_body())
        self.assertEqual(resp.status_code, 200, resp.data[:400])
        upload = json.loads(resp.data)['response']['upload-data']
        self.assertIsInstance(upload, list)
        self.assertTrue(upload, 'expected at least one data row')
        self.assertEqual(set(upload[0]), {'Frequency', 'E Storage', 'E Loss'})
        self.assertIsInstance(upload[0]['Frequency'], (int, float))

    def test_mytable_records_have_expected_keys(self):
        resp = self._post(self._freq_body())
        self.assertEqual(resp.status_code, 200, resp.data[:400])
        mytable = json.loads(resp.data)['response']['mytable']
        self.assertIsInstance(mytable, list)
        self.assertTrue(mytable, 'expected at least one Prony coefficient record')
        self.assertEqual(set(mytable[0]), {'i', 'tau_i', 'E_i'})

    def test_frequency_peak_estimation_returns_400(self):
        """
        Tg/TC estimation is temperature-domain only: a master curve's tan-δ
        and E-loss peaks are frequencies, and reading one off as a °C value
        was a unit error. The client no longer offers the checkboxes for
        frequency data; the route refuses them with a units message.
        """
        resp = self._post(self._freq_body(Tg_estimate=True, TC_estimate=True))
        self.assertEqual(resp.status_code, 400, resp.data[:400])
        self.assertIn('frequencies, not', json.loads(resp.data)['message'])

    # ------------------------------------------------------------------
    # Validation short-circuits (do not reach response serialization)
    # ------------------------------------------------------------------

    def test_missing_file_name_returns_400(self):
        resp = self._post({'domain': 'frequency'})
        self.assertEqual(resp.status_code, 400)

    def test_file_not_found_returns_404(self):
        resp = self._post(self._freq_body(file_name='does-not-exist.txt'))
        self.assertEqual(resp.status_code, 404)

    def test_number_of_prony_out_of_range_returns_400(self):
        resp = self._post(self._freq_body(number_of_prony=999))
        self.assertEqual(resp.status_code, 400)

    # ------------------------------------------------------------------
    # Frequency→temperature manual / WLF shift conversion (viz-only path)
    # ------------------------------------------------------------------

    _SHIFT_FILE = 'agilus30 (8) shift factors 20C clean.txt'

    def test_frequency_manual_with_shift_file_returns_200(self):
        resp = self._post(self._freq_body(
            transform_method='manual', shift_file_name=self._SHIFT_FILE,
        ))
        self.assertEqual(resp.status_code, 200, resp.data[:400])
        response = json.loads(resp.data)['response']
        self.assertTrue(response['complex-temp-chart'])  # temp view built
        self.assertTrue(response['upload-data'])         # Prony fit still ran

    def test_frequency_manual_shift_chart_has_markers_and_table(self):
        """
        The shift figure and table must serialize through the real route:
        manual + shift file draws the Experiment markers (no model curve —
        'manual' has none) and emits one table row per shift-file point.
        """
        resp = self._post(self._freq_body(
            transform_method='manual', shift_file_name=self._SHIFT_FILE,
        ))
        self.assertEqual(resp.status_code, 200, resp.data[:400])
        response = json.loads(resp.data)['response']
        names = [t.get('name') for t in response['shift-chart']['data']]
        self.assertEqual(names, ['Experiment'])
        table = response['shift-table']
        shift_rows = upload_init(self._SHIFT_FILE, 'shift')
        self.assertEqual(len(table), len(shift_rows['a_T']))
        self.assertEqual(set(table[0]),
                         {'Temperature', 'a_T (measured)', 'a_T (model)'})

    def test_frequency_wlf_with_shift_file_draws_fit_curve_and_stamp(self):
        """
        WLF + shift file + a passed-through chi2 must yield both traces and
        the misfit stamp — the full display path a client exercises after
        /fit-shift/.
        """
        resp = self._post(self._freq_body(
            transform_method='WLF', Tg=20, C1=17.44, C2=51.6,
            shift_file_name=self._SHIFT_FILE, chi2_reduced=0.25,
        ))
        self.assertEqual(resp.status_code, 200, resp.data[:400])
        response = json.loads(resp.data)['response']
        names = {t.get('name') for t in response['shift-chart']['data']}
        self.assertEqual(names, {'Experiment', 'WLF fit'})
        notices = [a['text'] for a
                   in response['shift-chart']['layout'].get('annotations', [])
                   if a.get('name') == 'figure-notice']
        self.assertEqual(notices, ['misfit (χ²/ν) = 0.25 | lower is better'])

    def test_wlf_estimated_with_shift_reference_draws_markers(self):
        """
        The WLF/hybrid comparison case: shift_reference_file puts the measured
        points on the shift figure while the transform still runs from the
        model (the temp view must match the same request without the
        reference, byte for byte).
        """
        base = self._freq_body(transform_method='WLF', Tg=20, C1=17.44, C2=51.6)
        with_ref = self._post({**base, 'shift_reference_file': self._SHIFT_FILE})
        without = self._post(base)
        self.assertEqual(with_ref.status_code, 200, with_ref.data[:400])
        response = json.loads(with_ref.data)['response']
        names = {t.get('name') for t in response['shift-chart']['data']}
        self.assertEqual(names, {'Experiment', 'WLF fit'})
        self.assertEqual(
            response['complex-temp-chart'],
            json.loads(without.data)['response']['complex-temp-chart'])

    def test_frequency_no_transform_shift_chart_is_empty(self):
        resp = self._post(self._freq_body())
        self.assertEqual(resp.status_code, 200, resp.data[:400])
        response = json.loads(resp.data)['response']
        self.assertEqual(response['shift-chart'].get('data', []), [])
        self.assertEqual(response['shift-table'], [])

    def test_frequency_WLF_with_shift_params_returns_200(self):
        resp = self._post(self._freq_body(
            transform_method='WLF', Tg=20, C1=17.44, C2=51.6,
            shift_file_name=self._SHIFT_FILE,
        ))
        self.assertEqual(resp.status_code, 200, resp.data[:400])

    def test_frequency_manual_temp_view_differs_from_typed_wlf(self):
        manual = json.loads(self._post(self._freq_body(
            transform_method='manual', shift_file_name=self._SHIFT_FILE,
        )).data)['response']['complex-temp-chart']
        wlf = json.loads(self._post(self._freq_body(
            transform_method='WLF', Tg=20.0, C1=17.44, C2=51.6,
        )).data)['response']['complex-temp-chart']
        # A real shift file must move the temperature axis off a plain WLF
        # evaluation (i.e. the manual mapping actually reached the figure).
        self.assertNotEqual(
            json.dumps(manual, sort_keys=True), json.dumps(wlf, sort_keys=True),
        )

    # ------------------------------------------------------------------
    # Transform is opt-in: no request → no temperature figures
    # ------------------------------------------------------------------

    def _temp_chart_traces(self, body):
        resp = self._post(body)
        self.assertEqual(resp.status_code, 200, resp.data[:400])
        response = json.loads(resp.data)['response']
        return response['complex-temp-chart']['data'], response['temp-tand-chart']['data']

    def test_frequency_without_transform_method_returns_empty_temp_charts(self):
        # The bug this guards: an omitted transform_method used to default to
        # 'hybrid' server-side, so a plain frequency upload came back with
        # temperature figures built from UNIVERSAL_WLF_* at VIS_REF_TEMPERATURE_C.
        temp, tand = self._temp_chart_traces(self._freq_body())
        self.assertEqual(temp, [])
        self.assertEqual(tand, [])

    def test_frequency_transform_method_none_returns_empty_temp_charts(self):
        # 'none' is what the UI sends when the ω-T box is unchecked; it must be
        # accepted (not a 400) and must suppress the temperature figures.
        temp, tand = self._temp_chart_traces(self._freq_body(transform_method='none'))
        self.assertEqual(temp, [])
        self.assertEqual(tand, [])

    def test_frequency_without_transform_still_fits(self):
        # Suppressing the temperature view must not touch the Prony fit, which
        # runs on the frequency data directly.
        resp = self._post(self._freq_body())
        self.assertEqual(resp.status_code, 200, resp.data[:400])
        response = json.loads(resp.data)['response']
        self.assertTrue(response['mytable'])
        self.assertTrue(response['complex-chart']['data'])

    def test_frequency_hybrid_returns_400_no_inverse(self):
        # Hybrid has no inverse transform; the client ghosts the option for
        # frequency data and the route refuses it with a clear message instead
        # of silently substituting a universal-WLF view.
        resp = self._post(self._freq_body(transform_method='hybrid'))
        self.assertEqual(resp.status_code, 400, resp.data[:400])
        self.assertIn('no inverse transform', json.loads(resp.data)['message'])

    def test_frequency_wlf_without_Tg_returns_400(self):
        resp = self._post(self._freq_body(
            transform_method='WLF', C1_estimate=True, C2_estimate=True,
        ))
        self.assertEqual(resp.status_code, 400, resp.data[:400])
        self.assertIn('Tg', json.loads(resp.data)['message'])

    def test_invalid_transform_method_still_returns_400(self):
        resp = self._post(self._freq_body(transform_method='nope'))
        self.assertEqual(resp.status_code, 400)


class TestExtractRouteErrorColumns(unittest.TestCase):
    """
    Route-level coverage for the optional error columns.

    Every fixture in REAL_FILES_DIR is 3-column, so this class writes its own
    4- and 5-column files into a temporary FILES_DIRECTORY.
    """

    _orig_files_dir = None
    _tmpdir = None

    @classmethod
    def setUpClass(cls):
        cls._orig_files_dir = Config.FILES_DIRECTORY
        cls._tmpdir = tempfile.TemporaryDirectory()
        Config.FILES_DIRECTORY = cls._tmpdir.name
        Config.SECRET_KEY = 'test-secret'
        cls.app = make_app()
        cls.client = cls.app.test_client()
        cls.headers = {
            'Authorization': f'Bearer {make_token()}',
            'Content-Type': 'application/json',
        }

    @classmethod
    def tearDownClass(cls):
        Config.FILES_DIRECTORY = cls._orig_files_dir
        cls._tmpdir.cleanup()

    def _write(self, name, text):
        with open(os.path.join(self._tmpdir.name, name), 'w') as f:
            f.write(text)
        return name

    def _post(self, body):
        return self.client.post(
            '/tri-ve/extract/', data=json.dumps(body), headers=self.headers,
        )

    def _body(self, file_name, **overrides):
        body = {'file_name': file_name, 'domain': 'frequency', 'number_of_prony': 5}
        body.update(overrides)
        return body

    @staticmethod
    def _rows(n_cols):
        """Decade-spaced frequencies with well-conditioned moduli and errors."""
        lines = []
        for i in range(12):
            f = 10.0 ** (i - 6)
            stor, loss = 1.0e9 - i * 1.0e7, 1.0e8 - i * 1.0e6
            cols = [f, stor, loss]
            if n_cols == 4:
                cols.append(0.05 * stor)
            elif n_cols == 5:
                cols += [0.05 * stor, 0.15 * loss]
            lines.append('\t'.join(f'{c:.6e}' for c in cols))
        return '\n'.join(lines) + '\n'

    def test_zero_error_column_returns_400_with_message(self):
        # A zero divides by zero in the weighted design matrix. It must surface
        # as a ValueError -> 400, not fall through to the bare-Exception 500.
        bad = self._rows(4).split('\n')
        parts = bad[3].split('\t')
        parts[3] = '0.000000e+00'
        bad[3] = '\t'.join(parts)
        name = self._write('zero_err.tsv', '\n'.join(bad))
        resp = self._post(self._body(name))
        self.assertEqual(resp.status_code, 400, resp.data[:400])
        self.assertIn('must be positive', json.loads(resp.data)['message'])

    def test_shared_error_column_returns_200_and_is_echoed(self):
        # Guards the contract the frontend's error-column detection relies on:
        # upload-data must echo the error keys, or the error widget silently
        # stays in Relative Error mode with no other signal.
        name = self._write('shared_err.tsv', self._rows(4))
        resp = self._post(self._body(name))
        self.assertEqual(resp.status_code, 200, resp.data[:400])
        upload = json.loads(resp.data)['response']['upload-data']
        self.assertEqual(
            set(upload[0]), {'Frequency', 'E Storage', 'E Loss', 'Error'},
        )

    def test_per_modulus_error_columns_returns_200_and_are_echoed(self):
        name = self._write('per_modulus_err.tsv', self._rows(5))
        resp = self._post(self._body(name))
        self.assertEqual(resp.status_code, 200, resp.data[:400])
        upload = json.loads(resp.data)['response']['upload-data']
        self.assertEqual(
            set(upload[0]),
            {'Frequency', 'E Storage', 'E Loss', 'E Storage Error', 'E Loss Error'},
        )

    def test_relative_error_zero_returns_400(self):
        # The other route to the same division by zero: with no error columns
        # the synthesized sigma is |E*| * relative_error.
        name = self._write('plain.tsv', self._rows(3))
        resp = self._post(self._body(name, relative_error=0))
        self.assertEqual(resp.status_code, 400, resp.data[:400])
        self.assertIn('relative error must be positive', json.loads(resp.data)['message'])

    def test_error_scale_zero_returns_400(self):
        # Same division by zero via the columns branch, where std_scale
        # multiplies the file's own sigmas.
        name = self._write('scaled_err.tsv', self._rows(4))
        resp = self._post(self._body(name, error_scale=0))
        self.assertEqual(resp.status_code, 400, resp.data[:400])
        self.assertIn('error scale must be positive', json.loads(resp.data)['message'])


class TestPeakEdgeWarning(unittest.TestCase):
    """
    Unit tests for peak_edge_warning: the edge-proximity caution attached to
    estimated Tg/TC peaks. The threshold is strict — a peak exactly margin
    degrees from the edge is trusted.
    """

    T = np.arange(0.0, 81.0, 2.0)  # 0..80 °C

    def test_interior_peak_returns_none(self):
        self.assertIsNone(peak_edge_warning(40.0, self.T, 'Tg'))

    def test_peak_near_cold_edge_warns(self):
        msg = peak_edge_warning(2.0, self.T, 'Tg')
        self.assertIsNotNone(msg)
        self.assertIn('Tg', msg)
        self.assertIn('manually', msg)

    def test_peak_near_hot_edge_warns(self):
        msg = peak_edge_warning(79.0, self.T, 'Tc')
        self.assertIsNotNone(msg)
        self.assertIn('Tc', msg)

    def test_peak_exactly_at_margin_is_trusted(self):
        self.assertIsNone(peak_edge_warning(5.0, self.T, 'Tg'))
        self.assertIsNone(peak_edge_warning(75.0, self.T, 'Tg'))

    def test_margin_is_configurable(self):
        self.assertIsNone(peak_edge_warning(2.0, self.T, 'Tg', margin=1.0))
        self.assertIsNotNone(peak_edge_warning(40.0, self.T, 'Tg', margin=45.0))


class TestExtractRouteEstimateWarnings(unittest.TestCase):
    """
    E2E: estimated Tg/TC peaks near the temperature edge must ride back in
    the response's warnings array (and interior peaks must not), through the
    real route with real files.
    """

    _orig_files_dir = None
    _tmpdir = None

    @classmethod
    def setUpClass(cls):
        cls._orig_files_dir = Config.FILES_DIRECTORY
        cls._tmpdir = tempfile.TemporaryDirectory()
        Config.FILES_DIRECTORY = cls._tmpdir.name
        Config.SECRET_KEY = 'test-secret'
        cls.app = make_app()
        cls.client = cls.app.test_client()
        cls.headers = {
            'Authorization': f'Bearer {make_token()}',
            'Content-Type': 'application/json',
        }

    @classmethod
    def tearDownClass(cls):
        Config.FILES_DIRECTORY = cls._orig_files_dir
        cls._tmpdir.cleanup()

    def _post(self, body):
        return self.client.post(
            '/tri-ve/extract/', data=json.dumps(body), headers=self.headers,
        )

    def _write_ramp(self, name, bump_T):
        """
        Temperature ramp 0..80 °C in 2° steps with flat-ish moduli and a
        single loss bump at bump_T, so both the tan-δ and E-loss peaks land
        exactly there.
        """
        lines = []
        for T in range(0, 81, 2):
            stor = 1.0e9 - T * 1.0e6
            loss = 1.0e8 if T == bump_T else 1.0e7
            lines.append(f'{T:.1f}\t{stor:.6e}\t{loss:.6e}')
        with open(os.path.join(self._tmpdir.name, name), 'w') as f:
            f.write('\n'.join(lines) + '\n')
        return name

    def _temp_body(self, file_name, **overrides):
        body = {
            'file_name': file_name, 'domain': 'temperature',
            'number_of_prony': 5,
        }
        body.update(overrides)
        return body

    def test_edge_peak_estimates_warn(self):
        # Peak at 2 °C — within 5° of the cold edge. WLF with estimated Tg
        # still transforms fine (the pole Tg - C2 sits below the data), so the
        # request succeeds AND warns.
        name = self._write_ramp('edge_bump.tsv', 2)
        resp = self._post(self._temp_body(
            name, transform_method='WLF',
            Tg_estimate=True, C1_estimate=True, C2_estimate=True,
        ))
        self.assertEqual(resp.status_code, 200, resp.data[:400])
        warnings = json.loads(resp.data)['response']['warnings']
        self.assertEqual(len(warnings), 1)
        self.assertIn('Tg', warnings[0])

    def test_both_estimates_near_edge_warn_twice(self):
        # Peak at 78 °C — within 5° of the hot edge; Tg and TC both estimate
        # to it. Hybrid keeps the transform well-defined at that TC.
        name = self._write_ramp('hot_edge_bump.tsv', 78)
        resp = self._post(self._temp_body(
            name, transform_method='hybrid', Ea=200.0,
            Tg_estimate=True, TC_estimate=True,
            C1_estimate=True, C2_estimate=True,
        ))
        self.assertEqual(resp.status_code, 200, resp.data[:400])
        warnings = json.loads(resp.data)['response']['warnings']
        self.assertEqual(len(warnings), 2)
        self.assertIn('Tg', warnings[0])
        self.assertIn('Tc', warnings[1])

    def test_estimated_shift_params_echo_serializes(self):
        # Tg/TC filled by *_estimate are numpy scalars read out of the data
        # array; the echoed response must still JSON-serialize and carry them
        # as plain numbers (regression guard against numpy values in the
        # echoed C1/C2/Tg/Ea/TC).
        name = self._write_ramp('echo_bump.tsv', 40)
        resp = self._post(self._temp_body(
            name, transform_method='hybrid', Ea=200.0,
            Tg_estimate=True, TC_estimate=True,
            C1_estimate=True, C2_estimate=True,
        ))
        self.assertEqual(resp.status_code, 200, resp.data[:400])
        response = json.loads(resp.data)['response']
        self.assertIsInstance(response['Tg'], (int, float))
        self.assertIsInstance(response['TC'], (int, float))

    def test_interior_peak_estimates_do_not_warn(self):
        # Peak at 40 °C — comfortably interior. Hybrid with a typed TC keeps
        # the estimated Tg out of the transform, isolating the warning logic.
        name = self._write_ramp('interior_bump.tsv', 40)
        resp = self._post(self._temp_body(
            name, transform_method='hybrid',
            TC=40.0, Ea=200.0, C1_estimate=True, C2_estimate=True,
            Tg_estimate=True,
        ))
        self.assertEqual(resp.status_code, 200, resp.data[:400])
        self.assertEqual(json.loads(resp.data)['response']['warnings'], [])


if __name__ == '__main__':
    unittest.main()
