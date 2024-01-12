from flask import Blueprint, jsonify

main = Blueprint("main", __name__)


@main.route("/")
def home():
    return jsonify({ "ManagedServices": "Trigger service on" })


@main.route("/about")
def about():
    return jsonify({ "name": "Trigger service on", "env": "Managed Services", "version": "v1" })