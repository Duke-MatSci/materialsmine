from flask import request, Blueprint, jsonify, make_response
import json
#import time
import datetime
from app.config import Config

from app.dynamfit.dynamfit2 import update_line_chart,  check_file_exists
from app.utils.util import token_required, upload_init, request_logger

dynamfit = Blueprint("dynamfit", __name__, url_prefix="/dynamfit")


@dynamfit.route('/extract/', methods=['POST'])
# @request_logger
@token_required
def extract_data_from_file(request_id):
    try:
        start_time = datetime.datetime.now()
        data = request.get_json()
        file_name = data.get('file_name')
        number_of_prony = data.get('number_of_prony', 100)
        model = data.get('model', 'Linear')
        fit_settings = data.get('fit_settings', False)
        
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
        result = update_line_chart(uploadData, number_of_prony, model, fit_settings)

        # Unpacking values into a dictionary
        chart_data = {
            'complex_chart_placeholder': result[0],
            'complex_tand_chart_placeholder': result[1],
            'relaxation_chart_placeholder': result[2],
            'relaxation_spectrum_placeholder': result[3],
            'mytable_placeholder': result[4],
        }
        
        # Constructing the data dictionary
        data = {
            "multi": True,
            "response": {
                "complex-chart": json.loads(chart_data['complex_chart_placeholder'].to_json()),
                "complex-tand-chart": json.loads(chart_data['complex_tand_chart_placeholder'].to_json()),
                "relaxation-chart": json.loads(chart_data['relaxation_chart_placeholder'].to_json()),
                "relaxation-spectrum-chart": json.loads(chart_data['relaxation_spectrum_placeholder'].to_json()),
                "mytable": chart_data['mytable_placeholder'],
                "upload-data": uploadData,
            }
        }
        end_time = datetime.datetime.now()
        #latency = f"{int((end_time - start_time) * 1000)} milliseconds"
        latency = f"{((end_time - start_time)).total_seconds()} seconds"
       
        # Creating a JSON response
        json_response = jsonify(data)

        response = make_response(json_response, 200, {
            'startTime': start_time,
            'endTime': end_time,
            'latency': str(latency),
            'responseId': request_id
        })
        return response
    except ValueError as ve:
        return jsonify({'message': str(ve)}), 400
    except Exception as e:
        return jsonify({'message': str(e)}), 500