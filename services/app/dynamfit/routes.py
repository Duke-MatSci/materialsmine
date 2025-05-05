from flask import request, Blueprint, jsonify,  Response
import json
import datetime
from app.dynamfit.dynamfit2 import update_line_chart,  check_file_exists
from app.utils.util import token_required, upload_init, request_logger, log_errors

dynamfit = Blueprint("dynamfit", __name__, url_prefix="/dynamfit")


@dynamfit.route('/extract/', methods=['POST'])
@log_errors
@request_logger
@token_required
def extract_data_from_file(request_id):
    """
    This function is the endpoint for extracting data from a file. It takes in a request ID as a parameter.
    The function first checks if the file exists and returns a 404 error if it doesn't. It then validates the 
    input parameters: number_of_prony, model, and fit_settings. If any of these parameters are invalid, the 
    function returns a 400 error. Next, it checks if the file is empty and returns a 400 error if it is. 
    The function then calls the update_line_chart function to generate the required chart data. The chart data 
    is then structured into a dictionary and returned as a JSON response along with other metadata such as 
    start time, end time, latency, and request ID. If any exceptions occur during the execution of the function,
    appropriate error messages are returned as JSON responses. 
    """
    try:
        start_time = datetime.datetime.now()
        data = request.get_json()
        file_name = data.get('file_name')
        number_of_prony = data.get('number_of_prony', 100)
        model = data.get('model', 'Linear')
        fit_settings = data.get('fit_settings', False)
        domain = data.get('domain', 'frequency')
        
        if  not check_file_exists(file_name):
            return jsonify({'message': f"File '{file_name}' not found"}), 404

        if number_of_prony not in range(1, 101) or not isinstance(number_of_prony, int):
            return jsonify({'message': 'The number of prony must be between 1 and 100'}), 400
        
        if model not in ['Linear', 'LASSO', 'Ridge']:
            return jsonify({'message': 'The model must be one of Linear, LASSO, Ridge'}), 400
        
        if fit_settings not in [True, False]:
            return jsonify({'message': 'The fit settings must be either True or False'}), 400
        
        if not file_name or file_name == '':
            return jsonify({'message': 'No file name provided'})
        
       
        uploadData = upload_init(file_name)
        # Check if the file content is empty
        if not uploadData:
            return jsonify({'message': f"File '{file_name}' is empty"}), 400
        
        # Assuming the update_line_chart function returns values in a specific order
        result = update_line_chart(uploadData, number_of_prony, model, fit_settings, domain)

        # Unpacking values into a dictionary
        chart_data = {
            'complex_chart_placeholder': result[0],
            'complex_tand_chart_placeholder': result[1],
            'relaxation_chart_placeholder': result[2],
            'relaxation_spectrum_placeholder': result[3],
            'complex_temperature_chart_placeholder': result[4],
            'temperature_tand_chart_placeholder2': result[5],
            'mytable_placeholder': result[6],
        }
        
        # Constructing the data dictionary
        data = {
            "multi": True,
            "response": {
                "complex-chart": json.loads(chart_data['complex_chart_placeholder'].to_json()),
                "complex-tand-chart": json.loads(chart_data['complex_tand_chart_placeholder'].to_json()),
                "relaxation-chart": json.loads(chart_data['relaxation_chart_placeholder'].to_json()),
                "relaxation-spectrum-chart": json.loads(chart_data['relaxation_spectrum_placeholder'].to_json()),
                "complex-temp-chart": json.loads(chart_data['complex_temperature_chart_placeholder'].to_json()),
                "temp-tand-chart": json.loads(chart_data['temperature_tand_chart_placeholder2'].to_json()),
                "mytable": chart_data['mytable_placeholder'],
                "upload-data": uploadData,
            }
        }
        end_time = datetime.datetime.now()
        latency = f"{((end_time - start_time)).total_seconds()} seconds"
       
        # Manually serialize JSON to ensure order is maintained
        json_data = json.dumps(data, indent=4)  # data is your dictionary

        # Create a Flask response
        response = Response(json_data, content_type='application/json; charset=utf-8', status=200)
        response.headers['startTime'] = start_time
        response.headers['endTime'] = end_time
        response.headers['latency'] = str(latency)
        response.headers['responseId'] = request_id

        return response
    except ValueError as ve:
        return jsonify({'message': str(ve)}), 400
    except Exception as e:
        return jsonify({'message': str(e)}), 500