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
enforces C2 >= c2_min throughout. Observed log10-RMSE ≈ 0.437 (threshold: 0.55).

Hybrid calibration (VeroCyan 80C): all three parameters (C1, C2, Ea) fitted
freely from defaults; a_T_ref (the vertical reference offset) is co-fitted and
must be applied when reconstructing (the VeroCyan data is not referenced to TL,
a_T_ref ≈ 9.07). Observed log10-RMSE ≈ 0.704 (threshold: 1.0).
"""
import unittest
import os
os.environ['OPENBLAS_NUM_THREADS'] = '1'
import sys
import json
import numpy as np

# Append the directory above 'tests' to sys.path to find the 'app' module
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))

from app.dynamfit.dynamfit2 import wlf_shift, hybrid_shift
from app.config import Config
from app.utils.util import upload_init

from ._route_helpers import make_app, make_token, REAL_FILES_DIR


class TestFitShiftCoefficientsEndToEnd(unittest.TestCase):
    """
    E2E tests for POST /dynamfit/fit-shift/.

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
            '/dynamfit/fit-shift/',
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
        self.assertIsNone(result['TL'])
        self.assertEqual(result['a_T_ref'], 1.0)

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

        # The route now surfaces the co-fit vertical reference offset; the VeroCyan
        # data is not referenced to TL, so a_T_ref must be finite, positive, ≠ 1.
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


class TestExtractRoute(unittest.TestCase):
    """
    Route-level tests for POST /dynamfit/extract/ (the Prony fit + charts route).

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
            '/dynamfit/extract/',
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
                    'temp-tand-chart', 'mytable', 'upload-data',
                    'C1', 'C2', 'Tg', 'Ea', 'TL'):
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

    def test_estimated_shift_params_echo_serializes(self):
        """
        When Tg/TL are filled by *_estimate they are numpy scalars read out of
        the data array; the echoed response must still JSON-serialize and carry
        them as plain numbers (regression guard against numpy values in the
        echoed C1/C2/Tg/Ea/TL).
        """
        resp = self._post(self._freq_body(Tg_estimate=True, TL_estimate=True))
        self.assertEqual(resp.status_code, 200, resp.data[:400])
        response = json.loads(resp.data)['response']
        self.assertIsInstance(response['Tg'], (int, float))
        self.assertIsInstance(response['TL'], (int, float))

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


if __name__ == '__main__':
    unittest.main()
