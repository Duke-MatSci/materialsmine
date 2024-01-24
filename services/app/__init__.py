from flask import Flask
from flask_cors import CORS
from app.config import Config
import logging


def create_app(config_class = Config):
    app = Flask(__name__)
    app.config.from_object(config_class)
    CORS(app)
    
    # Configure logging
    app.logger.setLevel(logging.INFO)

    # Add a file handler
    file_handler = logging.FileHandler('services_app.log')  # Log to a file named services_app.log
    file_handler.setLevel(logging.INFO)  # Set log level for the file handler
    app.logger.addHandler(file_handler) 

    from app.errors.handlers import error
    from app.main.routes import main
    from app.dynamfit.routes import dynamfit
    
    app.register_blueprint(error)
    app.register_blueprint(dynamfit)
    app.register_blueprint(main)

    return app