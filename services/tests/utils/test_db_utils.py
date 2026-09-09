from unittest import TestCase, main
from unittest.mock import patch, Mock
import json

# Assuming Flask setup as follows
from flask import Flask, current_app
app = Flask(__name__)

class TestSendPostRequest(TestCase):
    def setUp(self):
        self.collection = 'test_collection'
        self.action = 'test_action'
        self.payload = {'key': 'value'}
        self.jwt_token = 'mock_jwt'
        self.request_id = 'mock_request_id'
        # Derive the expected URL from the same Config.API_SERVICES that
        # db_utils.baseURL is built from, so the assertion holds regardless of
        # the API_URL env (docker proxy vs. the restful:3001 default) instead of
        # pinning one environment's value.
        from app.config import Config
        self.url = f'{Config.API_SERVICES}/mn/db/{self.collection}'
        self.headers = {
            'Authorization': f'Bearer {self.jwt_token}',
            'Content-Type': 'application/json'
        }
        self.data = {
            'action': self.action,
            'findBy': self.payload
        }
        # Setting up Flask app context for each test
        self.ctx = app.app_context()
        self.ctx.push()

    def tearDown(self):
        # Popping the Flask app context after each test
        self.ctx.pop()

    @patch('app.utils.db_utils.generate_jwt', return_value=('mock_jwt', 'mock_request_id'))
    @patch('requests.post')
    def test_send_post_request_success_matching_id(self, mock_post, mock_generate_jwt):
        mock_response = Mock()
        mock_response.json.return_value = {'data': 'success'}
        mock_response.headers = {'responseid': 'mock_request_id'}
        mock_response.status_code = 200
        mock_post.return_value = mock_response

        from app.utils.db_utils import send_post_request
        response = send_post_request(self.collection, self.action, self.payload)

        mock_post.assert_called_once_with(self.url, json=self.data, headers=self.headers)
        self.assertEqual(response, {'data': 'success'})

    @patch('app.utils.db_utils.generate_jwt', return_value=('mock_jwt', 'mock_request_id'))
    @patch('requests.post')
    def test_send_post_request_failure_mismatch_id(self, mock_post, mock_generate_jwt):
        mock_response = Mock()
        mock_response.json.return_value = {'data': 'success'}
        mock_response.headers = {'responseid': 'incorrect_id'}
        mock_response.status_code = 200
        mock_post.return_value = mock_response

        from app.utils.db_utils import send_post_request
        response = send_post_request(self.collection, self.action, self.payload)

        mock_post.assert_called_once_with(self.url, json=self.data, headers=self.headers)
        self.assertIsNone(response)

if __name__ == '__main__':
    main()
    