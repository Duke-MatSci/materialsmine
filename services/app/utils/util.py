import os
from typing import Any, Dict
from app.config import Config
from functools import wraps
from flask import request, jsonify, current_app as app
import jwt
import pandas as pd
import datetime
import functools


def log_errors(func):
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        try:
            return func(*args, **kwargs)
        except Exception as e:
            func_name = func.__name__
            app.logger.info(f"Error in {func_name} function: {e}")
            raise
    return wrapper

# Function to filter missing required request input
def filter_none(**kwargs):
    # type: (Any) -> Dict[str, Any]
    """Make dict excluding None values."""
    return {k: v for k, v in kwargs.items() if v is None}


def check_extension(filename):
    """
    Check if the given filename has a valid extension.

    Parameters:
        filename (str): The name of the file to check.

    Returns:
        bool: True if the filename has a valid extension, False otherwise.
    """
    print("filename", filename)
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in Config.ALLOWED_EXTENSIONS

@log_errors
def upload_init(file_name):
    """
    Uploads a file and returns its content as a dictionary.
    
    Args:
        file_name (str): The name of the file to be uploaded.
        
    Returns:
        dict: The content of the file as a dictionary.
        
    Raises:
        ValueError: If the file extension is not supported.
        ValueError: If the file is empty.
        ValueError: If there is an error parsing the file content.
    """
    try:
        file_path = os.path.join(Config.FILES_DIRECTORY, file_name) 
        extension = os.path.splitext(file_name)[1].lower()  # Get the file extension
        
        if extension == '.csv':
            delimiter = ','
        elif extension == '.tsv' or extension == '.txt':
            delimiter = '\t'
        else:
            raise ValueError("Unsupported file extension")
        
        df = pd.read_csv(file_path, delimiter=delimiter, header=None)
        if df.empty:
            raise ValueError('File is empty')
        df.columns =['Frequency', 'E Storage', 'E Loss']
        return df.to_dict("records")
    except pd.errors.EmptyDataError as e:
        raise ValueError("File is Empty")
    except Exception as pe:
        raise ValueError("Failed to parse file content")

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
        token = request.headers.get('Authorization')[7:]
        if not token:
            return jsonify({'message': 'Token is missing'}), 401
        try:
            decoded = jwt.decode(token, Config.SECRET_KEY, algorithms=['HS256'])
            request_id = decoded.get('reqId')
            if not request_id:
                return jsonify({'message': 'Invalid token or missing field'}), 401
            # Pass the request_id field value to the function
            response = f(request_id, *args, **kwargs)
            return response
        except jwt.ExpiredSignatureError:
            return jsonify({'message': 'Token has expired'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'message': 'Invalid token'}), 401
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
        start_time = datetime.datetime.now()
        json_payload = request.get_json()
        if json_payload:
            app.logger.info(f"[START]: Entering {func.__name__} function at {start_time}. Request payload: {json_payload}")
        response = func(*args, **kwargs)
        end_time = datetime.datetime.now()
        execution_time = ((end_time - start_time).total_seconds()) * 1000
        # Check if a response is sent back
        if response:
            app.logger.info(f"[END]: Request Successful. Exiting {func.__name__} function at {end_time}. Execution time: {execution_time} miliseconds. Response sent.")
        else:
            app.logger.error(f"[INTERNAL ERROR]: Error in {func.__name__}. Response: {response}, Status code: {response.status_code}. Exiting at {end_time}. Execution time: {execution_time} miliseconds.")
        return response
    return decorated_function