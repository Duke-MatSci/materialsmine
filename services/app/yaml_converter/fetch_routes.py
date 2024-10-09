from flask import Flask, Blueprint, Response, jsonify
import requests


# Create a Blueprint named 'yaml_converter' with a URL prefix '/yaml_converter'
yaml_converter = Blueprint("yaml_converter", __name__, url_prefix="/yaml_converter")


# Define a route that accepts "XML GET" requests
@yaml_converter.route("/fetch_xml/<string:control_id>", methods=["GET"])
def fetch_xml(control_id):

    # Construct the external URL using the provided control_id
    external_url = f"https://qa.materialsmine.org/api/xml/{control_id}?format=xml"
    
    try:
        # Send a GET request to the external URL
        response = requests.get(external_url)
        
        # Check the status code of the response
        if response.status_code == 200:
            # If the request is successful, return the XML content with a message
            xml_content = response.content  # XML content is in bytes
            return Response(xml_content, mimetype='application/xml')
        
        elif response.status_code == 404:
            # If the resource is not found, return a 404 error message
            return jsonify({"message": "Curation sample not found"}), 404
        else:
            # For any other status code, return a generic error message
            return jsonify({"message": "Fetch Failed"}), 500
    
    except requests.exceptions.RequestException as e:
        # If there is a network-related error, return an error message with exception details
        return jsonify({"message": f"An error occurred: {str(e)}"}), 500


