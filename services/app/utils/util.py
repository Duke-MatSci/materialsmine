import os
from typing import Any, Dict
from app.config import Config
from functools import wraps
from flask import request, jsonify
import jwt
import pandas as pd
import datetime
from flask import current_app as app

# Function to filter missing required request input
def filter_none(**kwargs):
    # type: (Any) -> Dict[str, Any]
    """Make dict excluding None values."""
    return {k: v for k, v in kwargs.items() if v is None}


def check_extension(filename):
    print("filename", filename)
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in Config.ALLOWED_EXTENSIONS

def upload_init(file_name):
    try:
        file_path = os.path.join(Config.FILES_DIRECTORY, file_name) 
        extension = os.path.splitext(file_name)[1].lower()  # Get the file extension
        
        if extension == '.csv':
            delimiter = ','
        elif extension == '.tsv':
            delimiter = '\t'
        else:
            raise ValueError("Unsupported file extension")
        
        df = pd.read_csv(file_path, delimiter=delimiter, header=None)
        if df.empty:
            raise ValueError('File is empty')
        df.columns =['Frequency', 'E Storage', 'E Loss']
        return df.to_dict("records")
    except pd.errors.ParserError as pe:
        raise ValueError("Failed to parse file content")

# Decorator
def token_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
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
            print(response)
            return response
        except jwt.ExpiredSignatureError:
            print('it is an error 1')
            return jsonify({'message': 'Token has expired'}), 401
        except jwt.InvalidTokenError:
            print('it is an error 2')
            return jsonify({'message': 'Invalid token'}), 401
    return decorated_function


def request_logger(func):
    @wraps(func)
    def decorated_function(*args, **kwargs):
        start_time = datetime.datetime.now()
        app.logger.info(f"Entering {func.__name__} function at {start_time}. Request: {request.url}")
        response = func(*args, **kwargs)
        end_time = datetime.datetime.now()
        execution_time = end_time - start_time
        # Check if a response is sent back
        if response:
            app.logger.info(f"Exiting {func.__name__} function at {end_time}. Execution time: {execution_time}. Response sent.")
        else:
            app.logger.info(f"Exiting {func.__name__} function at {end_time}. Execution time: {execution_time}. No response sent.")
        return response
    return decorated_function