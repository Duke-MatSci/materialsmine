from flask import request, Blueprint
import json

from app.dynamfit.dynamfit2 import upload_init, update_line_chart
# use this to handle file upload input
from app.utils.util import pick_file, upload_files

dynamfit = Blueprint("dynamfit", __name__)


@dynamfit.route("/dynamfit", methods=['GET'])
@dynamfit.route("/dynamfit", methods=['POST'])
@dynamfit.route("/dynamfit/upload", methods=['POST'])
def update_upload_data():
    contents = upload_files(request)
    if contents is not None:
        response = upload_init(contents)
        return json.dumps({ "data": response })
    else: 
        return json.dumps({ "Error": "No content upload", "version": "v1" })

@dynamfit.route("/dynamfit/update", methods=['POST'])
def user_update():
    request_body = request.form
    response = update_line_chart(request_body)
    return json.dumps({ "data": response })
    # return request_body



# @dynamfit.route("/dynamfit/about")
# def about():
#     return json.dumps({ "name": "Trigger service on", "env": "Managed Services", "version": "v1" })
