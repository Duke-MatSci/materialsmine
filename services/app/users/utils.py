# From app folder import app in the __init__.py
import os
from PIL import Image
import secrets
from flask import url_for, current_app
from app import mail
from flask_mail import Message

def save_picture(pic):
    print(pic)
    random_hex = secrets.token_hex(8)
    # f_name, f_ext = os.path.splitext(pic.filename)
    # To throw away the f_name 
    _, f_ext = os.path.splitext(pic.filename)
    image_fn = random_hex + f_ext
    image_path = os.path.join(current_app.root_path, 'static/images/profile', image_fn)
    # Resizing the Image on the fly
    output_size = (125, 125)
    i = Image.open(pic)
    i.thumbnail(output_size)
    i.save(image_path)
    os.remove(os.path.join(current_app.root_path, 'static/images/profile', current_user.image_file))
    return image_fn

def send_reset_email(user):
    token = user.get_reset_token()
    msg = Message(subject="Password Reset Request", recipients=[user.email], sender="tolu@rantblog.com")
    msg.body = f'''Hi { user.username.title() },
To reset your password, visit the following link: {url_for('users.reset_password', token=token, _external=True)}

If you did not make this request, then simply ignore this email and no changes will be made.
'''
    mail.send(msg)