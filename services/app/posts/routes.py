# From app folder import db in the __init__.py
from flask import render_template, url_for, flash, redirect, request, abort, Blueprint
from app import db
from app.posts.forms import CreateNewPost
from app.models.model import Post, User
from flask_login import current_user, login_required

posts = Blueprint("posts", __name__)


@posts.route("/post/new", methods=['GET', 'POST'])
@login_required
def new_post():
    form = CreateNewPost()
    if form.validate_on_submit():
        post = Post(title=form.title.data, content=form.content.data, author=current_user)
        db.session.add(post)
        db.session.commit()
        flash('Your post has been created!', 'success')
        return redirect(url_for("main.home"))
    return render_template("create_post.html", title="New Post", form=form, legend="New Post")


# @app.route("/post/<post_id>")
# if we know what to expect, like in this case an integer, you can pass the "int:"
@posts.route("/post/<int:post_id>")
def post(post_id):
    # post = Post.query.get(post_id)
    # or use the "get_or_404" i.e. return if it exist or return 404 if not
    post = Post.query.get_or_404(post_id)
    return render_template("post.html", title=post.title, post=post)

@posts.route("/post/<int:post_id>/update", methods=['GET', 'POST'])
@login_required
def update_post(post_id):
    post = Post.query.get_or_404(post_id)
    if post.author != current_user:
        abort(403)
    form = CreateNewPost()
    if form.validate_on_submit():
        post.title = form.title.data
        post.content = form.content.data
        db.session.commit()
        flash("Your post has been updated!", "success")
        return redirect(url_for("posts.post", post_id=post.id))
    elif request.method == "GET":
        form.title.data = post.title
        form.content.data = post.content
    return render_template("create_post.html", title="Update Post", form=form, legend="Update Post")


@posts.route("/post/<int:post_id>/delete", methods=['POST'])
@login_required
def delete_post(post_id):
    post = Post.query.get_or_404(post_id)
    if post.author != current_user:
        abort(403)
    db.session.delete(post)
    db.session.commit()
    flash("Your post has been deleted!", "success")
    return redirect(url_for("main.home"))


@posts.route("/<string:username>")
@posts.route("/user/<string:username>")
@login_required
def user_posts(username):
    # Get the user by username, select first or 404 if not available
    page = request.args.get('page', 1, type=int)
    user = User.query.filter_by(username=username).first_or_404()
    # We can break the line by adding a back slash
    # posts = Post.query.order_by(Post.date_posted.desc()).paginate(per_page=5, page=page)
    posts = Post.query.filter_by(author=user) \
        .order_by(Post.date_posted.desc()) \
        .paginate(per_page=5, page=page)
    return render_template("user_posts.html", posts=posts, user=user, title=f"{user.username.title()}'s Posts")


