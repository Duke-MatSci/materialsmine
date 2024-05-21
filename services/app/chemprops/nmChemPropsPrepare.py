#!/usr/bin/env python

# 06/04/2019 Bingyin Hu
# 05/14/2020 Bingyin Hu updateMongoDB fn updated
import requests # type: ignore
import xlrd # type: ignore
import openpyxl # type: ignore
from pymongo import MongoClient # type: ignore
import logging
import string
import os
# from app import db
import pandas as pd # type: ignore
from app.utils.db_utils import seedDatabase

class nmChemPropsPrepare():
    def __init__(self):
        # load logger
        logging.basicConfig(filename='/services/services_app.log',
                            format='%(asctime)s - %(levelname)s - %(message)s',
                            level = logging.INFO
                           )
       
        self.downloadGS()
        # self.gsUpdate = []
        # self.filler = dict()
        # self.polymer = dict()
        self.prepFiller()
        self.prepPolymer()
        
        # self.updateMongoDB()
        

    def file_path(self, filename):
        # Get the current directory
        current_directory = os.path.dirname(__file__) if __file__ else os.getcwd()
        # Specify the subdirectory and filename
        subdirectory = "files"
        return os.path.join(current_directory, subdirectory, filename)
   

    # download google spreadsheets
    def downloadGS(self):
        # Load the raw_file.xlsx once
        file_path = self.file_path("raw_data.xlsx")
        raw_data = pd.read_excel(file_path, sheet_name=None)

        for sheet_name in ["MatrixRaw", "FillerRaw", "Filler"]:
            # Check if the sheet exists in the loaded data
            if sheet_name in raw_data:
                sheet_data = raw_data[sheet_name]

                # Perform actions with sheet_data, for example, save it to a new Excel file
                output_file_path = self.file_path(f"{sheet_name}.xlsx")
                sheet_data.to_excel(output_file_path, index=False)

                logging.info(f"{sheet_name} sheet is saved as {output_file_path}")
            else:
                logging.warning(f"Sheet {sheet_name} not found in raw_data.xlsx")
      
    # prepare ChemProps.polymer data
    def prepPolymer(self):
        file_path = self.file_path("MatrixRaw.xlsx")
        xlfile = xlrd.open_workbook(file_path)
        sheet = xlfile.sheet_by_index(0)  # one sheet per xlsx file
        header = sheet.row_values(0)  # Read headers
        hmap = {h: i for i, h in enumerate(header)}  # Create a map for headers
        
        polymers = []  # List to hold all polymer data

        for row_idx in range(1, sheet.nrows):
            rowdata = sheet.row_values(row_idx)
            # Skip unfilled items
            if all(not rowdata[hmap[col]] for col in ['abbreviations', 'synonyms', 'tradenames']):
                continue
            
            # Construct polymer dictionary
            polymer = {
                "_id": rowdata[hmap['uSMILES']],
                "_stdname": rowdata[hmap['std_name']],
                "_density": rowdata[hmap['density(g/cm3)']],
                "_abbreviations": self.striplist(rowdata[hmap['abbreviations']].split(';')),
                "_synonyms": self.striplist(rowdata[hmap['synonyms']].split(';')),
                "_tradenames": self.striplist(rowdata[hmap['tradenames']].split(';')),
                "_boc": [self.bagOfChar(rowdata[hmap[col]]) for col in ['std_name']]
            }

            polymers.append(polymer)

        # Log the process
        logging.info("Finished processing polymer data. Sending to backend.")

       
        seedDatabase(collection="polymer", action="INSERTMANY", payload=polymers)
       


    # # prepare ChemProps.filler data
    def prepFiller(self):
        file_path = self.file_path("FillerRaw.xlsx")
        try:
            # Load the workbook using openpyxl
            wb = openpyxl.load_workbook(filename=file_path, data_only=True)
            sheet = wb.active  # Assume you're working with the first sheet

            headers = [cell.value for cell in sheet[1]]  # Get headers from the first row
            hmap = {h: i+1 for i, h in enumerate(headers)}  # Map headers to indices (1-based in openpyxl)

            fillers = []  # List to hold all filler data

            # Process each row in the sheet
            for row in sheet.iter_rows(min_row=2, values_only=True):  # Start from the second row
                filler_entry = {
                    "_id": row[hmap['std_name'] - 1],  # Adjust index for 0-based Python lists
                    "_density": row[hmap['density_g_cm3'] - 1],
                    "_alias": [row[hmap['nm_entry'] - 1]],
                    "_boc": [self.bagOfChar(row[hmap['std_name'] - 1]), self.bagOfChar(row[hmap['nm_entry'] - 1])]
                }

                # Check if the filler already exists in the list
                existing = next((item for item in fillers if item['_id'] == filler_entry['_id']), None)
                if existing:
                    existing['_alias'].append(row[hmap['nm_entry'] - 1])
                    existing['_boc'].append(self.bagOfChar(row[hmap['nm_entry'] - 1]))
                else:
                    fillers.append(filler_entry)

            # Log the process
            logging.info("Finished processing filler data. Sending to backend.")
            
            # Send the data to the backend using a hypothetical send_post_request function
            seedDatabase(collection="filler", action="INSERTMANY", payload=fillers)
           
            

        except Exception as e:
            logging.error(f"An error occurred while processing the Excel file: {e}")
            

    # remove leading and trailing white spaces
    def striplist(self, mylist):
        for i in range(len(mylist)):
            mylist[i] = mylist[i].strip()
        return mylist


    # a helper method to generate a bocStr for a string based on the occurrence
    # of the chars. Example: (a,b,c,...,y,z,0,1,2,3,4,5,6,7,8,9) to 101214...01
    def bagOfChar(self, myStr):
        bag = []
        for alphabet in string.ascii_lowercase:
            bag.append(str(myStr.lower().count(alphabet)))
        for number in string.digits:
            bag.append(str(myStr.lower().count(number)))
        return ''.join(bag)
    