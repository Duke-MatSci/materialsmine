from flask import Blueprint, request, current_app
import json
import os
from app.utils.util import filter_none

otsu = Blueprint("otsu", __name__)

@otsu.route("/otsu", methods=['GET'])
def call_otsu():
    pgmName = request.args.get('pgmName', None, type=str)
    jobType = request.args.get('jobType', None, type=str)
    jobId = request.args.get('jobId', None, type=str)
    jobDir = request.args.get('jobDir', None, type=str)
    jobParam = request.args.get('jobParam', None)

    # Filter none from required input
    filtered_input = filter_none(pgmName=pgmName, jobType=jobType, jobId=jobId, jobDir=jobDir, jobParam=jobParam)
    if len(filtered_input):
        filtered = [k  for  k in  filtered_input.keys()]
        return json.dumps({"error": "Missing required query params - {}".format(','.join(filtered))})

    paramFile = open(jobDir + '/' + 'job_parameters.json', 'r')
    inputParameters = json.load(paramFile)
    userId = str(inputParameters['user'])
    sentInJobType = inputParameters['jobtype']
    WindowSize = "3"
    KValue = "-0.2"
    OffsetValue = "0"

    if 'WindowSize' in inputParameters:
        WindowSize = str(inputParameters['WindowSize'])

    if 'KNiblack' in inputParameters:
        KValue = str(inputParameters['KNiblack'])

    if 'OffsetNiblack' in inputParameters:
        OffsetValue = str(inputParameters['OffsetNiblack'])

    # TODO(XXX): Get user_id from token decryption
    userId = ""
    jobSrcDir = os.getcwd()

    myfiles = os.listdir(jobDir)
    for f in myfiles:
        print('  ' + f)
        #check file type and set appropriate flag for MATLAB
        if f.endswith(".zip"):
            input_type = '2'
            input_name = f
        elif f.endswith(".mat"):
            input_type = '3'
            input_name = f
        elif f.lower().endswith((".jpg",".png",".tif")):
            input_type = '1'
            input_name = f
    
    matlabPgm = 'Otsu' # .m is implied, test mode will use python pgm
    if sentInJobType == 'niblack':
        matlabPgm = 'niblack'
    mlab = matlab(logging) # create matlab object
    matlabPgmParams = (input_type,input_name)
    if sentInJobType == 'niblack':
        matlabPgmParams = (input_type, input_name, WindowSize, KValue, OffsetValue)

    webBaseUri = "http://localhost"
    jobDataUriSuffix = "/api/files/jobs"

    rc = mlab.run(userId, jobId, jobType, jobSrcDir, jobDir, webBaseUri, jobDataUriSuffix, matlabPgm, matlabPgmParams)
    print('MATLAB return code - rc: ' + str(rc))


    # write job_output_parameters.json
    if rc == 0:
        files = []
        batchname = jobDir+'/output/Batch_data.csv'
        try:
            csvfile = open(batchname, 'r')
            lines = csvfile.readlines()
            i = 1 # skip first line (0) since it contains headers
            while i < len(lines):
                line = lines[i].strip()
                f = line.split(',')
                files.append([f[1],f[2]]) # f[0] is original input file name
                logging.debug('files: ' + str(files))
                i += 1
        except:
            logging.debug('exception opening ' + batchname + '. Handling as single input file instead. ex: ' + traceback.format_exc())
            files.append(['Input1.jpg', 'Binarized_Input1.jpg']) # default to single image version, but still use array of 1

        file = open(jobDir+"/"+"job_output_parameters.json","w")
        file.write('{\n')
        file.write('  "files": [\n')
        i = 0
        while i < len(files):
            f = files[i]
            file.write('    {\n')
            file.write('      "input": "output/' + f[0] +'",\n')
            file.write('      "output": "output/' + f[1] + '"\n')
            file.write('    }')
            if (i < (len(files) - 1)):
                file.write(',')
            file.write('\n')
            i += 1
        # after loop, close the array
        file.write('  ],\n')
        file.write('  "zipFileName": "output/Results.zip",\n')  # NOTE. For some reason no results.zip is actually generated, so it does not exist
        file.write('  "errors": "output/errors.txt"\n')
        file.write('}\n')
        file.close()

    else: # if rc != 0
        file = open(jobDir+"/"+"job_output_parameters.json","w")
        file.write('{\n"errors": "output/errors.txt"\n}')
        file.close()

    try:
        with open(jobDir+"/"+"output/errors.txt") as f:
            errmsgs = f.read()
        errmsgs = str.replace(errmsgs, '\n','<br/>\n')
    except:
        logging.info('exception reading otsu matlab job error messages')
        logging.info('exception: ' + traceback.format_exc())
        errmsgs = ''

    # TODO(xxx): We initially send email from here, but now it should be handled by the api that makes the call
    return json.dumps({
        "jobId": jobId,
        "jobType": jobType,
        "status": "success", # Intitially 'emailtemplatename'
        "response": { # Initially 'emailvars'
            "result_link": "",
            "job_info": {
                "code": rc
            }
        }
    })
