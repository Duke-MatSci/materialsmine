"""
Fast route-wiring tests for the dynamfit Flask endpoints.

Everything external is mocked at the route-module boundary (check_file_exists,
upload_init, fit_wlf_coefficients, fit_hybrid_coefficients), so these tests
never touch disk or run the optimizer. They verify request parsing, the
response envelope, parameter pass-through (e.g. fix_C1), and the
validation/short-circuit error codes — NOT the fit math (see
test_coefficient_fits) and NOT real convergence (see test_routes_e2e).

    python -m unittest tests.dynamfit.test_routes
"""
import unittest
import os
os.environ['OPENBLAS_NUM_THREADS'] = '1'
import sys
import json
from unittest.mock import patch

# Append the directory above 'tests' to sys.path to find the 'app' module
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))

from app.config import Config

from ._route_helpers import (
    make_app,
    make_token,
    SHIFT_DATA,
    C1_RETURNED,
    C2_RETURNED,
    EA_RETURNED,
    A_T_REF_RETURNED,
)


class TestFitShiftCoefficientsRoute(unittest.TestCase):
    """
    Route-level tests for POST /dynamfit/fit-shift/, the dedicated shift-domain
    coefficient-fit endpoint (split out of /extract/).

    Strategy:
      - Build a bare Flask app (no create_app) to avoid the Docker-only FileHandler.
      - Patch Config.SECRET_KEY so token_required decodes our test tokens.
      - Patch check_file_exists and upload_init at the route module boundary so
        tests never touch disk and don't depend on real file content.
      - Patch fit_wlf_coefficients and fit_hybrid_coefficients so tests verify
        route wiring, not fit math (fit math is covered in TestFitWlfCoefficients
        and TestFitHybridCoefficients in test_coefficient_fits).
    """

    @classmethod
    def setUpClass(cls):
        Config.SECRET_KEY = 'test-secret'
        cls.app = make_app()
        cls.client = cls.app.test_client()
        cls.token = make_token()
        cls.headers = {'Authorization': f'Bearer {cls.token}',
                       'Content-Type': 'application/json'}

    def _post(self, body):
        return self.client.post(
            '/dynamfit/fit-shift/',
            data=json.dumps(body),
            headers=self.headers,
        )

    def _base_wlf_body(self, **overrides):
        body = {
            'shift_file_name': 'shift.txt',
            'transform_method': 'WLF',
            'Tg': 25.0,
        }
        body.update(overrides)
        return body

    def _base_hybrid_body(self, **overrides):
        body = {
            'shift_file_name': 'shift.txt',
            'transform_method': 'hybrid',
            'TL': 25.0,
        }
        body.update(overrides)
        return body

    # ------------------------------------------------------------------
    # Happy paths
    # ------------------------------------------------------------------

    @patch('app.dynamfit.routes.fit_wlf_coefficients',
           return_value=(C1_RETURNED, C2_RETURNED))
    @patch('app.dynamfit.routes.upload_init', return_value=SHIFT_DATA)
    @patch('app.dynamfit.routes.check_file_exists', return_value=True)
    def test_wlf_happy_path_returns_seven_coefficient_keys(
            self, _exists, _upload, _fit):
        resp = self._post(self._base_wlf_body())
        self.assertEqual(resp.status_code, 200)
        data = json.loads(resp.data)
        self.assertEqual(
            set(data.keys()),
            {'transform_method', 'Tg', 'C1', 'C2', 'Ea', 'TL', 'a_T_ref'},
        )

    @patch('app.dynamfit.routes.fit_wlf_coefficients',
           return_value=(C1_RETURNED, C2_RETURNED))
    @patch('app.dynamfit.routes.upload_init', return_value=SHIFT_DATA)
    @patch('app.dynamfit.routes.check_file_exists', return_value=True)
    def test_wlf_happy_path_a_T_ref_is_one(
            self, _exists, _upload, _fit):
        # WLF is anchored at T_ref=Tg where a_T == 1 by construction.
        resp = self._post(self._base_wlf_body())
        data = json.loads(resp.data)
        self.assertEqual(data['a_T_ref'], 1.0)

    @patch('app.dynamfit.routes.fit_wlf_coefficients',
           return_value=(C1_RETURNED, C2_RETURNED))
    @patch('app.dynamfit.routes.upload_init', return_value=SHIFT_DATA)
    @patch('app.dynamfit.routes.check_file_exists', return_value=True)
    def test_wlf_happy_path_ea_and_tl_are_null(
            self, _exists, _upload, _fit):
        resp = self._post(self._base_wlf_body())
        data = json.loads(resp.data)
        self.assertIsNone(data['Ea'])
        self.assertIsNone(data['TL'])

    @patch('app.dynamfit.routes.fit_wlf_coefficients',
           return_value=(C1_RETURNED, C2_RETURNED))
    @patch('app.dynamfit.routes.upload_init', return_value=SHIFT_DATA)
    @patch('app.dynamfit.routes.check_file_exists', return_value=True)
    def test_wlf_happy_path_c1_c2_are_plain_floats(
            self, _exists, _upload, _fit):
        # Confirms JSON serialization works: numpy scalars would raise TypeError.
        resp = self._post(self._base_wlf_body())
        data = json.loads(resp.data)
        self.assertIsInstance(data['C1'], float)
        self.assertIsInstance(data['C2'], float)

    @patch('app.dynamfit.routes.fit_hybrid_coefficients',
           return_value=(C1_RETURNED, C2_RETURNED, EA_RETURNED, A_T_REF_RETURNED))
    @patch('app.dynamfit.routes.upload_init', return_value=SHIFT_DATA)
    @patch('app.dynamfit.routes.check_file_exists', return_value=True)
    def test_hybrid_happy_path_tg_null_ea_tl_populated(
            self, _exists, _upload, _fit):
        resp = self._post(self._base_hybrid_body())
        self.assertEqual(resp.status_code, 200)
        data = json.loads(resp.data)
        self.assertIsNone(data['Tg'])
        self.assertIsInstance(data['Ea'], float)
        self.assertIsInstance(data['TL'], float)

    @patch('app.dynamfit.routes.fit_hybrid_coefficients',
           return_value=(C1_RETURNED, C2_RETURNED, EA_RETURNED, A_T_REF_RETURNED))
    @patch('app.dynamfit.routes.upload_init', return_value=SHIFT_DATA)
    @patch('app.dynamfit.routes.check_file_exists', return_value=True)
    def test_hybrid_happy_path_surfaces_co_fit_a_T_ref(
            self, _exists, _upload, _fit):
        # The 4th element of fit_hybrid_coefficients (the co-fit vertical offset)
        # must reach the response as a_T_ref.
        resp = self._post(self._base_hybrid_body())
        data = json.loads(resp.data)
        self.assertEqual(data['a_T_ref'], A_T_REF_RETURNED)

    @patch('app.dynamfit.routes.fit_wlf_coefficients',
           return_value=(C1_RETURNED, C2_RETURNED))
    @patch('app.dynamfit.routes.upload_init', return_value=SHIFT_DATA)
    @patch('app.dynamfit.routes.check_file_exists', return_value=True)
    def test_wlf_supplied_c1_passes_fix_c1_true_to_fit(
            self, _exists, _upload, mock_fit):
        """When C1 is in the body the route must pass fix_C1=True to the fit function."""
        resp = self._post(self._base_wlf_body(C1=99.0))
        self.assertEqual(resp.status_code, 200)
        _, kwargs = mock_fit.call_args
        self.assertTrue(kwargs.get('fix_C1'))

    @patch('app.dynamfit.routes.fit_wlf_coefficients',
           return_value=(C1_RETURNED, C2_RETURNED))
    @patch('app.dynamfit.routes.upload_init', return_value=SHIFT_DATA)
    @patch('app.dynamfit.routes.check_file_exists', return_value=True)
    def test_wlf_response_lacks_chart_keys(
            self, _exists, _upload, _fit):
        """The short-circuit branch must NOT include chart output keys."""
        resp = self._post(self._base_wlf_body())
        data = json.loads(resp.data)
        for chart_key in ('complex-chart', 'mytable', 'multi', 'response'):
            self.assertNotIn(chart_key, data)

    # ------------------------------------------------------------------
    # Validation / short-circuit errors
    # ------------------------------------------------------------------

    def test_missing_shift_file_name_returns_400(self):
        body = {
            'transform_method': 'WLF',
            'Tg': 25.0,
            # shift_file_name intentionally omitted
        }
        resp = self._post(body)
        self.assertEqual(resp.status_code, 400)

    @patch('app.dynamfit.routes.check_file_exists', return_value=False)
    def test_shift_file_not_found_returns_404(self, _exists):
        resp = self._post(self._base_wlf_body())
        self.assertEqual(resp.status_code, 404)

    @patch('app.dynamfit.routes.check_file_exists', return_value=True)
    def test_invalid_transform_method_returns_400(self, _exists):
        body = self._base_wlf_body(transform_method='manual')
        resp = self._post(body)
        self.assertEqual(resp.status_code, 400)

    @patch('app.dynamfit.routes.upload_init', return_value=SHIFT_DATA)
    @patch('app.dynamfit.routes.check_file_exists', return_value=True)
    def test_wlf_missing_tg_returns_400(self, _exists, _upload):
        body = {
            'shift_file_name': 'shift.txt',
            'transform_method': 'WLF',
            # Tg intentionally omitted
        }
        resp = self._post(body)
        self.assertEqual(resp.status_code, 400)

    @patch('app.dynamfit.routes.upload_init', return_value=SHIFT_DATA)
    @patch('app.dynamfit.routes.check_file_exists', return_value=True)
    def test_hybrid_missing_tl_returns_400(self, _exists, _upload):
        body = {
            'shift_file_name': 'shift.txt',
            'transform_method': 'hybrid',
            # TL intentionally omitted
        }
        resp = self._post(body)
        self.assertEqual(resp.status_code, 400)

    @patch('app.dynamfit.routes.upload_init', return_value=None)
    @patch('app.dynamfit.routes.check_file_exists', return_value=True)
    def test_empty_shift_file_returns_400(self, _exists, _upload):
        resp = self._post(self._base_wlf_body())
        self.assertEqual(resp.status_code, 400)


if __name__ == '__main__':
    unittest.main()
