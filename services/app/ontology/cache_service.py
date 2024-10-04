import json
import os
import datetime

# Define the cache file path and name.
CACHE_FILE = '/usr/src/files/mgs_materialsmin_data.json'

def check_cache(app, serve_out_dated=False):
    """Check if mgs_materialsmin_data.json exists and is not empty. Return the content if available."""
    app.logger.info("[check_cache]: Checking if mgs_materialsmin_data.json exists and is not empty.")
    if os.path.exists(CACHE_FILE) and os.path.getsize(CACHE_FILE) > 0:
        with open(CACHE_FILE, 'r', encoding='utf-8') as f:
            data = json.load(f)
            app.logger.info("[check_cache]: mgs_materialsmin_data.json exists and is not empty.")
        
            # Check if the cache has the 'lastUpdateDate' key
            if 'lastUpdateDate' not in data:
                app.logger.info("[check_cache]: lastUpdateDate not found in the mgs_materialsmin_data.json file.")
                return None
            
            # Parse the lastUpdateDate
            last_update_str = data['lastUpdateDate']
            last_update_date = datetime.datetime.strptime(last_update_str, "%Y-%m-%d").date()
            today = datetime.date.today()
            
            # Check if lastUpdateDate is less than today
            if last_update_date < today:
                app.logger.info("[check_cache]: lastUpdateDate is older than today. Cache is outdated.")
                if serve_out_dated:
                    app.logger.info("[check_cache]: Communication with github failed, Serving outdated data")
                    return data
                return None
            else:
                # app.logger.info("[check_cache]: lastUpdateDate is the same as today. Returning cached data.")
                return data
    else:
        app.logger.info("[check_cache]: mgs_materialsmin_data.json does not exist or is empty.")
        return None

def save_to_cache(app, data):
    """Save the data to mgs_materialsmin_data.json."""
    app.logger.info("[save_to_cache]: Saving data to cache.")
    with open(CACHE_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=4)
    app.logger.info('[save_to_cache]: Data cached successfully.')