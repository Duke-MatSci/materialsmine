from flask import request, Blueprint

errors = Blueprint("errors", __name__)

@errors.route('/404')
def notFoundError(opts: dict = {message: 'Page Not Found', desc: ''}):
    return "{}, {}".format(opts.message, opts.desc)
