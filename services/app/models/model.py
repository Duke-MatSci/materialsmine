# app here refers to app.py in main working dir
from datetime import datetime
# Use for creating time sensitive tokens
from itsdangerous import TimedJSONWebSignatureSerializer as Serializer

from flask import current_app
# From app folder import db from __init__.py
from app import db, login_mgr
# It allows us to get all of the method e.g. isauthenticated, get_id(), etc from login_mgr
from flask_login import UserMixin

@login_mgr.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

# DB Models
class User(db.Model, UserMixin):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(20), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(60), nullable=False)
    image_file = db.Column(db.String(20), nullable=True, default='default.jpg')
    # the backref allows us to add that column to Post Model
    posts = db.relationship("Post", backref="author", lazy=True)

    # Generating the token
    def get_reset_token(self, expiry = 900):
        s = Serializer(current_app.config['SECRET_KEY'], expiry)
        return s.dumps({'user_id': self.id}).decode('utf-8')

    # The @static method, tells python not to expect any other arguement apart from token
    @staticmethod
    def verify_reset_token(token):
        s = Serializer(current_app.config['SECRET_KEY'])
        try:
            # get the value of the user id with ['user_id']
            user_id = s.loads(token)['user_id']
        except:
            return None
        return User.query.get(user_id)

    # Set a magic method, helps to print object out
    def __repr__(self):
        return f"User('{self.username}', '{self.email}', '{self.image_file}')"

class Post(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    # Use lowercase for referencing since it's inside foreignkey
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    title = db.Column(db.String(120), nullable=False)
    date_posted = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    content = db.Column(db.Text, nullable=False)

    # Set a magic method, helps to print object out
    def __repr__(self):
        return f"Post('{self.title}', '{self.date_posted}')"

class ChemPropsDto:
    id = db.Column(db.Integer, primary_key=True)
    StandardName = db.Column(db.Text, nullable=False)
    density = db.Column(db.Text, nullable=False)
    uSMILES = db.Column(db.Text, nullable=False)
    
    def __repr__(self):
        return f"ChemPropsDto('{self.id}', '{self.StandardName}', '{self.density}', '{self.uSMILES}')"
