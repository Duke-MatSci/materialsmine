# This is where we initialize our application and bring together different component
from flask import Flask
from flask_mail import Mail
from flask_bcrypt import Bcrypt
from flask_cors import CORS
from app.config import Config
from app.models.model import Database_Handler

# Connect Database
db = Database_Handler(Config)

bcrypt = Bcrypt()
mail = Mail()

def create_app(config_class = Config):
    app = Flask(__name__)
    app.config.from_object(Config)
    bcrypt.init_app(app)
    mail.init_app(app)
    db.init_app(app)
    CORS(app)    

    from app.chemprops.routes import chemprops
    from app.intellicharact.routes import icharact
    from app.correlation.routes import correlation
    from app.main.routes import main

    app.register_blueprint(chemprops)
    app.register_blueprint(icharact)
    app.register_blueprint(correlation)
    app.register_blueprint(main)

    return app