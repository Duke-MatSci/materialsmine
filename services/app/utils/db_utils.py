import requests # type: ignore
from app.config import Config
from app.utils.util import generate_jwt
from flask import current_app as app # type: ignore


baseURL= Config.API_SERVICES + '/mn/db'


def send_post_request(collection, action, payload):
    jwt_token, request_id = generate_jwt()
    """
    Sends a POST request to the specified URL with the given data and JWT token.
    Args:
        collection (str): The collection or endpoint to target on the server.
        action (str): The action to be performed on the server.
        payload (dict): The data to be sent in the POST request.
    Returns:
        response: The response from the server as a dictionary if response is JSON, otherwise raw response.
    """
    headers = {
        'Authorization': f'Bearer {jwt_token}',
        'Content-Type': 'application/json'
    }

    data = {
        'action': action,
        'findBy': payload
    }
    url = f'{baseURL}/{collection}'
    try:
        response = requests.post(url, json=data, headers=headers)
        response_data = response.json()  # Assuming server always returns JSON

        if response.status_code == 200:
            if response.headers.get('responseid') == request_id:
                return response_data
            else:
                app.logger.error(f"{collection} Response ID mismatch")
        else:
            app.logger.error(f"{collection} Operation Failed with message: {response_data.get('message')}")
            raise ValueError(response_data.get('message'))
    except requests.RequestException as e:
        app.logger.error(f"Request failed: {str(e)}")

    return None


def seedDatabase(collection, action, payload):
    jwt_token, request_id = generate_jwt()
    headers = {
        'Authorization': f'Bearer {jwt_token}',
        'Content-Type': 'application/json'
    }

    data = {
        'action': action,
        'payload': payload
    }
    url = f'{baseURL}/{collection}'
    try:
        response = requests.post(url, json=data, headers=headers)
        response_data = response.json()  # Assuming server always returns JSON

        if response.status_code == 200:
            if response.headers.get('ResponseID') == request_id:
                app.logger.info(f"{collection} Data Seeded Successfully")
                return response_data
            else:
                app.logger.error(f"{collection} Response ID mismatch")
                raise ValueError(f"{collection} Response ID mismatch")
        else:
            app.logger.error(f"{collection} Operation Failed with message: {response_data.get('message')}")
            raise ValueError(response_data.get('message'))
    except requests.RequestException as e:
        app.logger.error(f"Request failed: {str(e)}")

    return None  # Explicitly return None if no conditions match or request fails