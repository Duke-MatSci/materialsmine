from flask import Flask # type: ignore
from flask_cors import CORS # type: ignore
from app.config import Config
import logging
import sys


# TODO (@Tee): Enable the ones we need
# bcrypt = Bcrypt()
# mail = Mail()

def create_app(config_class = Config):
    try:
        app = Flask(__name__)
        app.config.from_object(config_class)
        CORS(app)

        # Configure logging
        app.logger.setLevel(logging.INFO)
        
        # Add a file handler
        file_handler = logging.FileHandler('/services/services_app.log')  # Log to a file
        formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
        file_handler.setFormatter(formatter)
        file_handler.setLevel(logging.INFO)  # Set log level for the file handler
        app.logger.addHandler(file_handler)
        
        try:
            from app.chemprops.routes import chemprops
            from app.dynamfit.routes import dynamfit
            from app.main.routes import main
            from app.ontology.routes import ontology
            from app.errors.handlers import error
            
            app.register_blueprint(chemprops)
            app.register_blueprint(dynamfit)
            app.register_blueprint(main)
            app.register_blueprint(ontology)
            app.register_blueprint(error)

        except (ImportError, ModuleNotFoundError) as e:
            app.logger.critical(f"Failed to import a module: {str(e)}")
            sys.exit(1)  # Exit gracefully

        return app

    except Exception as e:
        logging.critical(f"Application failed to start due to an unexpected error: {str(e)}", exc_info=True)
        sys.exit(1)  # Exit gracefully