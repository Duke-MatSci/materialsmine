import requests
import base64
from app.config import Config

GITHUB_USERNAME = Config.GITHUB_USERNAME
GITHUB_TOKEN = Config.GITHUB_TOKEN
REPO_OWNER = Config.REPO_OWNER
REPO_NAME = Config.REPO_NAME
FILE_PATH = Config.FILE_PATH
BRANCH = Config.BRANCH

# Construct the URL to get the file content
file_url = f'https://api.github.com/repos/{REPO_OWNER}/{REPO_NAME}/contents/{FILE_PATH}?ref={BRANCH}'
# Construct the URL to get the commits for the file
commits_url = f'https://api.github.com/repos/{REPO_OWNER}/{REPO_NAME}/commits?path={FILE_PATH}&sha={BRANCH}'

def make_github_request(url, app):
    try:
        response = requests.get(url, auth=(GITHUB_USERNAME, GITHUB_TOKEN))
        if response.status_code == 200:
            return response.json()
        elif response.status_code == 429:
            app.logger.error(f'[make_github_request]: Rate limit exceeded. Please try again later.')
            return None
        else:
            app.logger.error(f'[make_github_request]: Failed request ({response.status_code}): {response.text}')
            return None
    except requests.RequestException as e:
        app.logger.error(f'[make_github_request]: Network error - {str(e)}')
        return None

def download_file(app):
    app.logger.info("[download_file]: Connecting to GitHub to download file")
    
    file_content_json = make_github_request(file_url, app)
    if file_content_json and 'content' in file_content_json:
        try:
            file_content_decoded = base64.b64decode(file_content_json['content']).decode('utf-8')
            
            # Save the file locally
            with open('/usr/src/files/mgs_materialsmine.ttl', 'w', encoding='utf-8') as file:
                file.write(file_content_decoded)
            app.logger.info("[download_file]: File downloaded successfully.")
            return True
        except Exception as e:
            app.logger.error(f'[download_file]: Error decoding or saving file content - {str(e)}')
            return False
    else:
        app.logger.error('[download_file]: Failed to retrieve or decode file content.')
        return False

def get_commit_dates(app):
    app.logger.info("[get_commit_dates]: Fetching last commit dates.")
    
    commits_json = make_github_request(commits_url, app)
    if commits_json:
        if commits_json:
            submissions = []
            total_commits = len(commits_json)
            # Start from the oldest commit, so the oldest gets 1.0 and newer commits get incremented versions
            for i, commit in enumerate(reversed(commits_json)):
                version_number = "1.0" if i == 0 else f"1.{i}"
                description = "Parsed, Indexed, Metrics, Annotator, Error Diff" if i == (total_commits - 1) else "Archived"
                
                submission = {
                    "version": version_number,
                    "description": description,
                    "released": commit['commit']['committer']['date'],
                    "uploaded": commit['commit']['committer']['date']
                }
                
                submissions.append(submission)  
            
            submissions.reverse()
            
            return submissions
        else:
            app.logger.info('[get_commit_dates]: No commits found for this file.')
            return []
    else:
        app.logger.error('[get_commit_dates]: Failed to retrieve commits.')
        return []