# This is where we initialize our application and bring together different component
from flask import Flask
# from flask_mail import Mail
# from flask_bcrypt import Bcrypt
from flask_cors import CORS
from app.config import Config
from app.models.model import Database_Handler
import logging

# TODO (@Tee): Enable the ones we need
# bcrypt = Bcrypt()
# mail = Mail()

def create_app(config_class = Config):
    app = Flask(__name__)
    app.config.from_object(config_class)
    # bcrypt.init_app(app)
    # mail.init_app(app)

    # Initialize database handler
    # app.db = Database_Handler(config_class)
    CORS(app)
    
    # Configure logging
    app.logger.setLevel(logging.INFO)  # Set log level to INFO

    # Add a file handler
    file_handler = logging.FileHandler('services_app.log')  # Log to a file named services_app.log
    file_handler.setLevel(logging.INFO)  # Set log level for the file handler
    app.logger.addHandler(file_handler) 

    # from app.chemprops.routes import chemprops
    # from app.intellicharact.routes import icharact
    # from app.otsu.routes import otsu
    # from app.descriptor.routes import descriptor
    # from app.correlation.routes import correlation
    from app.dynamfit.routes import dynamfit
    from app.main.routes import main

    # app.register_blueprint(chemprops)
    # app.register_blueprint(icharact)
    # app.register_blueprint(otsu)
    # app.register_blueprint(descriptor)
    # app.register_blueprint(correlation)
    app.register_blueprint(dynamfit)
    app.register_blueprint(main)

    return app