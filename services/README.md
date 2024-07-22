# Running and Starting Managed Services Locally in Isolation

This document outlines the steps to run and start the managed services,
specifically Dynamfit and Chemprops, locally in isolation. Follow these
instructions to ensure that the services can be started independently from the
rest of the applications.

## Table of Contents

- [Installation](#installation)
- [Setting up and Starting Managed Services](#setting-up-and-starting-managed-services)
- [How to locally access the app](#how-to-locally-access-the-app)
- [API Endpoints](#api-endpoints)
  - [Dynamfit API Endpoints](#dynamfit-api-endpoints)
  - [Chemprops API Endpoints](#chemprops-api-endpoints)
- [Onboarding Your Own Python Application](#onboarding-your-own-python-application)
  - [Step 1: Create a New Directory for Your Application](#step-1-create-a-new-directory-for-your-application)
  - [Step 2: Create the Required Files](#step-2-create-the-required-files)
  - [Step 3: Define Your Routes](#step-3-define-your-routes)
  - [Step 4: Register the Blueprint](#step-4-register-the-blueprint)
  - [Step 5: Verify Your Application](#step-5-verify-your-application)
  - [Additional Logic Construction](#additional-logic-construction)
  - [Example of Adding Another Route](#example-of-adding-another-route)
  - [Set Environment Variables](#set-environment-variables)
- [Contact](#contact)

## Installation

1. Mac Users:
   - Make sure to install [docker](https://docs.docker.com/get-docker/) on your
     machine first, then `git clone` the repo

For Windows OS: - Be sure to run the Docker installer as an administrator - If
the Docker engine fails to start, install the latest WSL2 Linux kernel update
package by following Step 4
[here](https://docs.microsoft.com/en-us/windows/wsl/install-manual#step-4---download-the-linux-kernel-update-package)

2. > _IMPORTANT NOTICE:_ Install nvm. For windows PC click
   > [windows](https://learn.microsoft.com/en-us/windows/dev-environment/javascript/nodejs-on-windows#install-nvm-windows-nodejs-and-npm),
   > for Mac `brew install nvm`
3. Copy and run the command below:
   ```bash
   nvm install 16.20.0 && nvm use 16.20.0
   ```

## Setting up and Starting Managed Services

To run either Dynamfit or Chemprops, etc in isolation,

1. Navigate to `docker-compose.yml` file.
2. Comment out all the services in your `docker-compose.yml` except the
   following: a. proxy b. mongo c. api d. managed services
3. Create .env file at the root of the project
4. Add the following environment variables (Contact support for default env
   values)
   - **`MM_MONGO_USER`**: Root username for initializing MongoDB.
   - **`MM_MONGO_PWD`**: Root password for initializing MongoDB.
   - **`MONGO_DEVS`**: MongoDB username for development.
   - **`MONGO_DEV_PWD`**: MongoDB password for development.
   - **`MONGO_PORT`**: Port number for MongoDB.
   - **`MM_DB`**: Database name for the application.
   - **`DB_USERNAME`**: Username for the database (derived from `MONGO_DEVS`).
   - **`DB_PASSWORD`**: Password for the database (derived from
     `MONGO_DEV_PWD`).
   - **`MM_DB`**: Name of the MongoDB database for the application.
   - **`MONGO_ADDRESS`**: Address of the MongoDB server.
   - **`MONGO_PORT`**: Port number of the MongoDB server.
   - **`TKNS`**: Secret tokens used by the application.
   - **`FILES_DIRECTORY`**: Directory where files are stored.
   - **`ESADDRESS`**: Address of the Elasticsearch server.
   - **`PORT`**: Port number for the application.
   - **`WORKER_PORT`**: Port number for the worker service.
   - **`MINIO_PORT`**: Port number for the MinIO service.
   - **`MINIO_CONSOLE_PORT`**: Port number for the MinIO console.
   - **`MINIO_BUCKET`**: Name of the MinIO bucket.
   - **`MINIO_ROOT_USER`**: Root username for MinIO.
   - **`MINIO_ROOT_PASSWORD`**: Root password for MinIO.
   - **`ROUTER`**: Port number for the router service.
   - **`MM_RUNTIME_ENV`**: Runtime environment for the application (e.g.,
     development, production).
   - **`MM_USER`**: Username for the application.
   - **`MM_USER_EMAIL`**: User's email address for the application.
   - **`MM_AUTH_GIVEN_NAME_HEADER`**: Header for the given name in
     authentication.
   - **`MM_AUTH_DISPLAYNAME_HEADER`**: Header for the display name in
     authentication.
   - **`MM_AUTH_SURNAME_HEADER`**: Header for the surname in authentication.
   - **`MM_AUTH_EMAIL_HEADER`**: Header for the email in authentication.
   - **`MM_AUTH_USER_HEADER`**: Header for the user identifier in
     authentication.
   - **`KNOWLEDGE_ADDRESS`**: Address of the knowledge base service.
   - **`MAIL_SERVER_HOST`**: Host address of the email server.
   - **`MAIL_SERVER_PORT`**: Port number for the email server.
   - **`MAIL_USER_ADDRESS`**: Email address used for sending emails.
   - **`MAIL_USER_PASSWORD`**: Password for the email account used for sending
     emails.
   - **`TERM_OF_SERVICE`**: Terms of service for the application.
   - **`SWAGGER_CONTACT_NAME`**: Contact name for Swagger documentation.
   - **`SWAGGER_CONTACT_EMAIL`**: Contact email for Swagger documentation.
   - **`DEV_ENDPOINT`**: Endpoint for the development environment.
   - **`QA_SERVER_ENDPOINT`**: Endpoint for the QA (Quality Assurance)
     environment.
   - **`PROD_SERVER_ENDPOINT`**: Endpoint for the production environment.
   - **`MANAGED_SERVICE_ADDRESS`**: Address of the managed service.
   - **`SYSTEM_EMAIL`**: System email address for notifications.
   - **`DEPLOYMENT_ADDRESS`**: Address used for deployment.
   - **`DOCKER_HUB_ADDRESS`**: Address of the Docker Hub repository.
   - **`DEPLOYMENT_SECRET`**: Secret key used for deployment.
   - **`DYNAMFIT_TEST_FILE`**: Path to the test file for Dynamfit.
   - **`TKNS`**: Secret key for application security.
   - **`MANAGED_SERVICES_FILES_WORKING_DIR`**: Working directory for files used
     by managed services.
   - **`MANAGED_SERVICES_AUTH_API_TOKEN_EMAIL`**: Email address used for API
     token authentication.
   - **`MANAGED_SERVICES_AUTH_API_REFRESH_EMAIL`**: Email address used for API
     token refresh.
   - **`API_URL`**: Base URL for the API.
5. Copy and run the command below:
   ```bash
   npm run dev:start
   ```

## How to locally access the app

To access the Swagger documentation for the services, follow these steps:

1.  Ensure the services are running.
2.  Open your web browser.
3.  To interact with the app, access the docs here
    `http://localhost/api/api-docs/`
4.  All newly added applications to managed services should access the newly
    onboarded app through postman/insomnia via `http://localhost:5050`
5.  Both Chemprops and Dynamfit requires authentication for access, hence,
    generate a new auth token from swagger at `/mn/token`

## API Endpoints

Below are the API endpoints to initialize Dynamfit and Chemprops via Swagger:

### Dynamfit API Endpoints

- **POST /files/upload**: Upload file to the server and retrieve the file name
- **POST /mn/dynamfit**: Extracts data from a file(using the file name from
  previous call) and generates chart data..

### Chemprops API Endpoints

- **GET /mn/chemprops/init**: Initialize the Chemprops service.
- **POST /mn/chemprops**: Calls the nmChemPropsAPI with provided parameters.

## Onboarding Your Own Python Application

Follow the detailed steps below to onboard a new application into managed
services using the Blueprint model. We will use `myapp` as an example for this
process.

### Step 1: Create a New Directory for Your Application

1.  Navigate to the `services/app` directory.
2.  Create a new directory for your application. Ensure the name is a single
    word without hyphens, punctuation, or spaces. For this example, we will use
    `myapp`.

    ```bash
    cd services/app
    mkdir myapp
    ```

### Step 2: Create the Required Files

3.  Inside the `myapp` directory, create an `__init__.py` file.
4.  Create a `routes.py` file where you will declare your routes.

```bash
 cd myapp
 touch __init__.py
 touch routes.py
```

### Step 3: Define Your Routes

1.  Open the `routes.py` file.
2.  Import the required packages and modules.
3.  Define your base URL using the `Blueprint` object.
4.  Write your routes and the corresponding business logic.

Below is an example for `myapp`:

```python
# myapp/routes.py
from flask import Blueprint, jsonify

# Base URL for the application
myapp = Blueprint("myapp", __name__, url_prefix="/myapp")

#Define a sample route
@myapp.route('/first/', methods=['GET'])
def first_function():
	 # This is my first route
	 # I will be returning a sample "Hello, World!"
	 text = "Hello, World!"
	 return jsonify({"message": text})
```

### Step 4: Register the Blueprint

1.  Locate the `__init__.py` file directly inside the `app` directory:
    `app/__init__.py`.
2.  Scroll down to the section where other applications are registered.
3.  Below the last registered app, import your new application and register the
    blueprint.

Modify `app/__init__.py` as follows:

```python
# app/__init__.py
from flask import Flask

# Import other applications
# from app.otherapp.routes import otherapp

# Import your new application
from app.myapp.routes import myapp

def create_app():
app = Flask(__name__)

# Register other applications
# app.register_blueprint(otherapp)

# Register your new application above the main app
app.register_blueprint(myapp)
app.register_blueprint(main)

return app
```

### Step 5: Verify Your Application

1.  Start your Flask application.
2.  Access the URL `http://localhost:5050/myapp/first/` in your web browser.

You should see the following JSON response:

```json
{
  "message": "Hello, World!"
}
```

### Additional Logic Construction

This same structure can be used to construct other routes and business logic
within your `myapp` application. Define new routes in the `routes.py` file and
ensure they follow the same pattern for consistency and maintainability.

### Example of Adding Another Route

To add another route, simply follow the same pattern:

```python
# myapp/routes.py

@myapp.route('/second/', methods=['GET'])
def second_function():
    # This is my second route
    # I will be returning a sample "Hello, again!"
    text = "Hello, again!"
    return jsonify({"message": text})
```

Registering this route will allow you to access
`http://localhost:5050/myapp/second/`, which should return:

```json
{
  "message": "Hello, again!"
}
```

### **Set Environment Variables:**

Ensure that all required environment variables for your application are defined
in the `docker-compose.yml` file and points to `.env` file.

---

By following these steps, you can effectively onboard your new Python
application into the managed services using the Blueprint model, ensuring it is
well-integrated and easy to maintain.

---

### **Contact**

For further assistance or issues, please contact the development team or refer
to the official documentation.
