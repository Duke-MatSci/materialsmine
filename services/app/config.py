import os
os.environ['OPENBLAS_NUM_THREADS'] = '1'
from dotenv import load_dotenv # type: ignore

load_dotenv(".env")
class Config:
    # The Secret_key handles CRSS/XSS attacks 
    SECRET_KEY = os.environ.get('SECRET_KEY')
    MAIL_SERVER = 'smtp.googlemail.com'
    MAIL_PORT = 587
    MAIL_USE_TLS = True
    MGS_PWD = os.environ.get('MANAGED_SERVICES_PWD', '')
    EMAIL_API_TOKEN = os.environ.get('AUTH_API_TOKEN_EMAIL', '')
    EMAIL_REFRESH_TOKEN = os.environ.get('AUTH_API_REFRESH_EMAIL', '')
    FILES_DIRECTORY = os.environ.get('FILES_WORKING_DIR', '/usr/src/files')
    ALLOWED_EXTENSIONS = set(['tsv', 'csv'])
    API_SERVICES = os.environ.get('API_URL', 'http://restful:3001')
    GITHUB_USERNAME = os.environ.get('GITHUB_USERNAME')
    GITHUB_TOKEN = os.environ.get('GITHUB_TOKEN')
    REPO_OWNER = os.environ.get('REPO_OWNER')
    REPO_NAME = os.environ.get('REPO_NAME')
    FILE_PATH = os.environ.get('FILE_PATH')
    BRANCH = os.environ.get('BRANCH')