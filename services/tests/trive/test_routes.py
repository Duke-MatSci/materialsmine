"""
Fast route-wiring tests for the Tri-VE Flask endpoints.

Everything external is mocked at the route-module boundary (check_file_exists,
upload_init, fit_wlf_coefficients, fit_hybrid_coefficients,
search_hybrid_tc), so these tests
never touch disk or run the optimizer. They verify request parsing, the
response envelope, parameter pass-through (e.g. fix_C1), and the
validation/short-circuit error codes — NOT the fit math (see
test_coefficient_fits) and NOT real convergence (see test_routes_e2e).

    python -m unittest tests.trive.test_routes
"""
import unittest
import os
os.environ['OPENBLAS_NUM_THREADS'] = '1'
import sys
import json
import inspect
from unittest.mock import patch

import numpy as np

# Append the directory above 'tests' to sys.path to find the 'app' module
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))

from app.config import Config
import app.trive as trive

from ._route_helpers import (
    make_app,
    make_token,
    SHIFT_DATA,
    SHIFT_DATA_WITH_ERROR,
    C1_RETURNED,
    C2_RETURNED,
    EA_RETURNED,
    A_T_REF_RETURNED,
    CHI2_RETURNED,
)

# What the mocked Tc search returns: not a table temperature or a body value,
# so a surfaced TC can only have come from the search.
TC_SEARCHED = 33.3
SEARCH_RETURNED = (TC_SEARCHED, C1_RETURNED, C2_RETURNED, EA_RETURNED,
                   A_T_REF_RETURNED, CHI2_RETURNED)


class TestFitShiftCoefficientsRoute(unittest.TestCase):
    """
    Route-level tests for POST /tri-ve/fit-shift/, the dedicated shift-domain
    coefficient-fit endpoint (split out of /extract/).

    Strategy:
      - Build a bare Flask app (no create_app) to avoid the Docker-only FileHandler.
      - Patch Config.SECRET_KEY so token_required decodes our test tokens.
      - Patch check_file_exists and upload_init at the route module boundary so
        tests never touch disk and don't depend on real file content.
      - Patch fit_wlf_coefficients, fit_hybrid_coefficients and
        search_hybrid_tc so tests verify
        route wiring, not fit math (fit math is covered in TestFitWlfCoefficients,
        TestFitHybridCoefficients and TestSearchHybridTc in
        test_coefficient_fits).
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
            '/tri-ve/fit-shift/',
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
            'TC': 25.0,
        }
        body.update(overrides)
        return body

    # ------------------------------------------------------------------
    # Happy paths
    # ------------------------------------------------------------------

    @patch('app.trive.routes.fit_wlf_coefficients',
           return_value=(C1_RETURNED, C2_RETURNED, A_T_REF_RETURNED,
                         CHI2_RETURNED))
    @patch('app.trive.routes.upload_init', return_value=SHIFT_DATA)
    @patch('app.trive.routes.check_file_exists', return_value=True)
    def test_wlf_happy_path_returns_eight_coefficient_keys(
            self, _exists, _upload, _fit):
        resp = self._post(self._base_wlf_body())
        self.assertEqual(resp.status_code, 200)
        data = json.loads(resp.data)
        self.assertEqual(
            set(data.keys()),
            {'transform_method', 'Tg', 'C1', 'C2', 'Ea', 'TC', 'a_T_ref',
             'chi2_reduced'},
        )

    @patch('app.trive.routes.fit_wlf_coefficients',
           return_value=(C1_RETURNED, C2_RETURNED, A_T_REF_RETURNED,
                         CHI2_RETURNED))
    @patch('app.trive.routes.upload_init', return_value=SHIFT_DATA)
    @patch('app.trive.routes.check_file_exists', return_value=True)
    def test_wlf_happy_path_surfaces_co_fit_a_T_ref(
            self, _exists, _upload, _fit):
        # The WLF fit co-fits the vertical offset at Tg (the shift file need
        # not be referenced there), and the route must surface what it fitted
        # rather than the 1.0 the anchored model used to imply.
        resp = self._post(self._base_wlf_body())
        data = json.loads(resp.data)
        self.assertEqual(data['a_T_ref'], A_T_REF_RETURNED)

    @patch('app.trive.routes.fit_wlf_coefficients',
           return_value=(C1_RETURNED, C2_RETURNED, A_T_REF_RETURNED,
                         CHI2_RETURNED))
    @patch('app.trive.routes.upload_init', return_value=SHIFT_DATA)
    @patch('app.trive.routes.check_file_exists', return_value=True)
    def test_wlf_happy_path_ea_and_tl_are_null(
            self, _exists, _upload, _fit):
        resp = self._post(self._base_wlf_body())
        data = json.loads(resp.data)
        self.assertIsNone(data['Ea'])
        self.assertIsNone(data['TC'])

    @patch('app.trive.routes.fit_wlf_coefficients',
           return_value=(C1_RETURNED, C2_RETURNED, A_T_REF_RETURNED,
                         CHI2_RETURNED))
    @patch('app.trive.routes.upload_init', return_value=SHIFT_DATA)
    @patch('app.trive.routes.check_file_exists', return_value=True)
    def test_wlf_happy_path_c1_c2_are_plain_floats(
            self, _exists, _upload, _fit):
        # Confirms JSON serialization works: numpy scalars would raise TypeError.
        resp = self._post(self._base_wlf_body())
        data = json.loads(resp.data)
        self.assertIsInstance(data['C1'], float)
        self.assertIsInstance(data['C2'], float)

    @patch('app.trive.routes.fit_hybrid_coefficients',
           return_value=(C1_RETURNED, C2_RETURNED, EA_RETURNED, A_T_REF_RETURNED, CHI2_RETURNED))
    @patch('app.trive.routes.upload_init', return_value=SHIFT_DATA)
    @patch('app.trive.routes.check_file_exists', return_value=True)
    def test_hybrid_happy_path_tg_null_ea_tl_populated(
            self, _exists, _upload, _fit):
        resp = self._post(self._base_hybrid_body())
        self.assertEqual(resp.status_code, 200)
        data = json.loads(resp.data)
        self.assertIsNone(data['Tg'])
        self.assertIsInstance(data['Ea'], float)
        self.assertIsInstance(data['TC'], float)

    @patch('app.trive.routes.fit_hybrid_coefficients',
           return_value=(C1_RETURNED, C2_RETURNED, EA_RETURNED, A_T_REF_RETURNED, CHI2_RETURNED))
    @patch('app.trive.routes.upload_init', return_value=SHIFT_DATA)
    @patch('app.trive.routes.check_file_exists', return_value=True)
    def test_hybrid_happy_path_surfaces_co_fit_a_T_ref(
            self, _exists, _upload, _fit):
        # The 4th element of fit_hybrid_coefficients (the co-fit vertical offset)
        # must reach the response as a_T_ref.
        resp = self._post(self._base_hybrid_body())
        data = json.loads(resp.data)
        self.assertEqual(data['a_T_ref'], A_T_REF_RETURNED)

    @patch('app.trive.routes.fit_wlf_coefficients',
           return_value=(C1_RETURNED, C2_RETURNED, A_T_REF_RETURNED,
                         CHI2_RETURNED))
    @patch('app.trive.routes.upload_init', return_value=SHIFT_DATA)
    @patch('app.trive.routes.check_file_exists', return_value=True)
    def test_wlf_supplied_c1_passes_fix_c1_true_to_fit(
            self, _exists, _upload, mock_fit):
        """When C1 is in the body the route must pass fix_C1=True to the fit function."""
        resp = self._post(self._base_wlf_body(C1=99.0))
        self.assertEqual(resp.status_code, 200)
        _, kwargs = mock_fit.call_args
        self.assertTrue(kwargs.get('fix_C1'))

    @patch('app.trive.routes.fit_wlf_coefficients',
           return_value=(C1_RETURNED, C2_RETURNED, A_T_REF_RETURNED,
                         CHI2_RETURNED))
    @patch('app.trive.routes.upload_init', return_value=SHIFT_DATA)
    @patch('app.trive.routes.check_file_exists', return_value=True)
    def test_wlf_response_lacks_chart_keys(
            self, _exists, _upload, _fit):
        """The short-circuit branch must NOT include chart output keys."""
        resp = self._post(self._base_wlf_body())
        data = json.loads(resp.data)
        for chart_key in ('complex-chart', 'shift-chart', 'mytable',
                          'multi', 'response'):
            self.assertNotIn(chart_key, data)

    @patch('app.trive.routes.fit_wlf_coefficients',
           return_value=(C1_RETURNED, C2_RETURNED, A_T_REF_RETURNED,
                         CHI2_RETURNED))
    @patch('app.trive.routes.upload_init', return_value=SHIFT_DATA)
    @patch('app.trive.routes.check_file_exists', return_value=True)
    def test_wlf_surfaces_chi2_and_requests_quality(
            self, _exists, _upload, mock_fit):
        """The fit's chi2 must reach the response; the route must ask for it."""
        resp = self._post(self._base_wlf_body())
        data = json.loads(resp.data)
        self.assertEqual(data['chi2_reduced'], CHI2_RETURNED)
        _, kwargs = mock_fit.call_args
        self.assertTrue(kwargs.get('return_quality'))

    @patch('app.trive.routes.fit_hybrid_coefficients',
           return_value=(C1_RETURNED, C2_RETURNED, EA_RETURNED,
                         A_T_REF_RETURNED, CHI2_RETURNED))
    @patch('app.trive.routes.upload_init', return_value=SHIFT_DATA)
    @patch('app.trive.routes.check_file_exists', return_value=True)
    def test_hybrid_surfaces_chi2(self, _exists, _upload, _fit):
        resp = self._post(self._base_hybrid_body())
        data = json.loads(resp.data)
        self.assertEqual(data['chi2_reduced'], CHI2_RETURNED)

    @patch('app.trive.routes.fit_wlf_coefficients',
           return_value=(C1_RETURNED, C2_RETURNED, A_T_REF_RETURNED,
                         CHI2_RETURNED))
    @patch('app.trive.routes.upload_init',
           return_value=SHIFT_DATA_WITH_ERROR)
    @patch('app.trive.routes.check_file_exists', return_value=True)
    def test_wlf_error_column_reaches_sigma_a_T(
            self, _exists, _upload, mock_fit):
        """A 3-column shift file's Error column must be passed as sigma_a_T."""
        resp = self._post(self._base_wlf_body())
        self.assertEqual(resp.status_code, 200)
        _, kwargs = mock_fit.call_args
        self.assertIsNotNone(kwargs.get('sigma_a_T'))
        self.assertEqual(list(kwargs['sigma_a_T']),
                         list(SHIFT_DATA_WITH_ERROR['Error']))

    @patch('app.trive.routes.fit_wlf_coefficients',
           return_value=(C1_RETURNED, C2_RETURNED, A_T_REF_RETURNED,
                         CHI2_RETURNED))
    @patch('app.trive.routes.upload_init', return_value=SHIFT_DATA)
    @patch('app.trive.routes.check_file_exists', return_value=True)
    def test_wlf_without_error_column_sigma_is_none(
            self, _exists, _upload, mock_fit):
        resp = self._post(self._base_wlf_body())
        self.assertEqual(resp.status_code, 200)
        _, kwargs = mock_fit.call_args
        self.assertIsNone(kwargs.get('sigma_a_T'))

    @patch('app.trive.routes.fit_wlf_coefficients',
           return_value=(C1_RETURNED, C2_RETURNED, A_T_REF_RETURNED,
                         CHI2_RETURNED))
    @patch('app.trive.routes.upload_init', return_value=SHIFT_DATA)
    @patch('app.trive.routes.check_file_exists', return_value=True)
    def test_string_coefficients_are_coerced_to_float(
            self, _exists, _upload, mock_fit):
        """
        The coefficient inputs are text fields, so a hand-typed Tg arrives in
        the JSON body as the string "20". It must reach the fit as a float —
        uncoerced it dies inside numpy arithmetic as a 500.
        """
        resp = self._post(self._base_wlf_body(Tg='20', C1='14.5'))
        self.assertEqual(resp.status_code, 200)
        _, kwargs = mock_fit.call_args
        self.assertEqual(kwargs.get('T_ref'), 20.0)
        self.assertEqual(kwargs.get('C1'), 14.5)

    @patch('app.trive.routes.upload_init', return_value=SHIFT_DATA)
    @patch('app.trive.routes.check_file_exists', return_value=True)
    def test_non_numeric_coefficient_returns_400_naming_the_field(
            self, _exists, _upload):
        resp = self._post(self._base_wlf_body(Tg='twenty'))
        self.assertEqual(resp.status_code, 400)
        self.assertIn('Tg', json.loads(resp.data)['message'])

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

    @patch('app.trive.routes.check_file_exists', return_value=False)
    def test_shift_file_not_found_returns_404(self, _exists):
        resp = self._post(self._base_wlf_body())
        self.assertEqual(resp.status_code, 404)

    @patch('app.trive.routes.check_file_exists', return_value=True)
    def test_invalid_transform_method_returns_400(self, _exists):
        body = self._base_wlf_body(transform_method='manual')
        resp = self._post(body)
        self.assertEqual(resp.status_code, 400)

    @patch('app.trive.routes.upload_init', return_value=SHIFT_DATA)
    @patch('app.trive.routes.check_file_exists', return_value=True)
    def test_wlf_missing_tg_returns_400(self, _exists, _upload):
        body = {
            'shift_file_name': 'shift.txt',
            'transform_method': 'WLF',
            # Tg intentionally omitted
        }
        resp = self._post(body)
        self.assertEqual(resp.status_code, 400)

    @patch('app.trive.routes.fit_hybrid_coefficients')
    @patch('app.trive.routes.search_hybrid_tc',
           return_value=SEARCH_RETURNED)
    @patch('app.trive.routes.upload_init', return_value=SHIFT_DATA)
    @patch('app.trive.routes.check_file_exists', return_value=True)
    def test_hybrid_missing_tc_searches_and_reports_the_chosen_tc(
            self, _exists, _upload, mock_search, mock_fit):
        """Hybrid with no TC answers with the searched fit, under the same
        response keys as a fit at a supplied TC."""
        body = {
            'shift_file_name': 'shift.txt',
            'transform_method': 'hybrid',
            # TC intentionally omitted
        }
        resp = self._post(body)
        self.assertEqual(resp.status_code, 200)
        mock_search.assert_called_once()
        mock_fit.assert_not_called()
        self.assertEqual(json.loads(resp.data), {
            'transform_method': 'hybrid',
            'Tg': None,
            'C1': C1_RETURNED,
            'C2': C2_RETURNED,
            'Ea': EA_RETURNED,
            'TC': TC_SEARCHED,
            'a_T_ref': A_T_REF_RETURNED,
            'chi2_reduced': CHI2_RETURNED,
        })

    def _search_arguments(self, mock_search):
        """The arguments of the mocked call, however the route spelled them."""
        args, kwargs = mock_search.call_args
        return inspect.signature(
            trive.search_hybrid_tc).bind(*args, **kwargs).arguments

    @patch('app.trive.routes.search_hybrid_tc',
           return_value=SEARCH_RETURNED)
    @patch('app.trive.routes.upload_init', return_value=SHIFT_DATA)
    @patch('app.trive.routes.check_file_exists', return_value=True)
    def test_hybrid_missing_tc_holds_values_in_the_body(
            self, _exists, _upload, mock_search):
        """The rule that a value in the body is held also binds the search."""
        resp = self._post({
            'shift_file_name': 'shift.txt',
            'transform_method': 'hybrid',
            'C1': 14.0,
            'Ea': 60.0,
        })
        self.assertEqual(resp.status_code, 200)
        arguments = self._search_arguments(mock_search)
        self.assertEqual(arguments['C1'], 14.0)
        self.assertEqual(arguments['Ea'], 60.0)
        self.assertIs(arguments['fix_C1'], True)
        self.assertIs(arguments['fix_Ea'], True)
        self.assertIsNone(arguments.get('C2'))
        self.assertFalse(arguments.get('fix_C2', False))

    @patch('app.trive.routes.search_hybrid_tc',
           return_value=SEARCH_RETURNED)
    @patch('app.trive.routes.upload_init',
           return_value=SHIFT_DATA_WITH_ERROR)
    @patch('app.trive.routes.check_file_exists', return_value=True)
    def test_hybrid_missing_tc_passes_error_column_as_sigma(
            self, _exists, _upload, mock_search):
        resp = self._post({
            'shift_file_name': 'shift.txt',
            'transform_method': 'hybrid',
        })
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(
            list(self._search_arguments(mock_search)['sigma_a_T']),
            list(SHIFT_DATA_WITH_ERROR['Error']))

    @patch('app.trive.routes.search_hybrid_tc',
           side_effect=ValueError('Too few temperatures to search for Tc'))
    @patch('app.trive.routes.upload_init', return_value=SHIFT_DATA)
    @patch('app.trive.routes.check_file_exists', return_value=True)
    def test_hybrid_search_value_error_returns_400_with_its_message(
            self, _exists, _upload, _search):
        resp = self._post({
            'shift_file_name': 'shift.txt',
            'transform_method': 'hybrid',
        })
        self.assertEqual(resp.status_code, 400)
        self.assertEqual(json.loads(resp.data)['message'],
                         'Too few temperatures to search for Tc')

    @patch('app.trive.routes.fit_hybrid_coefficients',
           return_value=(C1_RETURNED, C2_RETURNED, EA_RETURNED,
                         A_T_REF_RETURNED, CHI2_RETURNED))
    @patch('app.trive.routes.search_hybrid_tc')
    @patch('app.trive.routes.upload_init', return_value=SHIFT_DATA)
    @patch('app.trive.routes.check_file_exists', return_value=True)
    def test_hybrid_supplied_tc_is_fit_at_and_never_searched(
            self, _exists, _upload, mock_search, mock_fit):
        """Any TC in the body, zero included, keeps the fixed-Tc fit."""
        for TC in (25.0, 0.0):
            with self.subTest(TC=TC):
                resp = self._post(self._base_hybrid_body(TC=TC))
                self.assertEqual(resp.status_code, 200)
                self.assertEqual(mock_fit.call_args[1].get('TC'), TC)
                self.assertEqual(json.loads(resp.data)['TC'], TC)
        mock_search.assert_not_called()

    @patch('app.trive.routes.upload_init', return_value=None)
    @patch('app.trive.routes.check_file_exists', return_value=True)
    def test_empty_shift_file_returns_400(self, _exists, _upload):
        resp = self._post(self._base_wlf_body())
        self.assertEqual(resp.status_code, 400)


class TestExtractRouteSolverTimeout(unittest.TestCase):
    """
    POST /tri-ve/extract/ answers 400 with the solver's message when the
    smoothed Prony fit runs out of time. The fit is patched to raise, so this
    pins the wiring only; the budget itself is tested in
    test_prony.TestNewtonWatchdog.
    """

    MESSAGE = ('The fit did not converge within 1 second at a relaxation '
               'grid size of 41. Lower the relaxation grid size, or raise '
               'the smoothness or the assumed error.')

    @classmethod
    def setUpClass(cls):
        Config.SECRET_KEY = 'test-secret'
        cls.app = make_app()
        cls.client = cls.app.test_client()
        cls.token = make_token()
        cls.headers = {'Authorization': f'Bearer {cls.token}',
                       'Content-Type': 'application/json'}

    @patch('app.trive.routes.upload_init')
    @patch('app.trive.routes.check_file_exists', return_value=True)
    def test_solver_timeout_returns_400_with_message(self, _exists, upload):
        from app.trive.fit import SmoothPronyFitTimeout
        omega = np.logspace(0.0, 2.0, 20)
        upload.return_value = {
            'Frequency': omega,
            'E Storage': 1e3 + 1e6 * omega ** 2 / (1 + omega ** 2),
            'E Loss': 1e6 * omega / (1 + omega ** 2),
        }
        with patch('app.trive.chart.smooth_prony_fit',
                   side_effect=SmoothPronyFitTimeout(self.MESSAGE)):
            resp = self.client.post(
                '/tri-ve/extract/',
                data=json.dumps({'file_name': 'data.txt',
                                 'number_of_prony': 41,
                                 'smoothness': 0.3}),
                headers=self.headers,
            )
        self.assertEqual(resp.status_code, 400)
        self.assertEqual(json.loads(resp.data)['message'], self.MESSAGE)


if __name__ == '__main__':
    unittest.main()
