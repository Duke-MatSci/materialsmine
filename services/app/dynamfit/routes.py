import os
import json
import datetime

import numpy as np

from flask import request, Blueprint, jsonify,  Response

from app.dynamfit.dynamfit2 import (
    update_line_chart, argmax_peak,
    UNIVERSAL_WLF_C1, UNIVERSAL_WLF_C2,
    fit_wlf_coefficients, fit_hybrid_coefficients,
)
from app.utils.util import token_required, upload_init, request_logger, log_errors
from app.config import Config

dynamfit = Blueprint("dynamfit", __name__, url_prefix="/dynamfit")


def check_file_exists(file_name):
    """
    Checks if a file exists.

    Args:
        file_name (str): The name of the file to check.

    Returns:
        bool: True if the file exists, False otherwise.
    """
    file_path = os.path.join(Config.FILES_DIRECTORY, file_name)
    return os.path.exists(file_path)


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
        smoothness = data.get('smoothness', 0)
        fit_settings = data.get('fit_settings', False)
        domain = data.get('domain', 'frequency')
        relative_error = data.get('relative_error', 0.2)
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

        fit_shift_coefficients = data.get('fit_shift_coefficients', False)

        # TODO: This branch should become its own route (e.g. POST /dynamfit/fit-shift/).
        # The shift-domain fit is a special case: its only effective inputs are the
        # shift file plus Tg or TL, and its only output is the fitted coefficients —
        # no Prony fit, no charts. Grafted into /extract/ for now to avoid a new
        # endpoint while the feature stabilises.
        if fit_shift_coefficients:
            if not shift_file_name:
                return jsonify({'message': 'No shift file name provided'}), 400
            if not check_file_exists(shift_file_name):
                return jsonify({'message': f"File '{shift_file_name}' not found"}), 404
            if shift_model not in ('WLF', 'hybrid'):
                return jsonify({'message': 'The shift factor model must be one of WLF, hybrid'}), 400

            shiftData = upload_init(shift_file_name, 'shift')
            if not shiftData:
                return jsonify({'message': f"File '{shift_file_name}' is empty"}), 400

            T = np.asarray(shiftData['Temperature'], dtype=float)
            a_T = np.asarray(shiftData['a_T'], dtype=float)

            if shift_model == 'WLF':
                if Tg is None:
                    return jsonify({'message': 'Tg is required for WLF coefficient fitting'}), 400
                C1_fit, C2_fit = fit_wlf_coefficients(
                    T, a_T, T_ref=Tg,
                    C1=C1, C2=C2,
                    fix_C1=(C1 is not None),
                    fix_C2=(C2 is not None),
                )
                result_data = {
                    'transform_method': 'WLF',
                    'Tg': Tg, 'C1': C1_fit, 'C2': C2_fit,
                    'Ea': None, 'TL': None,
                }
            else:  # hybrid
                if TL is None:
                    return jsonify({'message': 'TL is required for hybrid coefficient fitting'}), 400
                # TODO: a_T_ref (the co-fitted vertical reference offset) is
                # discarded for now. There's a good chance the frontend will need
                # it to reconstruct/align master curves whose shift factors aren't
                # referenced to TL — surface it in result_data when the frontend
                # is refactored to consume it (not part of this change).
                C1_fit, C2_fit, Ea_fit, _a_T_ref = fit_hybrid_coefficients(
                    T, a_T, TL=TL,
                    C1=C1, C2=C2, Ea=Ea,
                    fix_C1=(C1 is not None),
                    fix_C2=(C2 is not None),
                    fix_Ea=(Ea is not None),
                )
                result_data = {
                    'transform_method': 'hybrid',
                    'Tg': None, 'C1': C1_fit, 'C2': C2_fit,
                    'Ea': Ea_fit, 'TL': TL,
                }

            end_time = datetime.datetime.now()
            latency = f"{(end_time - start_time).total_seconds()} seconds"
            json_data = json.dumps(result_data, indent=4)
            response = Response(json_data, content_type='application/json; charset=utf-8', status=200)
            response.headers['startTime'] = start_time
            response.headers['endTime'] = end_time
            response.headers['latency'] = str(latency)
            response.headers['responseId'] = request_id
            return response

        if not file_name:
            return jsonify({'message': 'No file name provided'}), 400

        if not check_file_exists(file_name):
            return jsonify({'message': f"File '{file_name}' not found"}), 404

        if number_of_prony not in range(1, 101) or not isinstance(number_of_prony, int):
            return jsonify({'message': 'The number of prony must be between 1 and 100'}), 400

        if smoothness < 0:
            return jsonify({'message': 'The smoothness must be non-negative'}), 400

        if fit_settings not in [True, False]:
            return jsonify({'message': 'The fit settings must be either True or False'}), 400

        if shift_model not in ['WLF', 'hybrid', 'manual']:
            return jsonify({'message': 'The shift factor model must be one of WLF, hybrid, manual'}), 400
        
        uploadData = upload_init(file_name, domain)
        if not uploadData:
            return jsonify({'message': f"File '{file_name}' is empty"}), 400

        if shift_file_name:
            shiftData = upload_init(shift_file_name, 'shift')
        else:
            shiftData = None
        # Row-count alignment between uploadData and shiftData is verified
        # inside tts_temperature_to_frequency_V2, which raises ValueError → 400
        # if they differ.

        # Perform shift variable estimation

        # "Universal" Estimations for C1, C2
        if C1_estimate:
            C1 = UNIVERSAL_WLF_C1
        if C2_estimate:
            C2 = UNIVERSAL_WLF_C2
        if Tg_estimate or TL_estimate:
            domain_col = {"temperature": "Temperature", "frequency": "Frequency"}[domain]
            # Tg from the tan-δ peak
            if Tg_estimate:
                tan_delta = (uploadData["E Loss"] / uploadData["E Storage"])
                Tg = uploadData[domain_col][argmax_peak(tan_delta)]
            # TL from the E_loss peak
            if TL_estimate:
                TL =  uploadData[domain_col][argmax_peak(uploadData["E Loss"])]
        # Use "generic" Ea for thermoplastic elastomers
        if Ea_estimate:
            Ea = 200  # kJ/mol

        shift_params = dict(Tg=Tg, C1=C1, C2=C2, Ea=Ea, TL=TL, shift_model=shift_model, shiftData=shiftData)

        # Assuming the update_line_chart function returns values in a specific order
        result = update_line_chart(uploadData, number_of_prony, smoothness,
                                   fit_settings, domain,
                                   relative_error=relative_error, **shift_params)

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
        # XXX: leaks internal error text to clients — raw exception messages
        # (including AssertionError contract-violation strings naming server-bug
        # details) reach the response body. Should log+correlate via request_id
        # and return a generic "Internal server error" message. Needs upstream
        # decision on logging infra before changing.
        return jsonify({'message': str(e)}), 500
