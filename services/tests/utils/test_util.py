import unittest
from unittest.mock import patch
import os
os.environ['OPENBLAS_NUM_THREADS'] = '1'
import tempfile
import numpy as np
import sys
import jwt

# Append the directory above 'test' to sys.path to find the 'app' module
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))

from app.utils.util import upload_init, decode_jwt, generate_jwt
from app.config import Config


class TestUploadInit(unittest.TestCase):
    """
    Tests for upload_init() — reads CSV/TSV/TXT files and returns dicts of
    1-D float arrays keyed by domain-specific column names.

    Each test writes a small file to a temporary directory and points
    Config.FILES_DIRECTORY at it.
    """

    @classmethod
    def setUpClass(cls):
        cls._tmpdir = tempfile.TemporaryDirectory()
        cls._original_files_dir = Config.FILES_DIRECTORY
        Config.FILES_DIRECTORY = cls._tmpdir.name

    @classmethod
    def tearDownClass(cls):
        Config.FILES_DIRECTORY = cls._original_files_dir
        cls._tmpdir.cleanup()

    def _write(self, name, content):
        with open(os.path.join(Config.FILES_DIRECTORY, name), 'w') as f:
            f.write(content)
        return name

    def test_parses_canonical_frequency_csv(self):
        name = self._write(
            'ok.csv',
            "Frequency,E Storage,E Loss\n1,100,10\n2,200,20\n3,300,30\n",
        )
        result = upload_init(name, 'frequency')
        self.assertEqual(set(result.keys()), {'Frequency', 'E Storage', 'E Loss'})
        np.testing.assert_array_equal(result['Frequency'], [1.0, 2.0, 3.0])
        np.testing.assert_array_equal(result['E Storage'], [100.0, 200.0, 300.0])
        np.testing.assert_array_equal(result['E Loss'], [10.0, 20.0, 30.0])

    def test_parses_tsv(self):
        name = self._write(
            'ok.tsv',
            "Frequency\tE Storage\tE Loss\n1\t100\t10\n2\t200\t20\n",
        )
        result = upload_init(name, 'frequency')
        self.assertEqual(set(result.keys()), {'Frequency', 'E Storage', 'E Loss'})

    def test_parses_txt_as_tab_delimited(self):
        name = self._write(
            'ok.txt',
            "Frequency\tE Storage\tE Loss\n1\t100\t10\n2\t200\t20\n",
        )
        result = upload_init(name, 'frequency')
        self.assertEqual(set(result.keys()), {'Frequency', 'E Storage', 'E Loss'})

    def test_parses_space_delimited_txt(self):
        # numpy savetxt and instrument shift-factor exports are space-delimited;
        # .txt must accept any whitespace (space or tab), not only tabs.
        name = self._write('shift.txt', "-10 5.0e12\n0 1.2e12\n25 1.7e9\n")
        result = upload_init(name, 'shift')
        self.assertEqual(set(result.keys()), {'Temperature', 'a_T'})
        np.testing.assert_array_equal(result['Temperature'], [-10.0, 0.0, 25.0])

    def test_skips_leading_blank_line_in_whitespace_txt(self):
        # A blank line splits to [] on whitespace; the is_numeric_row empty-row
        # guard must not mistake it for the start of the numeric data.
        name = self._write('blank.txt', "\n1 100 10\n2 200 20\n")
        result = upload_init(name, 'frequency')
        np.testing.assert_array_equal(result['Frequency'], [1.0, 2.0])

    def test_sorts_rows_by_first_column(self):
        name = self._write(
            'unsorted.csv',
            "Frequency,E Storage,E Loss\n3,300,30\n1,100,10\n2,200,20\n",
        )
        result = upload_init(name, 'frequency')
        np.testing.assert_array_equal(result['Frequency'], [1.0, 2.0, 3.0])

    def test_skips_non_numeric_header_rows(self):
        name = self._write(
            'header.csv',
            "# comment\nFrequency,E Storage,E Loss\n1,100,10\n2,200,20\n",
        )
        result = upload_init(name, 'frequency')
        np.testing.assert_array_equal(result['Frequency'], [1.0, 2.0])

    def test_parses_file_with_non_utf8_bytes_in_header(self):
        # Instrument exports are often Windows-1252/Latin-1, e.g. a degree
        # sign (0xB0) in a "Temperature (°C)" header. Strict UTF-8 decoding
        # used to crash readlines() here; the header is non-numeric and gets
        # skipped, so the numeric rows must still parse.
        path = os.path.join(Config.FILES_DIRECTORY, 'latin1.csv')
        with open(path, 'wb') as f:
            f.write('Frequency,E Storage (°C),E Loss\n'.encode('latin-1'))
            f.write(b'1,100,10\n2,200,20\n')
        result = upload_init('latin1.csv', 'frequency')
        self.assertEqual(set(result.keys()), {'Frequency', 'E Storage', 'E Loss'})
        np.testing.assert_array_equal(result['Frequency'], [1.0, 2.0])

    def test_parses_excel_export_with_bom_trailing_commas_and_crlf(self):
        # The shape Excel actually writes: UTF-8 BOM, CRLF, and a trailing
        # comma on every row. The empty last field made is_numeric_row reject
        # every line, so a perfectly good file reported "No numeric rows".
        path = os.path.join(Config.FILES_DIRECTORY, 'excel.csv')
        with open(path, 'wb') as f:
            f.write(b'\xef\xbb\xbf1,100,10,\r\n2,200,20,\r\n')
        result = upload_init('excel.csv', 'frequency')
        self.assertEqual(set(result.keys()), {'Frequency', 'E Storage', 'E Loss'})
        np.testing.assert_array_equal(result['Frequency'], [1.0, 2.0])

    def test_bom_does_not_drop_first_data_row(self):
        # The BOM glues onto the first field, so float() rejects it and the row
        # reads as a header — silently losing a data point rather than failing.
        path = os.path.join(Config.FILES_DIRECTORY, 'bom.csv')
        with open(path, 'wb') as f:
            f.write(b'\xef\xbb\xbf1,100,10\n2,200,20\n')
        result = upload_init('bom.csv', 'frequency')
        np.testing.assert_array_equal(result['Frequency'], [1.0, 2.0])

    def test_trailing_delimiter_with_header_row_still_skips_header(self):
        name = self._write(
            'trailing_header.csv',
            "Frequency,E Storage,E Loss,\n1,100,10,\n2,200,20,\n",
        )
        result = upload_init(name, 'frequency')
        np.testing.assert_array_equal(result['E Loss'], [10.0, 20.0])

    def test_trailing_tab_in_tsv_is_dropped(self):
        name = self._write('trailing.tsv', "1\t100\t10\t\n2\t200\t20\t\n")
        result = upload_init(name, 'frequency')
        np.testing.assert_array_equal(result['E Storage'], [100.0, 200.0])

    def test_shift_domain_returns_2col_dict(self):
        name = self._write('shift.csv', "Temperature,a_T\n0,0.5\n25,1.0\n")
        result = upload_init(name, 'shift')
        self.assertEqual(set(result.keys()), {'Temperature', 'a_T'})

    def test_unknown_domain_raises_value_error(self):
        name = self._write('ok.csv', "1,2,3\n")
        with self.assertRaisesRegex(ValueError, 'Unknown domain'):
            upload_init(name, 'garbage')

    def test_unsupported_extension_raises_value_error(self):
        with self.assertRaisesRegex(ValueError, 'Unsupported file extension'):
            upload_init('file.xlsx', 'frequency')

    def test_empty_file_raises_value_error(self):
        name = self._write('empty.csv', "")
        with self.assertRaisesRegex(ValueError, 'is empty'):
            upload_init(name, 'frequency')

    def test_no_numeric_rows_raises_value_error(self):
        name = self._write('text.csv', "this is\njust text\n")
        with self.assertRaisesRegex(ValueError, 'No numeric rows'):
            upload_init(name, 'frequency')

    def test_wrong_column_count_raises_value_error(self):
        # 2-column file for frequency domain (needs 3, 4, or 5).
        name = self._write('2col.csv', "Frequency,E Storage\n1,100\n2,200\n")
        with self.assertRaisesRegex(ValueError, 'columns'):
            upload_init(name, 'frequency')

    def test_single_column_raises_value_error(self):
        # The np.loadtxt(unpack=True) 1-D promotion path: previously silently
        # truncated; should now surface the column-count mismatch.
        name = self._write('1col.csv', "Frequency\n1\n2\n3\n")
        with self.assertRaisesRegex(ValueError, 'columns'):
            upload_init(name, 'frequency')

    def test_six_columns_raises_value_error(self):
        name = self._write('6col.csv', "a,b,c,d,e,f\n1,2,3,4,5,6\n7,8,9,10,11,12\n")
        with self.assertRaisesRegex(ValueError, 'columns'):
            upload_init(name, 'frequency')

    def test_frequency_accepts_5_columns_with_per_modulus_errors(self):
        name = self._write(
            '5col.csv',
            "Frequency,E Storage,E Loss,E Storage Error,E Loss Error\n"
            "1,100,10,5,0.5\n"
            "2,200,20,10,1.0\n"
            "3,300,30,15,1.5\n",
        )
        result = upload_init(name, 'frequency')
        self.assertEqual(
            set(result.keys()),
            {'Frequency', 'E Storage', 'E Loss', 'E Storage Error', 'E Loss Error'},
        )
        np.testing.assert_array_equal(result['Frequency'], [1.0, 2.0, 3.0])
        np.testing.assert_array_equal(result['E Storage Error'], [5.0, 10.0, 15.0])
        np.testing.assert_array_equal(result['E Loss Error'], [0.5, 1.0, 1.5])

    def test_frequency_accepts_4_columns_with_shared_error(self):
        name = self._write(
            '4col.csv',
            "Frequency,E Storage,E Loss,Error\n1,100,10,5\n2,200,20,10\n",
        )
        result = upload_init(name, 'frequency')
        self.assertEqual(
            set(result.keys()),
            {'Frequency', 'E Storage', 'E Loss', 'Error'},
        )
        np.testing.assert_array_equal(result['Error'], [5.0, 10.0])

    def test_temperature_accepts_5_columns_with_per_modulus_errors(self):
        name = self._write(
            'temp5.csv',
            "Temperature,E Storage,E Loss,E Storage Error,E Loss Error\n"
            "0,100,10,5,0.5\n"
            "25,200,20,10,1.0\n",
        )
        result = upload_init(name, 'temperature')
        self.assertEqual(
            set(result.keys()),
            {'Temperature', 'E Storage', 'E Loss', 'E Storage Error', 'E Loss Error'},
        )

    def test_shift_accepts_3_columns_with_extra(self):
        # Shift-factor files may carry an extra Error column for symmetry with
        # the data files; the value is parsed but the fit doesn't consume it.
        name = self._write(
            'shift3.csv',
            "Temperature,a_T,Error\n0,0.5,0.05\n25,1.0,0.1\n",
        )
        result = upload_init(name, 'shift')
        self.assertEqual(set(result.keys()), {'Temperature', 'a_T', 'Error'})
        np.testing.assert_array_equal(result['Error'], [0.05, 0.1])

    def test_shift_error_column_with_zero_is_accepted(self):
        # update_line_chart rejects non-positive error columns on DATA files,
        # but that check must not migrate into upload_init: the shift domain's
        # Error column is never consumed (tts_temperature_to_frequency_V2 and
        # fit_wlf_coefficients read only Temperature and a_T), so validating it
        # here would reject shift files that work today.
        name = self._write(
            'shift3zero.csv',
            "Temperature,a_T,Error\n0,0.5,0\n25,1.0,0.1\n",
        )
        result = upload_init(name, 'shift')
        self.assertEqual(result['Error'][0], 0.0)

    def test_frequency_zero_error_column_parses_without_validation(self):
        # upload_init is a shape-and-parse reader; semantic validation of the
        # error columns belongs to update_line_chart. Pins that layering.
        name = self._write(
            '4colzero.csv',
            "Frequency,E Storage,E Loss,Error\n1,100,10,0\n2,200,20,10\n",
        )
        result = upload_init(name, 'frequency')
        np.testing.assert_array_equal(result['Error'], [0.0, 10.0])

    def test_missing_file_raises_file_not_found(self):
        # FileNotFoundError propagates as itself; the route is expected to
        # call check_file_exists() before invoking upload_init.
        with self.assertRaises(FileNotFoundError):
            upload_init('nonexistent.csv', 'frequency')

    def test_mid_file_non_numeric_raises_value_error(self):
        # First row is numeric so np.loadtxt starts there; the later
        # non-numeric row breaks the parse.
        name = self._write('mix.csv', "1,2,3\ntext,is,here\n4,5,6\n")
        with self.assertRaisesRegex(ValueError, 'parse'):
            upload_init(name, 'frequency')

class TestDecodeJwt(unittest.TestCase):
    @patch.object(Config, 'SECRET_KEY', 'test-secret-key')
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