# WIP
from flask import request, Blueprint, jsonify,  Response
import json
import datetime
from app.dynamfit.dynamfit2 import update_line_chart,  check_file_exists, estimate_shift_model_parameters
from app.utils.util import token_required, upload_init, shift_upload_init, request_logger, log_errors

dynamfit = Blueprint("dynamfit", __name__, url_prefix="/dynamfit")
# NEW
# estimate = Blueprint("estimate", __name__, url_prefix="/dynamfit/estimate")

# ISSUE: TL and Tg estimators use data from the upload to perform estimation. extract route both extracts and plots. Should we still do this first?
# Current soln is to import again (Messy and slow)
# Still need to predict the shift factors. do we do this in estimate call, or on its own?
# @dynamfit.route('/estimate/', methods=['POST'])
# @log_errors
# @request_logger
# @token_required
# def estimate_fit_values(request_id):
#     try:
#         start_time = datetime.datetime.now()
#         # Read inputs to API call
#         input_data = request.get_json()
#         file_name = input_data.get('file_name')
#         shift_model = input_data.get('model', 'hybrid')

#         if  not check_file_exists(file_name):
#             return jsonify({'message': f"File '{file_name}' not found"}), 404
        
#         if shift_model not in ['WLF', 'hybrid']:
#             return jsonify({'message': 'The shift factor model must be one of WLF, hybrid'}), 400
        
#         if not file_name or file_name == '':
#             return jsonify({'message': 'No file name provided'})
        
#         # Import the Data
#         uploadData = upload_init(file_name)

#         # Perform estimation
#         C1, C2, Tg, Ea, TL = estimate_shift_model_parameters(uploadData, shift_model)
        
#         # Constructing the data dictionary
#         data = {
#             "multi": True,
#             "response": {
#                 "C1": C1,
#                 "C2": C2,
#                 "Tg": Tg,
#                 "Ea": Ea,
#                 "TL": TL,
#             }
#         }
#         end_time = datetime.datetime.now()
#         latency = f"{((end_time - start_time)).total_seconds()} seconds"
       
#         # Manually serialize JSON to ensure order is maintained
#         json_data = json.dumps(data, indent=4)  # data is your dictionary

#         # Create a Flask response
#         response = Response(json_data, content_type='application/json; charset=utf-8', status=200)
#         response.headers['startTime'] = start_time
#         response.headers['endTime'] = end_time
#         response.headers['latency'] = str(latency)
#         response.headers['responseId'] = request_id
#         return response
#     except ValueError as ve:
#         return jsonify({'message': str(ve)}), 400
#     except Exception as e:
#         return jsonify({'message': str(e)}), 500

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
        shift_model = data.get('transform_method', 'hybrid')
        # Read incoming shift factor model metrics
        Tg = data.get('Tg', None)
        C1 = data.get('C1', None)
        C2 = data.get('C2', None)
        Ea = data.get('Ea', None)
        TL = data.get('TL', None)

        Tg_estimate = data.get('Tg_estimate', False)
        C1_estimate = data.get('C1_estimate', False)
        C2_estimate = data.get('C2_estimate', False)
        Ea_estimate = data.get('Ea_estimate', False)
        TL_estimate = data.get('TL_estimate', False)

        # add manual shift factor upload
        shift_file_name = data.get('shift_file_name', None)
        
        if  not check_file_exists(file_name):
            return jsonify({'message': f"File '{file_name}' not found"}), 404
        
        # if  not check_file_exists(shift_file_name):
        #     return jsonify({'message': f"Shift file '{shift_file_name}' not found"}), 404

        if number_of_prony not in range(1, 101) or not isinstance(number_of_prony, int):
            return jsonify({'message': 'The number of prony must be between 1 and 100'}), 400
        
        if model not in ['Linear', 'LASSO', 'Ridge']:
            return jsonify({'message': 'The model must be one of Linear, LASSO, Ridge'}), 400
        
        if fit_settings not in [True, False]:
            return jsonify({'message': 'The fit settings must be either True or False'}), 400
        
        if not file_name or file_name == '':
            return jsonify({'message': 'No file name provided'})

        if shift_model not in ['WLF', 'hybrid']:
            return jsonify({'message': 'The shift factor model must be one of WLF, hybrid'}), 400
        
        print("before upload_init")
        uploadData = upload_init(file_name, domain)
        print("after upload_init")
        # add a function for handling shift data:
        # shiftData = upload_shift_init(shift_file_name)
        # Check if the file content is empty
        if not uploadData:
            return jsonify({'message': f"File '{file_name}' is empty"}), 400
        
        # Print uploadData for debugging
        # print("Upload Data:", uploadData)

        print("before shift_upload_init")
        shiftData = shift_upload_init(shift_file_name)
        print("after shift_upload_init")
        # add a function for handling shift data:
        # shiftData = upload_shift_init(shift_file_name)
        # Check if the file content is empty
        # if not shiftData:
        #     return jsonify({'message': f"Shift file '{shift_file_name}' is empty"}), 400
        # check that shift data and uploadData lengths align align
        if shiftData and (len(uploadData) != len(shiftData)):
             return jsonify({'message': f"Shift file and Upload File must have the same number of rows."}), 400
        
        # Print shiftData for debugging
        # print("Shift Upload Data:", shiftData)

        # # Assuming the update_line_chart function returns values in a specific order
        # result = update_line_chart(uploadData, number_of_prony, model, fit_settings, domain)
        
        # Perform shift variable estimation
        estimate_bools = dict(Tg_estimate=Tg_estimate, C1_estimate=C1_estimate, C2_estimate=C2_estimate, Ea_estimate=Ea_estimate, TL_estimate=TL_estimate, domain=domain)
        print("before estimate_shift_model")
        C1_est, C2_est, Tg_est, Ea_est, TL_est = estimate_shift_model_parameters(uploadData, shift_model, **estimate_bools)
        print("after estimate_shift_model")

        # Assign the new values for each variable based on the boolean switches:
        Tg = Tg_est if Tg_estimate else Tg
        C1 = C1_est if C1_estimate else C1
        C2 = C2_est if C2_estimate else C2
        Ea = Ea_est if Ea_estimate else Ea
        TL = TL_est if TL_estimate else TL

        shift_params = dict(Tg=Tg, C1=C1, C2=C2, Ea=Ea, TL=TL, shift_model=shift_model, shiftData=shiftData)

        # Assuming the update_line_chart function returns values in a specific order
        print("before update_line_chart")
        result = update_line_chart(uploadData, number_of_prony, model, fit_settings, domain, **shift_params)
        print("after update_line_chart")
        # # Note: add shift factor prediction here
        # # Prerequisite boolean detection
        # # Only predict the shift factors if this statement resolves to true
        # b = (Tg and C1 and C2 and (shift_model is "WLF")) or (Tg and C1 and C2 and TL and Ea and (shift_model is "hybrid")) or (shiftData)
        # if b:
        #     # perform TTSP shifting
        #     # Note: add TTSP here (separate from update_line_chart)
        #     # Inputs: domain, shift_model, Tg, C1, C2, TL, Ea)
        #     print("Remove This Temporary Print. Here for python correctness only")

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
                "C1": C1,
                "C2": C2,
                "Tg": Tg,
                "Ea": Ea,
                "TL": TL,
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