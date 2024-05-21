#!/usr/bin/env python

# 06/04/2019 Bingyin Hu
import logging
import re # for query reformat
import string # for query reformat
from .SMILEStrans import SMILEStrans # uSMILES translation module
from .fillerDensityModule import removeNano, getFillerDensityGoogle, removeDescription # remove words like nanoparticles
from app.utils.db_utils import send_post_request

class nmChemPropsAPI():
    def __init__(self, nmid):
        # input the NanoMine ID, example: L999_Someone_2020_S2
        self.nmid = nmid
        # load logger
        logging.basicConfig(filename='app/logs/nmChemPropsInteract.log',
                            format='%(asctime)s - %(levelname)s - %(message)s',
                            level = logging.INFO
                           )
       
        self.__reset__()

    def __reset__(self):
        # logging the wf distribution
        self.polymer_wf = dict()
        self.filler_wf = dict()
        # logging the top three candidates and accumulated wfs
        self.top3polymers = [[],[],[]]
        self.top3fillers = [[],[],[]]

    
    def bagOfChar(self, myStr):
        bag = []
        for alphabet in string.ascii_lowercase:
            bag.append(str(min(9, myStr.lower().count(alphabet))))
        for number in string.digits:
            bag.append(str(min(9, myStr.lower().count(number))))
        return ''.join(bag)

    def analysisPolymers(self, keywords):
        self.searchPolymers(keywords)
        print("Keywords are: {}".format(keywords))
        print("=================")
        print("The top 3 matched polymers are:")
        for i in self.top3polymers:
            print(i)
        print("=================")
        print("Find details in .polymer_wf")

    def searchPolymers(self, keywords):
        # Strip keywords
        for key in keywords:
            keywords[key] = keywords[key].strip()

        # Prepare initial variables
        candidates = {}
        actions = []

        # Define actions based on the keywords and their conditions
        if 'ChemicalName' in keywords and 'C' in keywords['ChemicalName']:
            rptuSMILES = keywords['ChemicalName']
            rptuSMILES = SMILEStrans(rptuSMILES).translate()
            actions.append({
                'collection': 'polymer',
                'action': 'READ',
                'findBy': {'_id': rptuSMILES}
            })
        if 'SMILES' in keywords  and keywords['SMILES'] != '':
            rptuSMILES = keywords['SMILES']
            try:
                rptuSMILES = SMILEStrans(keywords['SMILES']).translate()
            except Exception as e:
                logging.info(f"Translation failed due to: {e}")
                rptuSMILES = keywords['SMILES']
            actions.append({
                'collection': 'polymer',
                'action': 'READ',
                'findBy': {'_id': rptuSMILES}
            })
        # Handle search by names, abbreviations, and synonyms using regex
        if 'ChemicalName' in keywords:
            escaped_name = re.escape(keywords['ChemicalName'])
            actions.extend([
                {'collection': 'polymer', 'action': 'SEARCH', 'findBy': {'_stdname': escaped_name}},
                {'collection': 'polymer', 'action': 'SEARCH', 'findBy': {'_abbreviations': escaped_name}},
                {'collection': 'polymer', 'action': 'SEARCH', 'findBy': {'_synonyms': escaped_name}}
            ])

        if 'Abbreviation' in keywords:
            escaped_abbr = re.escape(keywords['Abbreviation'])
            actions.append({
                'collection': 'polymer',
                'action': 'SEARCH',
                'findBy': {'_abbreviations': escaped_abbr}
            })
        # Process each action by sending it to the backend
        for action in actions:
            result = send_post_request(action['collection'], action['action'], action['findBy'])
            # Assume result contains {'data': list_of_candidates}
            for cand in result:
                _id = cand['_id']
                if _id not in candidates:
                    candidates[_id] = {'data': cand, 'wf': 0, 'features': []}
                # Adjust weights and features based on the type of search performed
                if action['findBy'].get('_stdname'):
                    candidates[_id]['wf'] += 1
                    candidates[_id]['features'].append('10')
                elif action['findBy'].get('_abbreviations'):
                    candidates[_id]['wf'] += 0.8
                    candidates[_id]['features'].append('20')
                elif action['findBy'].get('_synonyms'):
                    candidates[_id]['wf'] += 1
                    candidates[_id]['features'].append('12')

        # Process candidates to determine the best matches
        if candidates:
            # Find candidate with the highest weight
            max_wf = max(cand['wf'] for cand in candidates.values())
            best_candidates = [cand for cand in candidates.values() if cand['wf'] == max_wf]
            return best_candidates[0]['data'] if best_candidates else None
        else:
            # No candidates found, prepare to insert into ukpolymer
            ukdict = {
                'nmid': self.nmid,
                'inputname': keywords.get('ChemicalName', ''),
                'inputabbr': keywords.get('Abbreviation', ''),
                'inputsmiles': keywords.get('SMILES', ''),
                'inputtrade': keywords.get('TradeName', '')
            }
            insert_result = send_post_request('ukpolymer', 'insert', ukdict)
            print("Insertion to ukpolymer:", insert_result)
            logging.info("No matching polymer found. Consider adding to unknown polymers.")
            return None

   
    def searchFillers(self, keywords):
        for key in keywords:
            keywords[key] = keywords[key].strip()

        candidates = {}
        rptname = re.escape(removeNano(keywords['ChemicalName']))
        actions = [
            {'collection': 'filler', 'action': 'SEARCH', 'findBy': {'_id': f'{rptname}'}},
            {'collection': 'filler', 'action': 'SEARCH', 'findBy': {'_id': rptname}},
            {'collection': 'filler', 'action': 'SEARCH', 'findBy': {'_alias': f'{rptname}'}},
            {'collection': 'filler', 'action': 'SEARCH', 'findBy': {'_alias': rptname}},
            {'collection': 'filler', 'action': 'READ', 'findBy': {'_boc': self.bagOfChar(rptname)}},
            {'collection': 'filler', 'action': 'READ', 'findBy': {'_boc': self.bagOfChar(rptname)[:-10]}}
        ]

        if 'Abbreviation' in keywords:
            rptabbr = re.escape(keywords['Abbreviation'])
            actions.extend([
                {'collection': 'filler', 'action': 'SEARCH', 'findBy': {'_id': f'{rptabbr}'}},
                {'collection': 'filler', 'action': 'SEARCH', 'findBy': {'_alias': f'{rptabbr}'}}
            ])

        # Execute actions and aggregate results
        for action in actions:
            result = send_post_request(action['collection'], action['action'], action['findBy'])
            for cand in result:
                _id = cand['_id']
                if _id not in candidates:
                    candidates[_id] = {'data': cand, 'wf': 0}
                # Adjust weights based on the action type
                weight = 3 if list(action['findBy'].keys())[0] == '_id' else 2 if list(action['findBy'].keys())[0] == '_alias' else 3
                candidates[_id]['wf'] += weight

        if not candidates:
            print("no candidates")
            # If no candidates found, handle with Google result or insertion into ukfiller
            googleResult = getFillerDensityGoogle(rptname)
            stdname, clean_result = googleResult
            if clean_result != -1:
                clean_result = float(clean_result)
                insertion_findBy = {
                    '_id': stdname,
                    '_density': clean_result,
                    '_alias': [rptname],
                    '_boc': [self.bagOfChar(stdname), self.bagOfChar(rptname)]
                }
                insertion_result = send_post_request('filler', 'insert_or_update', insertion_findBy)
                logging.warn(f"Inserted or updated filler: {insertion_result}")
                return insertion_result
            else:
                unknown_filler_findBy = {
                    'nmid': self.nmid,
                    'inputname': stdname,
                    'rawname': [rptname]
                }
                unknown_filler_result = send_post_request('ukfiller', 'insert_or_update', unknown_filler_findBy)
                logging.info(f"Handled unknown filler: {unknown_filler_result}")
                return None

        # Sorting candidates by weight factor and handling ties
        sorted_candidates = sorted(candidates.values(), key=lambda x: x['wf'], reverse=True)
        if len(sorted_candidates) > 1 and sorted_candidates[0]['wf'] == sorted_candidates[1]['wf']:
            logging.warning("Multiple top candidates with the same weight factor.")

        return sorted_candidates[0]['data'] if sorted_candidates else None

    
    def containAllWords(self, query, field, collection):
        pattern = re.compile('[^a-zA-Z]', re.UNICODE)
        query = pattern.sub(' ', query)
        words = query.split()
        nWords = len(words)
        ids = dict()
        for word in words:
            if len(word) == 1: # skip the single characters
                nWords -= 1
                continue
            for result in collection.find({field: {'$regex': '\\b%s\\b' %(word), '$options':'i'}}):
                if result['_id'] not in ids:
                    ids[result['_id']] = {'data': result, 'freq': 0}
                ids[result['_id']]['freq'] += 1
        # check if the length of words equals any of the freq in ids
        output = []
        for cand in ids:
            if ids[cand]['freq'] == nWords:
                output.append(ids[cand]['data'])
        return output

    # this function checks whether the lower case of the given string myStr is
    # contained in a given list myList
    def lowerIn(self, myStr, myList):
        for s in myList:
            if myStr.lower() == s.lower():
                return True
        return False