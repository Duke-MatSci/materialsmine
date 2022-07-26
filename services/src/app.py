from flask import Flask
app = Flask(__name__)

@app.route("/")
def welcome():
    return "Welcome to managed services!"

if __name__ == "__main__":
    app.run(host='0.0.0.0')

# Why you should run it at 0.0.0.0
# https://stackoverflow.com/questions/30323224/deploying-a-minimal-flask-app-in-docker-server-connection-issues