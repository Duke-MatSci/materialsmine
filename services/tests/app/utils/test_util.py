import unittest
from ....app.utils.util import check_extension
from app.config import Config

class TestCheckExtension(unittest.TestCase):

    def test_valid_extension(self):
        # Test with a valid filename and allowed extension
        filename = "example.txt"
        result = check_extension(filename)
        self.assertTrue(result)

    def test_invalid_extension(self):
        # Test with a valid filename but not allowed extension
        filename = "example.exe"
        result = check_extension(filename)
        self.assertFalse(result)

    def test_no_extension(self):
        # Test with a filename that has no extension
        filename = "example"
        result = check_extension(filename)
        self.assertFalse(result)

    def test_empty_filename(self):
        # Test with an empty filename
        filename = ""
        result = check_extension(filename)
        self.assertFalse(result)

    def test_multiple_dots_extension(self):
        # Test with a filename having multiple dots
        filename = "example.tar.gz"
        result = check_extension(filename)
        self.assertTrue(result)

    def test_uppercase_extension(self):
        # Test with an uppercase extension
        filename = "example.TXT"
        result = check_extension(filename)
        self.assertTrue(result)

    def test_mixed_case_extension(self):
        # Test with a filename having a mixed case extension
        filename = "example.JpG"
        result = check_extension(filename)
        self.assertTrue(result)

    def test_allowed_extensions_case_insensitive(self):
        # Test with allowed extensions in different cases
        filename = "example.PDF"
        result = check_extension(filename)
        self.assertTrue(result)

    def test_config_not_set(self):
        # Test when Config.ALLOWED_EXTENSIONS is not set
        # This assumes Config is a class or object with ALLOWED_EXTENSIONS attribute
        original_allowed_extensions = Config.ALLOWED_EXTENSIONS
        Config.ALLOWED_EXTENSIONS = None
        filename = "example.txt"
        with self.assertRaises(AttributeError):
            check_extension(filename)
        Config.ALLOWED_EXTENSIONS = original_allowed_extensions

if __name__ == '__main__':
    unittest.main()