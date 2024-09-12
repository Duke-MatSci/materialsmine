from flask import Flask, Blueprint, Response, jsonify, request
import requests
import xml.etree.ElementTree as ET
from collections import OrderedDict
from ruamel.yaml import YAML


# Create a Blueprint named 'yaml_converter' with a URL prefix '/yaml_converter'
yaml_converter = Blueprint("yaml_converter", __name__, url_prefix="/yaml_converter")


# Define a route that accepts "XML GET" requests and converts the XML to YAML
@yaml_converter.route("/<string:control_id>", methods=["GET"])
def fetch_xml(control_id):

    # Check for query parameters to determine which external URL to use
    # Default to 'qa.materialsmine.org', but allow switching to 'materialsmine.org'
    use_production = request.args.get('production', 'false').lower() == 'true'

    if use_production:
        external_url = f"https://materialsmine.org/api/xml/{control_id}?format=xml"
    else:
        external_url = f"https://qa.materialsmine.org/api/xml/{control_id}?format=xml"

    try:
        # Send a GET request to the external URL
        response = requests.get(external_url)

        # Check the status code of the response
        if response.status_code == 200:
            # If the request is successful, parse the XML content
            xml_content = response.content
            xml_tree = ET.ElementTree(ET.fromstring(xml_content))
            xml_root = xml_tree.getroot()
            xml_dict = OrderedDict({xml_root.tag: parse_xml_to_dict(xml_root)})  # Ensure the root tag is included properly

            # Convert the OrderedDict to YAML format
            yaml_data = convert_dict_to_yaml(xml_dict)

            # Return the YAML data as a response
            return Response(yaml_data, mimetype='text/yaml')

        elif response.status_code == 404:
            # If the resource is not found, return a 404 error message
            return jsonify({"message": "Curation sample not found"}), 404
        else:
            # For any other status code, return a generic error message
            return jsonify({"message": "Fetch Failed"}), 500

    except requests.exceptions.RequestException as e:
        # If there is a network-related error, return an error message with exception details
        return jsonify({"message": f"An error occurred: {str(e)}"}), 500

def parse_xml_to_dict(element):
    """
    Recursively parses an XML element into an OrderedDict.

    Args:
    - element (xml.etree.ElementTree.Element): The XML element to parse.

    Returns:
    - OrderedDict: OrderedDict representing the XML element.
    """
    parsed_dict = OrderedDict()

    # Process element attributes
    if element.attrib:
        parsed_dict["@attributes"] = element.attrib

    # Process child elements
    for child in element:
        child_dict = parse_xml_to_dict(child)
        if child.tag not in parsed_dict:
            parsed_dict[child.tag] = child_dict
        else:
            if not isinstance(parsed_dict[child.tag], list):
                parsed_dict[child.tag] = [parsed_dict[child.tag]]
            parsed_dict[child.tag].append(child_dict)

    # Process element text
    if element.text and element.text.strip():
        if parsed_dict:
            parsed_dict["@text"] = element.text.strip()
        else:
            return element.text.strip()

    return parsed_dict

def convert_dict_to_yaml(data_dict):
    """
    Converts a dictionary to a YAML string.

    Args:
    - data_dict (dict): The dictionary to convert.

    Returns:
    - str: The YAML string.
    """
    yaml = YAML()
    yaml.default_flow_style = False
    yaml.allow_unicode = True
    yaml.explicit_start = False
    yaml.default_style = None
    
    # Convert OrderedDict to regular dict to avoid !!omap
    def convert_ordereddict(d):
        if isinstance(d, OrderedDict):
            return dict((k, convert_ordereddict(v)) for k, v in d.items())
        elif isinstance(d, list):
            return [convert_ordereddict(i) for i in d]
        else:
            return d

    clean_dict = convert_ordereddict(data_dict)
    
    from io import StringIO
    yaml_stream = StringIO()
    yaml.dump(clean_dict, yaml_stream)
    return yaml_stream.getvalue()




