import urllib.parse
import pymongo
from flask import current_app as app
from app.models.constant import CHEMPROPS_COLLECTION

class Database_Handler:
    def __init__(self, config):
        self.config = config
        try:
            self._initialize_database()
        except Exception as e:
            #app.logger.error(f"Error initializing database: {e}")
            print(f"Error initializing database: {e}")

    def _initialize_database(self):
        connection_string = self._build_connection_string()
        self.client = pymongo.MongoClient(connection_string)
        self.mgs_database = self.client[self.config.MONGO_DATABASE]

        if self.config.MONGO_DATABASE not in self.client.list_database_names():
            self._create_managed_services_database()

        #app.logger.info("Connected to MongoDB: {}".format(connection_string))
        print("Connected to MongoDB") # : {}".format(connection_string))

    def _build_connection_string(self):
        return "mongodb://{}:{}@{}:{}/{}?authSource=admin".format(
            urllib.parse.quote_plus(self.config.MONGO_USER),
            urllib.parse.quote_plus(self.config.MONGO_PASSWORD),
            self.config.MONGO_URI,
            self.config.MONGO_PORT,
            self.config.MONGO_DATABASE
        )

    def _create_managed_services_database(self):
        # print("Managed services database does not exist, creating...")
        try:
            database = self.client[self.config.MONGO_DATABASE]
            existing_users = database.command('usersInfo')
            
            user_exists = any(user['user'] == self.config.MGS_USER for user in existing_users['users'])
            
            if not user_exists:
                database.command(
                    'createUser',
                    self.config.MGS_USER,
                    pwd=self.config.MGS_PWD,
                    roles=[{'role': 'readWrite', 'db': self.config.MONGO_DATABASE}]
                )
        except Exception as e:
            print(f"Error creating managed services database: {e}")



    def init_app(self, app):
        app.db = self.mgs_database
        return app

    def chemprops_collection(self):
        return self.mgs_database[CHEMPROPS_COLLECTION]