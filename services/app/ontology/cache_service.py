import json
import os

# Define the cache file path and name.
CACHE_FILE = '/usr/src/files/mgs_materialsmin_data.json'

def check_cache(app):
    """Check if data.json exists and is not empty. Return the content if available."""
    app.logger.info("[check_cache]: Checking if data.json exists and is not empty.")
    if os.path.exists(CACHE_FILE) and os.path.getsize(CACHE_FILE) > 0:
        with open(CACHE_FILE, 'r', encoding='utf-8') as f:
            app.logger.info("[check_cache]: data.json exists and is not empty.")
            return json.load(f)
    app.logger.info("[check_cache]: data.json does not exist or is empty. Fetching data from GitHub.")
    return None

def save_to_cache(app, data):
    """Save the data to data.json."""
    app.logger.info("[save_to_cache]: Saving data to cache.")
    with open(CACHE_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=4)
    app.logger.info('[save_to_cache]: Data cached successfully.')