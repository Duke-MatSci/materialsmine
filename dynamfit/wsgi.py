"""Application entry point."""
# from flaskdynamfit import init_app


# app = init_app()
# from app.dynamfit2 import app
# from .dynamfit2app.dynamfit2 import app
from app.dynamfit2 import app
application = app.server

if __name__ == "__main__":
    app.run(host='0.0.0.0', debug=True)
    # app.run()