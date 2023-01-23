from flask_wtf import FlaskForm
from flask_wtf.file import FileField, FileAllowed
from flask_login import current_user
from wtforms import StringField, PasswordField, SubmitField, BooleanField
from wtforms.validators import DataRequired, Length, Email, EqualTo, ValidationError
from app.models.model import User

class RegistrationForm(FlaskForm):
    username = StringField("Username",validators=[DataRequired(), Length(min=2, max=20)])
    email = StringField("Email", validators=[DataRequired(), Email()])
    password = PasswordField("Password", validators=[DataRequired()])
    confirm_password = PasswordField("Confirm Password", validators=[DataRequired(), EqualTo("password")])
    submit = SubmitField("Sign Up")

    # Custom Validation
    def validate_username(self, username):
        user_exist = User.query.filter_by(username=username.data).first()
        if user_exist:
            raise ValidationError(f"{username.data} is already taken")
    def validate_email(self, email):
        user_exist = User.query.filter_by(email=email.data).first()
        if user_exist:
            raise ValidationError(f"{email.data} is already taken")

class LoginForm(FlaskForm):
    email = StringField("Email", validators=[DataRequired(), Email()])
    password = PasswordField("Password", validators=[DataRequired()])
    remember = BooleanField("Remember Me")
    submit = SubmitField("Login")
    

class UpdateUserForm(FlaskForm):
    username = StringField("Username",validators=[DataRequired(), Length(min=2, max=20)])
    email = StringField("Email", validators=[DataRequired(), Email()])
    picture = FileField("Update Profile Picture", validators=[FileAllowed(['jpg', 'png', 'jpeg'])])
    submit = SubmitField("Update")

    # Custom Validation
    def validate_username(self, username):
        if username.data != current_user.username:
            user_exist = User.query.filter_by(username=username.data).first()
            if user_exist:
                raise ValidationError(f"{username.data} is already taken")
    def validate_email(self, email):
        if email.data != current_user.email:
            user_exist = User.query.filter_by(email=email.data).first()
            if user_exist:
                raise ValidationError(f"{email.data} is already taken")


class RequestResetForm(FlaskForm):
    email = StringField("Email", validators=[DataRequired(), Email()])
    submit = SubmitField("Request Password Reset")

    def validate_email(self, email):
        user_exist = User.query.filter_by(email=email.data).first()
        if user_exist is None:
            raise ValidationError("There is no account for this user. Register First!")


class PasswordResetForm(FlaskForm):
    password = PasswordField("Password", validators=[DataRequired()])
    confirm_password = PasswordField("Confirm Password", validators=[DataRequired(), EqualTo("password")])
    submit = SubmitField("Reset Password")