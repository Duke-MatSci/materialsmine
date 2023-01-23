# From app folder import db inside the __init__.py
from flask import render_template, url_for, flash, redirect, request, Blueprint
from app import db, bcrypt
from app.users.forms import RegistrationForm, LoginForm, UpdateUserForm, RequestResetForm, PasswordResetForm
from app.models.model import User, Post
from flask_login import login_user, current_user, logout_user, login_required
from app.users.utils import save_picture, send_reset_email

users = Blueprint('users', __name__)

@users.route("/register", methods=['GET', 'POST'])
def registerx():
    if current_user.is_authenticated:
        return redirect(url_for("main.home"))
    form = RegistrationForm()
    if form.validate_on_submit():
        try:
            # We use decode to retrieve the hash as a string
            hash_password = bcrypt.generate_password_hash(form.password.data).decode('utf-8')
            user = User(username=form.username.data, email=form.email.data, password=hash_password)
            print('user prepared')
            db.session.add(user)
            print('user registered to session')
            db.session.commit()
            print('user committed')
            flash(f"Account created for {form.username.data}!", "success")
            return redirect(url_for('users.login'))
        except:
            flash(f"An error occured while creating this account!", "danger")
    return render_template("register.html", title="Register", form=form)

@users.route("/login", methods=['GET', 'POST'])
def login():
    return redirect('http://localhost/nm', code=301)
    # if current_user.is_authenticated:
    #     return redirect(url_for("main.home"))
    # form = LoginForm()
    # if form.validate_on_submit():
    #     try:
    #         acct = User.query.filter_by(email = form.email.data).first()
    #         if acct and bcrypt.check_password_hash(acct.password, form.password.data):
    #             login_user(acct, remember=form.remember.data)
    #             # Redirecting a user to a specific route if it exist in the URL args
    #             # Using the get method here, helps in case the next parameter doesn't exist in the URL
    #             needed_page = request.args.get("next")
    #             flash(f"Welcome {acct.username}!", "success")
    #             # Using a ternary conditional
    #             return redirect(needed_page) if needed_page else redirect(url_for("main.home"))
    #         else:
    #             flash(f"Login Failed. Please check your email and password", "danger")
    #     except:
    #         flash(f"Login Failed. Please check your email and password", "danger")
    # return render_template("login.html", title="Login", form=form)

@users.route("/logout")
def logout():
    logout_user()
    return redirect(url_for("main.home"))

# Protecting routes by passing login_required
@users.route("/account", methods=['GET', 'POST'])
@login_required
def account():
    edit_profile = False
    # Instantiate the form
    form = UpdateUserForm()
    args = request.args.get("edit")
    if args: 
        edit_profile = True
    if form.validate_on_submit():
        if form.picture.data:
            user_picture = save_picture(form.picture.data)
            current_user.image_file = user_picture
        current_user.username = form.username.data
        current_user.email = form.email.data
        db.session.commit()
        flash("Your account have been updated!", "success")
        return redirect(url_for("users.account"))
    elif request.method == 'GET':
        form.username.data = current_user.username
        form.email.data = current_user.email
    image_file=url_for("static", filename='images/profile/' + current_user.image_file)
    return render_template("account.html", title="Account Page", image_file=image_file, form=form, edit_profile=edit_profile)


@users.route("/request_reset", methods=['GET', 'POST'])
def reset_request():
    # Ensure they are logged out by enforcing a redirect
    if current_user.is_authenticated:
        return redirect(url_for('main.home'))
    form = RequestResetForm()
    if form.validate_on_submit():
        user = User.query.filter_by(email=form.email.data).first()
        send_reset_email(user)
        flash("An email has been sent with instructions to reset your password.", "info")
        return redirect(url_for("users.login"))
    return render_template("reset_request.html", title="Reset Request Form", form=form)


@users.route("/request_reset/<token>", methods=['GET', 'POST'])
def reset_password(token):
    if current_user.is_authenticated:
        return redirect(url_for('main.home'))
    user = User.verify_reset_token(token)
    if user is None:
        flash("That is an invalid or expired token", 'warning')
        return redirect(url_for("users.reset_request"))
    form = PasswordResetForm()
    if form.validate_on_submit():
        try:
            hash_password = bcrypt.generate_password_hash(form.password.data).decode('utf-8')
            user.password = hash_password
            db.session.commit()
            flash(f"Password updated successfully!", "success")
            return redirect(url_for('users.login'))
        except:
            flash(f"An error occured while updating your password. Try again!", "danger")
    return render_template("reset_password.html", title="Reset Password Form", form=form)