import os
import json
import datetime

import numpy as np

from flask import request, Blueprint, jsonify,  Response

from app.dynamfit.dynamfit2 import (
    update_line_chart, argmax_peak, peak_edge_warning,
    UNIVERSAL_WLF_C1, UNIVERSAL_WLF_C2,
    fit_wlf_coefficients, fit_hybrid_coefficients,
)
from app.utils.util import token_required, upload_init, request_logger, log_errors
from app.config import Config

dynamfit = Blueprint("dynamfit", __name__, url_prefix="/tri-ve")


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


def as_float_or_none(value, name):
    """
    Coerce an optional request field to float, keeping None as None.

    The coefficient inputs reach the client as text fields, so a hand-typed
    Tg arrives in the JSON body as the string "20"; without coercion it flows
    into numpy arithmetic and dies with "unsupported operand type(s) for -:
    'str' and 'float'" as a 500. Raises ValueError (the routes' 400 path)
    naming the field when the value is not a number.
    """
    if value is None:
        return None
    return as_float(value, name)


def as_float(value, name):
    """
    Coerce a required request field to float.

    The fit controls are number inputs, and an emptied number input travels
    as the string '' (v-model.number cannot coerce ''), so without this the
    range guards below compare a str to an int and die as a 500. Raises
    ValueError (the routes' 400 path) naming the field when the value is not
    a number.
    """
    try:
        return float(value)
    except (TypeError, ValueError):
        raise ValueError(f"{name} must be a number; got {value!r}")


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
        smoothness = as_float(data.get('smoothness', 0), 'smoothness')
        fit_settings = data.get('fit_settings', False)
        domain = data.get('domain', 'frequency')
        relative_error = as_float(data.get('relative_error', 0.2), 'relative_error')
        # Multiplier on the file's own error columns; the client sends both
        # this and relative_error every time, and update_line_chart consumes
        # whichever matches the upload's shape. That keeps the first fit after
        # an upload correct even though the client only learns whether error
        # columns exist from that fit's response.
        error_scale = as_float(data.get('error_scale', 1.0), 'error_scale')
        # Default to 'none', not a real model: an absent transform_method means
        # the caller did not ask for a ω-T transformation. Defaulting to 'hybrid'
        # made "no transform requested" indistinguishable from "hybrid
        # requested", so a plain frequency upload came back with temperature
        # figures synthesized from universal-WLF constants.
        shift_model = data.get('transform_method') or 'none'
        # Read incoming shift factor model metrics
        Tg = as_float_or_none(data.get('Tg'), 'Tg')
        C1 = as_float_or_none(data.get('C1'), 'C1')
        C2 = as_float_or_none(data.get('C2'), 'C2')
        Ea = as_float_or_none(data.get('Ea'), 'Ea')
        TC = as_float_or_none(data.get('TC'), 'TC')

        Tg_estimate = data.get('Tg_estimate', False)
        C1_estimate = data.get('C1_estimate', False)
        C2_estimate = data.get('C2_estimate', False)
        Ea_estimate = data.get('Ea_estimate', False)
        TC_estimate = data.get('TC_estimate', False)

        # Display-only passthroughs for the shift figure, echoed by the client
        # from its last /fit-shift/ response: the model curve's vertical
        # offset and the fit-time reduced chi-squared (only the fit knows how
        # many parameters were free, so it is not recomputed here).
        a_T_ref = as_float_or_none(data.get('a_T_ref'), 'a_T_ref')
        shift_chi2_reduced = as_float_or_none(data.get('chi2_reduced'), 'chi2_reduced')

        # add manual shift factor upload
        shift_file_name = data.get('shift_file_name', None)
        # Display-only counterpart: a shift-factor file drawn as the
        # Experiment markers on the shift figure WITHOUT driving the ω-T
        # transform. shift_file_name cannot serve both purposes — supplying it
        # makes the transform apply the table instead of the WLF/hybrid model
        # — so a WLF/hybrid extract passes the uploaded file here instead, to
        # compare the model curve against the measured points.
        shift_reference_file = data.get('shift_reference_file', None)

        if not file_name:
            return jsonify({'message': 'No file name provided'}), 400

        if not check_file_exists(file_name):
            return jsonify({'message': f"File '{file_name}' not found"}), 404

        if number_of_prony not in range(1, 101) or not isinstance(number_of_prony, int):
            # Named for the widget the value comes from, not for the wire field:
            # this string is shown to the user in a snackbar.
            return jsonify({'message': 'The relaxation grid size must be between 1 and 100'}), 400

        if smoothness < 0:
            return jsonify({'message': 'The smoothness must be non-negative'}), 400

        # Zero would make the synthesized sigma |E*| * relative_error zero for
        # every row, dividing by zero in smooth_prony_fit's weighted design matrix.
        if relative_error <= 0:
            return jsonify({'message': 'The relative error must be positive'}), 400

        # Same guard as relative_error: zero would zero every supplied sigma,
        # negative would flip the weighted residuals.
        if error_scale <= 0:
            return jsonify({'message': 'The error scale must be positive'}), 400

        if fit_settings not in [True, False]:
            return jsonify({'message': 'The fit settings must be either True or False'}), 400

        if shift_model not in ['WLF', 'hybrid', 'manual', 'none']:
            return jsonify({'message': 'The shift factor model must be one of WLF, hybrid, manual, none'}), 400
        
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

        # When shiftData is present it already supplies the figure markers, so
        # the reference is redundant and skipped.
        if shift_reference_file and not shiftData:
            if not check_file_exists(shift_reference_file):
                return jsonify(
                    {'message': f"File '{shift_reference_file}' not found"}), 404
            shift_reference = upload_init(shift_reference_file, 'shift')
        else:
            shift_reference = None

        # Perform shift variable estimation

        # "Universal" Estimations for C1, C2
        if C1_estimate:
            C1 = UNIVERSAL_WLF_C1
        if C2_estimate:
            C2 = UNIVERSAL_WLF_C2
        # A peak estimate hugging the edge of the measured range is suspect
        # (truncated transition, or an instrument artifact at the ramp's end),
        # so those estimates ride back with a warning the client can show.
        # Peak estimation is temperature-domain only: a master curve's tan-δ
        # and E-loss peaks sit at FREQUENCIES, and reading one off as a °C
        # value was a unit error that happened to draw plausible axes. The
        # client no longer offers the checkboxes in the frequency domain;
        # this 400 backs that up at the API.
        estimate_warnings = []
        if (Tg_estimate or TC_estimate) and domain != 'temperature':
            return jsonify({'message': (
                'Tg/Tc cannot be estimated from a frequency-domain master '
                'curve — its tan-δ and E-loss peaks are frequencies, not '
                'temperatures. Enter the value directly.'
            )}), 400
        if Tg_estimate or TC_estimate:
            temperatures = uploadData["Temperature"]
            # Tg from the tan-δ peak
            if Tg_estimate:
                tan_delta = (uploadData["E Loss"] / uploadData["E Storage"])
                Tg = temperatures[argmax_peak(tan_delta)]
                warning = peak_edge_warning(Tg, temperatures, 'Tg')
                if warning:
                    estimate_warnings.append(warning)
            # The E_loss peak temperature is TL by convention; it serves as
            # the default estimate of the WLF/Arrhenius crossover TC.
            if TC_estimate:
                TL = temperatures[argmax_peak(uploadData["E Loss"])]
                TC = TL
                warning = peak_edge_warning(TC, temperatures, 'Tc')
                if warning:
                    estimate_warnings.append(warning)
        # Use "generic" Ea for thermoplastic elastomers
        if Ea_estimate:
            Ea = 200  # kJ/mol

        shift_params = dict(Tg=Tg, C1=C1, C2=C2, Ea=Ea, TC=TC, shift_model=shift_model, shiftData=shiftData)

        # Assuming the update_line_chart function returns values in a specific order
        result = update_line_chart(uploadData, number_of_prony, smoothness,
                                   fit_settings, domain,
                                   relative_error=relative_error,
                                   error_scale=error_scale,
                                   a_T_ref=a_T_ref,
                                   shift_chi2_reduced=shift_chi2_reduced,
                                   shift_reference=shift_reference,
                                   **shift_params)

        # Unpacking values into a dictionary
        chart_data = {
            'complex_chart_placeholder': result[0],
            'complex_tand_chart_placeholder': result[1],
            'relaxation_chart_placeholder': result[2],
            'relaxation_spectrum_placeholder': result[3],
            'complex_temperature_chart_placeholder': result[4],
            'temperature_tand_chart_placeholder2': result[5],
            'mytable_placeholder': result[6],
            'shift_chart_placeholder': result[7],
            'shift_table_placeholder': result[8],
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
                "shift-chart": json.loads(chart_data['shift_chart_placeholder'].to_json()),
                "shift-table": chart_data['shift_table_placeholder'],
                "mytable": chart_data['mytable_placeholder'],
                # Emit upload-data as row-objects (one dict per row), matching
                # mytable's shape and the frontend "Uploaded Data" tab, whose
                # TableComponent derives columns from Object.keys(rows[0]).
                # uploadData is a dict of equal-length numpy arrays; transpose
                # the stacked columns to rows, then tolist() each row to get
                # JSON-native floats (stdlib json.dumps can't serialize ndarrays).
                # np.array needs a real sequence, hence tuple(...) over the view.
                # TODO: this echoes the ENTIRE upload back to the client (~3 MB
                # for a 41k-row broadband file), and the UI's watcher fan-out can
                # fire several such responses per user action. The table only
                # paginates client-side, so the client could instead render the
                # tab from the file it already uploaded (or a request flag could
                # gate this field off). Plot traces are already thinned in
                # update_line_chart; fix if broadband data becomes more common.
                "upload-data": [
                    dict(zip(uploadData, row))
                    for row in zip(*(col.tolist() for col in uploadData.values()))
                ],
                "C1": C1,
                "C2": C2,
                "Tg": Tg,
                "Ea": Ea,
                "TC": TC,
                "warnings": estimate_warnings,
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


@dynamfit.route('/fit-shift/', methods=['POST'])
@log_errors
@request_logger
@token_required
def fit_shift_coefficients(request_id):
    """
    Fit WLF or hybrid shift-factor coefficients from an uploaded shift-factor
    file (2-3 columns, no header: Temperature [°C], a_T [linear scale], and
    optionally Error [absolute std dev on a_T, used as 1/sigma fit weights]).
    Returns the fitted coefficients plus the fit's reduced chi-squared
    (chi2_reduced; None when there are no surplus degrees of freedom) — no
    Prony fit, no charts.

    WLF requires Tg (the a_T == 1 anchor); hybrid requires TC. Both are
    upstream-supplied inputs — this route does not load the main viscoelastic
    data file and so cannot estimate them. Supplying any of C1/C2/Ea holds that
    coefficient fixed instead of fitting it.

    Both fits co-fit a vertical reference offset, surfaced as a_T_ref: the
    data's shift factor at the model's anchor (Tg for WLF, TC for hybrid), and
    1.0 only if the file is truly referenced there. Without it the shape
    parameters bend to drag the curve through a_T == 1 at the anchor.
    """
    try:
        start_time = datetime.datetime.now()
        data = request.get_json()
        shift_file_name = data.get('shift_file_name')
        shift_model = data.get('transform_method', 'hybrid')
        Tg = as_float_or_none(data.get('Tg'), 'Tg')
        C1 = as_float_or_none(data.get('C1'), 'C1')
        C2 = as_float_or_none(data.get('C2'), 'C2')
        Ea = as_float_or_none(data.get('Ea'), 'Ea')
        TC = as_float_or_none(data.get('TC'), 'TC')

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
        # Optional third column: absolute standard deviations on a_T, used as
        # 1/sigma weights in the fit and in the reported chi-squared.
        sigma_a_T = (np.asarray(shiftData['Error'], dtype=float)
                     if 'Error' in shiftData else None)

        if shift_model == 'WLF':
            if Tg is None:
                return jsonify({'message': 'Tg is required for WLF coefficient fitting'}), 400
            C1_fit, C2_fit, a_T_ref, chi2_reduced = fit_wlf_coefficients(
                T, a_T, T_ref=Tg,
                C1=C1, C2=C2,
                fix_C1=(C1 is not None),
                fix_C2=(C2 is not None),
                sigma_a_T=sigma_a_T,
                return_quality=True,
            )
            result_data = {
                'transform_method': 'WLF',
                'Tg': Tg, 'C1': C1_fit, 'C2': C2_fit,
                'Ea': None, 'TC': None,
                'a_T_ref': a_T_ref,
                'chi2_reduced': chi2_reduced,
            }
        else:  # hybrid
            if TC is None:
                return jsonify({'message': 'Tc is required for hybrid coefficient fitting'}), 400
            C1_fit, C2_fit, Ea_fit, a_T_ref, chi2_reduced = fit_hybrid_coefficients(
                T, a_T, TC=TC,
                C1=C1, C2=C2, Ea=Ea,
                fix_C1=(C1 is not None),
                fix_C2=(C2 is not None),
                fix_Ea=(Ea is not None),
                sigma_a_T=sigma_a_T,
                return_quality=True,
            )
            result_data = {
                'transform_method': 'hybrid',
                'Tg': None, 'C1': C1_fit, 'C2': C2_fit,
                'Ea': Ea_fit, 'TC': TC,
                'a_T_ref': a_T_ref,
                'chi2_reduced': chi2_reduced,
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
    except ValueError as ve:
        return jsonify({'message': str(ve)}), 400
    except Exception as e:
        # See the note in extract_data_from_file: raw error text is leaked to
        # clients pending an upstream decision on logging infra.
        return jsonify({'message': str(e)}), 500
