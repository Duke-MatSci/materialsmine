# This is where we initialize our application and bring together different component
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_mail import Mail
from flask_bcrypt import Bcrypt
from flask_login import LoginManager
from app.config import Config




# Create the DB instance with SQLAlchemy
db = SQLAlchemy()

bcrypt = Bcrypt()

login_mgr = LoginManager()
# Setting the default login page for loginMgr. The "login" passed is the name of the function in the users/route.py
# It redirects the user if they are not logged in to login page and request they log in
login_mgr.login_view = "users.login"
# Setting a CSS class for displayed message if user is not logged in. "info" is a CSS class in bootstrap
login_mgr.login_message_category = "info"


mail = Mail()




def create_app(config_class = Config):
    app = Flask(__name__)
    app.config.from_object(Config)

    db.init_app(app)
    bcrypt.init_app(app)
    login_mgr.init_app(app)
    mail.init_app(app)

    from app.chemprops.routes import chemprops
    from app.users.routes import users
    from app.posts.routes import posts
    from app.main.routes import main

    app.register_blueprint(chemprops)
    app.register_blueprint(users)
    app.register_blueprint(posts)
    app.register_blueprint(main)

    return app