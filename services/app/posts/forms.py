from flask_wtf import FlaskForm
from wtforms import StringField, SubmitField, TextAreaField
from wtforms.validators import DataRequired, Length


class CreateNewPost(FlaskForm):
    title = StringField("Post Title", validators=[DataRequired(), Length(min=2, max=120)])
    content = TextAreaField("Content", validators=[DataRequired(), Length(min=2, max=520)])
    submit = SubmitField("Submit")
