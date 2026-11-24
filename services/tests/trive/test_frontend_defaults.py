"""
The Python fit defaults mirror app/src/composables/useDynamfitDefaults.ts.
The managedservices image holds only services/, so this skips there.

    python -m unittest tests.trive.test_frontend_defaults
"""
import os
import re
import sys
import unittest

# Append the directory above 'tests' to sys.path to find the 'app' module
sys.path.append(
    os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))

from app.trive import (
    PRONY_TERMS_MAX, PRONY_TERMS_MIN, PRONY_TERMS_PER_DECADE,
    RELATIVE_ERROR_DEFAULT, SMOOTHNESS_DEFAULT,
)

from ._paths import FRONTEND_DEFAULTS_TS

_EXPORT = re.compile(r'^export const (\w+) = ([-+\d.eE]+);', re.MULTILINE)


@unittest.skipUnless(os.path.isfile(FRONTEND_DEFAULTS_TS),
                     'frontend source not in this checkout')
class TestFrontendDefaults(unittest.TestCase):
    """Each Python default equals the frontend constant it mirrors."""

    @classmethod
    def setUpClass(cls):
        with open(FRONTEND_DEFAULTS_TS, encoding='utf-8') as f:
            cls.ts = {name: float(value)
                      for name, value in _EXPORT.findall(f.read())}

    def _ts(self, name):
        self.assertIn(name, self.ts,
                      f'export const {name} not found in the frontend file')
        return self.ts[name]

    def test_python_defaults_match_the_frontend(self):
        """Smoothness and the grid-size constants are equal on both sides."""
        for name, value in (
            ('SMOOTHNESS_DEFAULT', SMOOTHNESS_DEFAULT),
            ('PRONY_TERMS_PER_DECADE', PRONY_TERMS_PER_DECADE),
            ('PRONY_TERMS_MIN', PRONY_TERMS_MIN),
            ('PRONY_TERMS_MAX', PRONY_TERMS_MAX),
        ):
            with self.subTest(name=name):
                self.assertEqual(value, self._ts(name))

    def test_relative_error_default_is_the_frontend_percent_as_a_fraction(self):
        """The API takes a fraction; the frontend states a percentage."""
        self.assertAlmostEqual(
            RELATIVE_ERROR_DEFAULT,
            self._ts('RELATIVE_ERROR_DEFAULT_PERCENT') / 100,
            delta=1e-12,
        )


if __name__ == '__main__':
    unittest.main()
