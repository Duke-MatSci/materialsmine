"""
Directories of the data files the Tri-VE tests upload. Underscore-prefixed so
it is never collected as a test module, and free of app imports so the pure
math suites can use it.
"""
import os

_SERVICES_DIR = os.path.join(os.path.dirname(__file__), '..', '..')

# The data files shipped with the Tri-VE service: services/app/trive/files.
TRIVE_FILES_DIR = os.path.abspath(os.path.join(
    _SERVICES_DIR, 'app', 'trive', 'files',
))

# The frontend's example master curves: app/public/docs/dynamfit.
DYNAMFIT_DIR = os.path.abspath(os.path.join(
    _SERVICES_DIR, '..', 'app', 'public', 'docs', 'dynamfit',
))
