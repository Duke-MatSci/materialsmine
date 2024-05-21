import unittest
from unittest.mock import patch, mock_open
import os
import pandas as pd
import sys
import jwt

# Append the directory above 'test' to sys.path to find the 'app' module
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))

from app.utils.util import upload_init, decode_jwt, generate_jwt
from app.config import Config

class TestUploadInit(unittest.TestCase):
    def setUp(self):
        # Create a test file path and name
        self.filename = 'test.csv'
        self.filepath = os.path.join(Config.FILES_DIRECTORY, self.filename)
        self.valid_content = "Frequency,E StoragAe,E Loss\n1,2,3\n4,5,6"

    @patch('pandas.read_csv')
    def test_upload_init_valid_file(self, mock_read_csv):
        # Mocking the pandas read_csv function to return a DataFrame
        df = pd.DataFrame({
            "Frequency": [1, 4],
            "E Storage": [2, 5],
            "E Loss": [3, 6]
        })
        mock_read_csv.return_value = df
        # Test the function
        result = upload_init(self.filename)
        self.assertIsInstance(result, list)

class TestDecodeJwt(unittest.TestCase):
    def test_decode_jwt_valid(self):
        # Generate a valid JWT for testing
        token, request_id = generate_jwt()
        # Decode the JWT
        result = decode_jwt(token)
        self.assertEqual(result['requestid'], request_id)

    @patch('jwt.decode', side_effect=jwt.ExpiredSignatureError)
    def test_decode_jwt_expired(self, mock_decode):
        token = 'expired_jwt_token'
        result = decode_jwt(token)
        self.assertEqual(result, 'Token has expired')

    @patch('jwt.decode', side_effect=jwt.InvalidTokenError)
    def test_decode_jwt_invalid(self, mock_decode):
        token = 'invalid_jwt_token'
        result = decode_jwt(token)
        self.assertEqual(result, 'Invalid token')

if __name__ == '__main__':
    unittest.main()