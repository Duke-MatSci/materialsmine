from flask import request, Blueprint, jsonify, make_response
from app.chemprops.nmChemPropsAPI import nmChemPropsAPI 
from app.utils.util import request_logger, log_errors, token_required
from app.chemprops.nmChemPropsPrepare import nmChemPropsPrepare
import datetime
from app.chemprops.helper import search_and_refine_data


chemprops = Blueprint("chemprops", __name__, url_prefix="/chemprops/")

# Route to call nmChemPropsPrepare
@chemprops.route("init/", methods=['POST'])
@log_errors
@request_logger
@token_required
def init_chemprops(request_id):
    try:
        nm = nmChemPropsPrepare()
        return jsonify(
            {
                "message": "nmChemPropsPrepare initialized and database seeded successfully"
            }
        ), 201
    except Exception as e:
        print(e)
        return jsonify({"message": f"Error initializing nmChemPropsPrepare: {e}"}), 500

@chemprops.route("call/", methods=['POST'])
@log_errors
@request_logger
@token_required
def call_chemprops(request_id):
    start_time = datetime.datetime.now()
    data = request.get_json()
    polfil = data.get('polfil', None)
    ChemicalName = data.get('ChemicalName', None)
    Abbreviation = data.get('Abbreviation', None)
    TradeName = data.get('TradeName', None)
    SMILES = data.get('SMILES', None)
    nmId = data.get('nmId', None)
    
    if polfil is None:
        return jsonify({"message": "polfil is required"})
    
    if ChemicalName is None:
        return jsonify({"message": "ChemicalName is required"})
    
    if polfil not in ['pol','fil']:
        return jsonify({"message": "polfil must be either pol or fil"})

    try:
        # init nmChemPropsAPI
        nmCPAPI = nmChemPropsAPI(nmId)
    
        # call search function by polfil
        if polfil == 'pol':
            keywords = {
            'ChemicalName': ChemicalName,
            'Abbreviation': Abbreviation,
            'TradeName': TradeName,
            'SMILES': SMILES
        }
            refined_data = search_and_refine_data(nmCPAPI.searchPolymers, keywords)
            
        elif polfil == 'fil':
            keywords = {
            'ChemicalName': ChemicalName,
            'Abbreviation': Abbreviation,
            'TradeName': TradeName,
        }
            refined_data = search_and_refine_data(nmCPAPI.searchFillers, keywords, include_uSMILES=False)
        
        
        
        end_time = datetime.datetime.now()
        latency = f"{((end_time - start_time)).total_seconds()} seconds"
         # Creating a JSON response
        json_response = jsonify(refined_data)

        response = make_response(json_response, 200, {
            'startTime': start_time,
            'endTime': end_time,
            'latency': str(latency),
            'responseId': request_id
        })
        return response
        
    except Exception as e:
        return jsonify({"message": str(e)})