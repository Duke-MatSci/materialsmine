from flask import Blueprint, request
import json
import os
from app.utils.util import filter_none

# print("request args", request.args)
correlation = Blueprint("correlation", __name__)

@correlation.route("/corr-charact", methods=['GET'])
def correlation_charact():
    pgmName = request.args.get('pgmName', None, type=str)
    jobType = request.args.get('jobType', None, type=str)
    jobId = request.args.get('jobId', None, type=str)
    jobDir = request.args.get('jobDir', None, type=str)
    jobParam = request.args.get('jobParam', None)
    CorrelationType = str(jobParam['CorrelationType'])
    
    # Filter none from required input
    filtered_input = filter_none(pgmName=pgmName, jobType=jobType, jobId=jobId, jobDir=jobDir, jobParam=jobParam)
    if len(filtered_input):
        filtered = [k  for  k in  filtered_input.keys()]
        return json.dumps({"error": "Missing required query params - {}".format(','.join(filtered))})

    # TODO(XXX): Get user_id from token decryption
    userId = ""
    jobSrcDir = os.getcwd()
    
    myfiles = os.listdir(jobDir)
    myfiles = []
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

    if CorrelationType == 'Autocorrelation':
        correlation_type = '1'
    elif CorrelationType == 'Lineal Path Correlation':
        correlation_type = '2'
    elif CorrelationType == 'Cluster Correlation':
        correlation_type = '3'
    else:
        correlation_type = '4'

    matlabPgm = 'CorrelationCharacterize' # .m is implied, test mode will use python pgm
    # TODO: add matlab functionality
    mlab = matlab(logging) # create matlab object
    matlabPgmParams = (input_type,correlation_type,input_name)
    
    webBaseUri = "http://localhost"
    jobDataUriSuffix = "/api/files/jobs"
    
    rc = mlab.run(userId, jobId, jobType, jobSrcDir, jobDir, webBaseUri, jobDataUriSuffix, matlabPgm, matlabPgmParams)
    print('MATLAB return code - rc: ' + str(rc))

    # write job_output_parameters.json
    if rc ==0:
        file = open(jobDir+"/"+"job_output_parameters.json","w")
        file.write('{\n"inputFileName": "output/Input1.jpg",\n')
        file.write('"CorrelationPlot": "output/Correlation.jpg",\n')
        file.write('"zipFileName": "output/Results.zip",\n')
        file.write('"errors": "output/errors.txt"\n}')
        file.close()
    else:
        file = open(jobDir+"/"+"job_output_parameters.json","w")
        file.write('{\n"errors": "output/errors.txt"\n}')
        file.close()

    try:
        with open(jobDir+"/"+"output/errors.txt") as f:
            errmsgs = f.read()
        errmsgs = str.replace(errmsgs, '\n','<br/>\n')
    except:
        logging.info('exception reading matlab job error messages')
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

@correlation.route("/corr-reconstruct", methods=['GET'])
def correlation_reconstruct():
    pgmName = request.args.get('pgmName', None, type=str)
    jobType = request.args.get('jobType', None, type=str)
    jobId = request.args.get('jobId', None, type=str)
    jobDir = request.args.get('jobDir', None, type=str)
    jobParam = request.args.get('jobParam', None)
    NumOfReconstructions = str(jobParam['NumOfReconstructs'])
    CorrelationType = str(jobParam['CorrelationType'])
    
    # Filter none from required input
    filtered_input = filter_none(pgmName=pgmName, jobType=jobType, jobId=jobId, jobDir=jobDir, jobParam=jobParam)
    if len(filtered_input):
        filtered = [k  for  k in  filtered_input.keys()]
        return json.dumps({"error": "Missing required query params - {}".format(','.join(filtered))})

    # TODO(XXX): Get user_id from token decryption
    userId = ""
    jobSrcDir = os.getcwd()
    
    myfiles = os.listdir(jobDir)
    myfiles = []
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
    
    if CorrelationType == 'Autocorrelation':
        correlation_type = '1'
    elif CorrelationType == 'Lineal Path Correlation':
        correlation_type = '2'
    elif CorrelationType == 'Cluster Correlation':
        correlation_type = '3'
    else:
        correlation_type = '4'

    matlabPgm = 'CorrelationRecon' # .m is implied, test mode will use python pgm
    # TODO: add matlab functionality
    mlab = matlab(logging) # create matlab object
    matlabPgmParams = (input_type,input_name,NumOfReconstructions,correlation_type)
    
    webBaseUri = "http://localhost"
    jobDataUriSuffix = "/api/files/jobs"
    
    rc = mlab.run(userId, jobId, jobType, jobSrcDir, jobDir, webBaseUri, jobDataUriSuffix, matlabPgm, matlabPgmParams)
    print('MATLAB return code - rc: ' + str(rc))

    # write job_output_parameters.json
    if rc ==0:
        file = open(jobDir+"/"+"job_output_parameters.json","w")
        file.write('{\n"inputFileName": "output/Input1.jpg",\n')
        file.write('"ReconstructedFileName": "output/Reconstruct1.jpg",\n')
        file.write('"CorrelationComparison": "output/Correlation Comparison.jpg",\n')
        file.write('"zipFileName": "output/Results.zip",\n')
        file.write('"errors": "output/errors.txt"\n}')
        file.close()
    else:
        file = open(jobDir+"/"+"job_output_parameters.json","w")
        file.write('{\n"errors": "output/errors.txt"\n}')
        file.close()

    try:
        with open(jobDir+"/"+"output/errors.txt") as f:
            errmsgs = f.read()
        errmsgs = str.replace(errmsgs, '\n','<br/>\n')
    except:
        logging.info('exception reading matlab job error messages')
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