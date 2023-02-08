import urllib.parse
import pymongo
from app.models.constant import CHEMPROPS_COLLECTION

# Creating empty class and passing pass to skip and runtime
class Database_Handler:
    def __init__(self, config):
        # Get config value
        self.db_user = urllib.parse.quote_plus(config.MONGO_USER)
        self.db_pass = urllib.parse.quote_plus(config.MONGO_PASSWORD)
        self.db_name = config.MONGO_DATABASE
        self.db_address = '{}:{}'.format(config.MONGO_URI, config.MONGO_PORT)
        self.mgs_user = config.MGS_USER
        self.mgs_pwd = config.MGS_PWD

        self.client = pymongo.MongoClient("mongodb://{}:{}@{}/{}?authSource=admin".format(self.db_user, self.db_pass, self.db_address, self.db_name))
        existing_databases = self.client.list_database_names()

        if self.db_name in existing_databases:
            self.client = pymongo.MongoClient("mongodb://{}:{}@{}/{}".format(self.mgs_user, self.mgs_pwd, self.db_address, self.db_name))
        else:
            try:
                print("Managed services database does not exist, creating...")
                self.client = pymongo.MongoClient("mongodb://{}:{}@{}/{}?authSource=admin".format(self.db_user, self.db_pass, self.db_address, self.db_name))
                
                # Create user for managed services DB
                self.client[self.db_name].command('createUser', self.mgs_user,  pwd=self.mgs_pwd, roles=[{'role': 'readWrite', 'db': self.db_name}])
            except pymongo.errors.OperationFailure:
                # Notice: This is not essential, but this type of failure occurs if the db user exist
                self.client = pymongo.MongoClient("mongodb://{}:{}@{}/{}".format(self.mgs_user, self.mgs_pwd, self.db_address, self.db_name))
        
        # pass created database in mgs_database
        self.mgs_database = self.client[self.db_name]

    def init_app(self, app):
        app.db = self.mgs_database
        return app

    # TODO (BINGYIN): Remove if not needed. This is an example 
    # to show that we can connect and return a specific collection
    def chemprops_collection(self):
        # TODO (@BINGYIN): provide the table name here. Change name from constant.py!
        return self.mgs_database['{}'.format(CHEMPROPS_COLLECTION)]