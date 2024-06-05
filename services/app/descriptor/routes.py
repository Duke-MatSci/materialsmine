from flask import Blueprint, request, current_app
import json
import os
os.environ['OPENBLAS_NUM_THREADS'] = '1'
from app.utils.util import filter_none

descriptor = Blueprint("descriptor", __name__)

@descriptor.route("/descr-charact", methods=['GET'])
def descriptor_charact():
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

    ImageDimensions = str(jobParam['dimensions'])
    PhaseInfo = str(jobParam['phase'])

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

    matlabPgm = 'DescriptorCharacterize' # .m is implied, test mode will use python pgm
    mlab = matlab(logging) # create matlab object
    matlabPgmParams = (input_type,input_name,PhaseInfo,ImageDimensions)
    
    webBaseUri = "http://localhost"
    jobDataUriSuffix = "/api/files/jobs"
    
    rc = mlab.run(userId, jobId, jobType, jobSrcDir, jobDir, webBaseUri, jobDataUriSuffix, matlabPgm, matlabPgmParams)
    print('MATLAB return code - rc: ' + str(rc))

    # write job_output_parameters.json
    if rc ==0:
        file = open(jobDir+"/"+"job_output_parameters.json","w")
        file.write('{\n"inputFileName": "output/Input1.jpg",\n')
        file.write('"SDFPlot": "output/SDF_2D.jpg",\n')
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
        logging.info('exception reading descriptor characterization matlab job error messages')
        logging.info('exception: ' + traceback.format_exc())

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


@descriptor.route("/descr-reconstruct", methods=['GET'])
def descriptor_reconstruct():
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
        
    PhaseInfo = str(jobParam['phase'])

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

    matlabPgm = 'DescriptorReconstruct' # .m is implied, test mode will use python pgm
    mlab = matlab(logging) # create matlab object
    matlabPgmParams = (input_type,input_name,PhaseInfo)
    
    webBaseUri = "http://localhost"
    jobDataUriSuffix = "/api/files/jobs"
    
    rc = mlab.run(userId, jobId, jobType, jobSrcDir, jobDir, webBaseUri, jobDataUriSuffix, matlabPgm, matlabPgmParams)
    print('MATLAB return code - rc: ' + str(rc))

    # write job_output_parameters.json
    if rc ==0:
        file = open(jobDir+"/"+"job_output_parameters.json","w")
        file.write('{\n"inputFileName": "output/Input.jpg",\n')
        file.write('"CorrelationComparison": "output/Autocorrelation_comparison.jpg",\n')
        file.write('"ReconstructedFileName": "output/Slice.jpg",\n')
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
        logging.info('exception reading descriptor reconstruction matlab job error messages')
        logging.info('exception: ' + traceback.format_exc())

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