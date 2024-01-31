import urllib.parse
import pymongo
from flask import current_app as app
# from app.models.constant import CHEMPROPS_COLLECTION

class Database_Handler:
    def __init__(self, config):
        """
        Initializes the class with the specified configuration.

        Parameters:
            config (object): The configuration object.

        Returns:
            None
        """
        self.config = config
        try:
            self._initialize_database()
        except Exception as e:
            print(f"Error initializing database: {e}")

    def _initialize_database(self):
        """
        Initializes the database connection and sets up the
        necessary database and collections.

        Parameters:
            self (obj): The current instance of the class.

        Returns:
            None
        """
        connection_string = self._build_connection_string()
        self.client = pymongo.MongoClient(connection_string)
        self.mgs_database = self.client[self.config.MONGO_DATABASE]

        if self.config.MONGO_DATABASE not in self.client.list_database_names():
            self._create_managed_services_database()
        else:
            print("Connected to MongoDB, database exists")


    def _build_connection_string(self):
        """
        Builds a connection string for MongoDB using the provided
        configuration.

        Returns:
            str: The MongoDB connection string.
        """
        return "mongodb://{}:{}@{}:{}/{}?authSource=admin".format(
            urllib.parse.quote_plus(self.config.MONGO_USER),
            urllib.parse.quote_plus(self.config.MONGO_PASSWORD),
            self.config.MONGO_URI,
            self.config.MONGO_PORT,
            self.config.MONGO_DATABASE
        )

    def _create_managed_services_database(self):
        """
        Create and initialize the managed services database.

        This function connects to MongoDB and creates the database
        specified in the configuration.
        It then inserts a test document into the `chemprops` collection
        to ensure the database is functioning correctly.

        Parameters:
            self (object): The instance of the class.

        Returns:
            None
        """
        try:
            #mgs_database = self.client[self.config.MONGO_DATABASE]

            # list of collection names
            collection_names = ['chemprops', 'filler', 'polymer', 'ukfiller', 'ukpolymer']

            # Iterate through the collection names
            for collection_name in collection_names:
                current_collection = self.mgs_database[collection_name]
                current_collection.create_index([('_id', pymongo.TEXT)], name=collection_name, default_language='english')

            print("Connected to MongoDB, database created")
        except Exception as e:
            print(f"Error creating managed services database: {e}")

    def init_app(self, app):
        """
        Initializes the application by setting the database attribute
        of the app object to the MongoDB database.

        :param app: The Flask application object.
        :type app: Flask
        :return: The initialized Flask application object.
        :rtype: Flask
        """
        app.db = self.mgs_database
        return app
    