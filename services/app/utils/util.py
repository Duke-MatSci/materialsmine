import os
os.environ['OPENBLAS_NUM_THREADS'] = '1'

import numpy as np

from typing import Any, Dict
from app.config import Config
from functools import wraps
from flask import request, jsonify, has_app_context, current_app as app # type: ignore
import jwt # type: ignore
from datetime import datetime, timedelta, timezone
import functools
import uuid


def log_errors(func):
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        try:
            return func(*args, **kwargs)
        except Exception as e:
            if has_app_context():
                app.logger.info(f"Error in {func.__name__} function: {e}")
            raise
    return wrapper

# Function to filter missing required request input
def filter_none(**kwargs):
    # type: (Any) -> Dict[str, Any]
    """Make dict excluding None values."""
    return {k: v for k, v in kwargs.items() if v is None}


@log_errors
def upload_init(file_name, domain):
    """
    Read a tabular data file and return its columns as a dict of 1-D float arrays.

    Reads CSV (.csv), TSV (.tsv), or whitespace-separated (.txt) files,
    skipping non-numeric leading rows (headers/comments). Rows are sorted
    ascending by the first column before return.

    Parameters:
        file_name (str): Filename to load, relative to Config.FILES_DIRECTORY.
        domain (str): Domain tag controlling expected column count and the
            keys of the returned dict. One of:
                'frequency'   → 3 cols: ['Frequency', 'E Storage', 'E Loss']
                'temperature' → 3 cols: ['Temperature', 'E Storage', 'E Loss']
                'shift'       → 2 cols: ['Temperature', 'a_T']

    Returns:
        dict[str, np.ndarray]: Column-name → 1-D float ndarray (all of equal
        length), in the column order listed above for the chosen domain.

    Raises:
        ValueError: If domain is unrecognized, the file extension is not
            supported, the file is missing or empty, no numeric rows are
            found, the file has the wrong number of columns for the chosen
            domain, or the file's numeric contents cannot be parsed as floats.
    """
    columns_by_domain = {
        'frequency':   ['Frequency', 'E Storage', 'E Loss'],
        'temperature': ['Temperature', 'E Storage', 'E Loss'],
        'shift':       ['Temperature', 'a_T'],
    }
    if domain not in columns_by_domain:
        raise ValueError(
            f"Unknown domain {domain!r}. Expected one of {list(columns_by_domain)}."
        )
    columns = columns_by_domain[domain]

    extension = os.path.splitext(file_name)[1].lower()
    if extension == '.csv':
        delimiter = ','
    elif extension in ('.tsv', '.txt'):
        delimiter = '\t'
    else:
        raise ValueError(
            f"Unsupported file extension {extension!r}. Use .csv, .tsv, or .txt."
        )

    file_path = os.path.join(Config.FILES_DIRECTORY, file_name)
    with open(file_path, 'r') as f:
        csvlines = f.readlines()

    if not csvlines:
        raise ValueError(f"File {file_name} is empty.")

    valid_start_index = None
    for i, row in enumerate(csvlines):
        if is_numeric_row(row.strip().split(delimiter)):
            valid_start_index = i
            break
    if valid_start_index is None:
        raise ValueError(f"No numeric rows found in {file_name}.")

    try:
        data = np.loadtxt(
            csvlines, delimiter=delimiter, skiprows=valid_start_index,
            dtype=float, unpack=True,
        )
    except ValueError as e:
        raise ValueError(f"Could not parse numeric data in {file_name}: {e}")

    # np.loadtxt with unpack=True returns 1-D for a single-column file; reshape
    # so data.shape[0] is always the column count.
    if data.ndim == 1:
        data = data.reshape(1, -1)

    if data.shape[0] != len(columns):
        raise ValueError(
            f"Expected {len(columns)} columns for {domain} domain "
            f"({', '.join(columns)}), but {file_name} has {data.shape[0]}."
        )

    sortind = np.argsort(data[0])
    data = data[:, sortind]

    return dict(zip(columns, data))

# Decorator
def token_required(f):
    """
    Decorator that requires a token for authentication.

    Parameters:
    - `f`: The function to be decorated.

    Returns:
    - The decorated function.
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        """
        Decorates a function with JWT authorization.

        Args:
            *args: Variable length argument list.
            **kwargs: Arbitrary keyword arguments.

        Returns:
            The response returned by the decorated function.

        Raises:
            jwt.ExpiredSignatureError: If the token has expired.
            jwt.InvalidTokenError: If the token is invalid.
        """
        header = request.headers.get('Authorization')
        
        if not header or not header.startswith('Bearer '):
            app.logger.warning("Authorization header is missing or invalid")
            return jsonify({'message': 'Authorization header is missing or invalid'}), 401
    
        token = header[7:].strip()
    
        if not token:
            return jsonify({'message': 'Token is missing'}), 401
        try:
            decoded = jwt.decode(token, Config.SECRET_KEY, algorithms=['HS256'])
            request_id = decoded.get('reqId')
            if not request_id:
                app.logger.warning("Invalid token or missing request_id field")
                return jsonify({'message': 'Invalid token or missing field'}), 401
            # Pass the request_id field value to the function
            response = f(request_id, *args, **kwargs)
            return response
        except jwt.ExpiredSignatureError:
            app.logger.warning("Token has expired")
            return jsonify({'message': 'Token has expired'}), 401
        except jwt.InvalidTokenError:
            app.logger.warning("Invalid token")
            return jsonify({'message': 'Invalid token'}), 401
        except Exception as e:
            app.logger.error(f"An unexpected error occurred: {str(e)}")
            return jsonify({'message': 'An unexpected error occurred'}), 500
    return decorated_function


def request_logger(func):
    """
    Decorator function to log requests and responses for a given function.

    Parameters:
        func (function): The function to be decorated.

    Returns:
        function: The decorated function.

    """
    @wraps(func)
    def decorated_function(*args, **kwargs):
        """
        Decorates a function to log the start and end times, request payload, execution time, and response status.

        Parameters:
            *args: Variable length argument list.
            **kwargs: Arbitrary keyword arguments.

        Returns:
            Any: The response from the decorated function.
        """
        start_time = datetime.now()
        try:
            json_payload = request.get_json()
        except Exception:
            json_payload = None
        app.logger.info(f"[START]: Entering {func.__name__} function at {start_time}. Request payload: {json_payload}")
        response = func(*args, **kwargs)
        end_time = datetime.now()
        execution_time = ((end_time - start_time).total_seconds()) * 1000
        # Check if a response is sent back
        if response:
            app.logger.info(f"[END]: Request Successful. Exiting {func.__name__} function at {end_time}. Execution time: {execution_time} miliseconds. Response sent.")
        else:
            app.logger.error(f"[INTERNAL ERROR]: Error in {func.__name__}. Response: {response!r}. Exiting at {end_time}. Execution time: {execution_time} miliseconds.")
        return response
    return decorated_function


# generate JWT with secret key
def generate_jwt(expires_in: int = 600):
    """
    Generates JWT with the payload containing the data

    Args:
        data (dict): The data to be encoded in the JWT
        expires_in (int): The time in seconds after which the JWT expires

    Returns:
        The JWT generated
    """
    # Add expiration time to the payload
    request_id =  str(uuid.uuid4())
    data = {"requestid": request_id}
    data.update({"exp": datetime.now(timezone.utc) + timedelta(seconds=expires_in)})
    return jwt.encode(data, Config.SECRET_KEY, algorithm='HS256'), request_id


# decode JWT with secret key
def decode_jwt(token: str):
    """
    Decodes JWT with the secret key

    Args:
        token (str): The JWT to be decoded

    Returns:
        The decoded JWT
    """
    try:
        return jwt.decode(token, Config.SECRET_KEY, algorithms=['HS256'])
    except jwt.ExpiredSignatureError:
        return "Token has expired"
    except jwt.InvalidTokenError:
        return "Invalid token"
    
def is_numeric_row(row):
    """Check if all values in the row can be converted to float."""
    try:
        [float(val) for val in row]
        return True
    except ValueError:
        return False
