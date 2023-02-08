from flask import Blueprint
import json

main = Blueprint("main", __name__)


@main.route("/")
def home():
    return json.dumps({ "ManagedServices": "Trigger service on" })


@main.route("/about")
def about():
    return json.dumps({ "name": "Trigger service on", "env": "Managed Services", "version": "v1" })
