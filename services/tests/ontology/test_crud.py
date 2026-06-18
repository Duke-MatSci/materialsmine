import unittest
from unittest.mock import patch, Mock
import os
import sys

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))

from app.ontology.helpers.crud import delete_np_graphs


class TestDeleteNpGraphs(unittest.TestCase):

    @patch('app.ontology.helpers.crud.requests.post')
    def test_happy_path_clears_discovered_graphs(self, mock_post):
        discovery_response = Mock()
        discovery_response.status_code = 200
        discovery_response.json.return_value = {
            'results': {
                'bindings': [
                    {'g': {'value': 'http://materialsmine.org/np/abc#head'}},
                    {'g': {'value': 'http://materialsmine.org/np/abc#assertion'}},
                    {'g': {'value': 'http://materialsmine.org/np/abc#provenance'}},
                    {'g': {'value': 'http://materialsmine.org/np/abc#pubinfo'}},
                ]
            }
        }

        update_response = Mock()
        update_response.status_code = 200

        mock_post.side_effect = [discovery_response, update_response]

        ok, report = delete_np_graphs('http://materialsmine.org/np/abc')

        self.assertTrue(ok)
        self.assertTrue(report['ok'])
        self.assertEqual(len(report['graphs_deleted']), 4)
        self.assertEqual(mock_post.call_count, 2)

        update_call_data = mock_post.call_args_list[1]
        body = update_call_data[1].get('data') or update_call_data[0][1] if len(update_call_data[0]) > 1 else update_call_data[1]['data']
        body_str = body.decode('utf-8') if isinstance(body, bytes) else body
        self.assertIn('CLEAR SILENT GRAPH', body_str)

    @patch('app.ontology.helpers.crud.requests.post')
    def test_no_graphs_found_returns_ok_true(self, mock_post):
        discovery_response = Mock()
        discovery_response.status_code = 200
        discovery_response.json.return_value = {
            'results': {'bindings': []}
        }
        mock_post.return_value = discovery_response

        ok, report = delete_np_graphs('http://materialsmine.org/np/nonexistent')

        self.assertTrue(ok)
        self.assertEqual(report['graphs_deleted'], [])
        self.assertEqual(mock_post.call_count, 1)

    @patch('app.ontology.helpers.crud.requests.post')
    def test_discovery_failure_returns_error(self, mock_post):
        discovery_response = Mock()
        discovery_response.status_code = 500
        discovery_response.text = 'Internal Server Error'
        mock_post.return_value = discovery_response

        ok, report = delete_np_graphs('http://materialsmine.org/np/abc')

        self.assertFalse(ok)
        self.assertEqual(report['stage'], 'discovery')
        self.assertEqual(report['status'], 500)

    @patch('app.ontology.helpers.crud.requests.post')
    def test_update_failure_returns_error(self, mock_post):
        discovery_response = Mock()
        discovery_response.status_code = 200
        discovery_response.json.return_value = {
            'results': {
                'bindings': [
                    {'g': {'value': 'http://materialsmine.org/np/abc#head'}},
                ]
            }
        }

        update_response = Mock()
        update_response.status_code = 500
        update_response.text = 'Update failed'

        mock_post.side_effect = [discovery_response, update_response]

        ok, report = delete_np_graphs('http://materialsmine.org/np/abc')

        self.assertFalse(ok)
        self.assertEqual(report['graphs_deleted'], [])

    @patch('app.ontology.helpers.crud.requests.post')
    def test_network_error_returns_error(self, mock_post):
        mock_post.side_effect = ConnectionError('Connection refused')

        ok, report = delete_np_graphs('http://materialsmine.org/np/abc')

        self.assertFalse(ok)
        self.assertEqual(report['stage'], 'discovery')
        self.assertIn('Connection refused', report['error'])


if __name__ == '__main__':
    unittest.main()
