from flask import request, Blueprint
import json
from app.chemprops.nmChemPropsAPI import nmChemPropsAPI 

chemprops = Blueprint("chemprops", __name__)

@chemprops.route("/chemprops", methods=['GET'])
def call_chemprops():
    # polfil = ChemPropsDto.query.get_or_404(polfil)
    polfil = request.args.get('polfil', None, type=str)
    ChemicalName = request.args.get('ChemicalName', '', type=str)
    Abbreviation = request.args.get('Abbreviation', '', type=str)
    TradeName = request.args.get('TradeName', '', type=str)
    SMILES = request.args.get('SMILES', '', type=str)
    nmId = request.args.get('nmId', None, type=str)
    
    # polfil has only 2 options 'pol' and 'fil'
    # ChemicalName is a required argument
    if (polfil == None or nmId == None or polfil not in {'pol','fil'} or ChemicalName == ''):
        # TODO (BINGYIN): Can we specify the missing field and add it to the return object.
        return json.dumps({"error": "Missing required query params"})

    
    # init nmChemPropsAPI
    nmCPAPI = nmChemPropsAPI(nmId)
    
    # prepare search package, inside nmChemPropsAPI a search only takes place
    # when input has len()>1, thus it is safe to use default value
    keywords = {
        'ChemicalName':ChemicalName,
        'Abbreviation':Abbreviation,
        'TradeName':TradeName,
        'SMILES':SMILES
    }

    # call search function by polfil
    if polfil == 'pol':
        return json.dumps(nmCPAPI.searchPolymers(keywords))
    elif polfil == 'fil':
        return json.dumps(nmCPAPI.searchFillers(keywords))
    
    # should never reach here
    return json.dumps({"error": "Cannot find any"})