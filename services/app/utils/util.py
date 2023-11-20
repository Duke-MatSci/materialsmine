import os
from app.config import Config
# Function to filter missing required request input
def filter_none(**kwargs):
    # type: (Any) -> Dict[str, Any]
    """Make dict excluding None values."""
    return {k: v for k, v in kwargs.items() if v is None}


# Function to read file from input
def pick_file(file_name, cb):
    # List all files in the directory
    files_in_directory = os.listdir(Config.FILES_DIRECTORY)

    # Loop through the list of files
    for file_name in files_in_directory:
        file_path = os.path.join(Config.FILES_DIRECTORY, file_name)

        # Check if it's a file (not a subdirectory)
        if os.path.isfile(file_path):
            if cb is not None:
                return cb(file_path)
            else:
                with open(file_path, 'r') as file:
                    file_content = file.read()
                    return file_content
    
    return None

def upload_files(args):
    uploaded_files = None
    if args.files:
        for file_key in args.files:
            file = args.files[file_key]
            if file and file.filename:
                save_path = os.path.join(Config.FILES_DIRECTORY, file.filename)
                file.save(save_path)
                uploaded_files = save_path
    
    return uploaded_files