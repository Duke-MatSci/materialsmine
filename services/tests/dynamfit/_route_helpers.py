"""
Shared fixtures for the dynamfit Flask route tests (test_routes,
test_routes_e2e). Underscore-prefixed so it is never collected as a test module.

Builds a minimal Flask app registering only the dynamfit blueprint — this
avoids the FileHandler('/services/services_app.log') crash that create_app()
would hit outside the docker container.
"""
import os
os.environ['OPENBLAS_NUM_THREADS'] = '1'
import sys
import datetime
import numpy as np
import jwt
from flask import Flask

# Append the directory above 'tests' to sys.path to find the 'app' module
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))

from app.dynamfit.routes import dynamfit


# Real fixture data shipped in the repo, used by the end-to-end route tests.
REAL_FILES_DIR = os.path.abspath(os.path.join(
    os.path.dirname(__file__), '..', '..', 'app', 'dynamfit', 'files',
))


def make_app():
    """
    Build a minimal Flask test app that registers only the dynamfit blueprint,
    avoiding the FileHandler('/services/services_app.log') crash in create_app().
    SECRET_KEY is fixed so we can mint tokens without an .env file.
    """
    app = Flask(__name__)
    app.config['SECRET_KEY'] = 'test-secret'
    app.config['TESTING'] = True
    app.register_blueprint(dynamfit)
    return app


def make_token(secret='test-secret', req_id='test-req-id'):
    """Mint a JWT with the reqId field that token_required expects."""
    payload = {
        'reqId': req_id,
        'exp': datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(seconds=600),
    }
    return jwt.encode(payload, secret, algorithm='HS256')


# Synthetic shift data (5 points, all positive a_T) used across mocked tests.
SHIFT_T = np.array([0.0, 10.0, 20.0, 30.0, 40.0])
SHIFT_A_T = np.array([3.0, 2.0, 1.0, 0.5, 0.25])
SHIFT_DATA = {'Temperature': SHIFT_T, 'a_T': SHIFT_A_T}

# Representative WLF coefficients returned by the mocked fit functions.
C1_RETURNED = 14.0
C2_RETURNED = 45.0
EA_RETURNED = 80.0
A_T_REF_RETURNED = 1.0
