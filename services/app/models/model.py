import pymongo

class Database_Handler:
    def __init__(self, config):
        self.config = config
        self.client = pymongo.MongoClient(self._build_connection_string())
        self.database = self._get_or_create_database()

    def _build_connection_string(self):
        return f"mongodb://{self.config.MONGO_USER}:{self.config.MONGO_PASSWORD}" \
               f"@{self.config.MONGO_URI}:{self.config.MONGO_PORT}/{self.config.MONGO_DATABASE}"

    def _get_or_create_database(self):
        database = self.client[self.config.MONGO_DATABASE]
        if self.config.MONGO_DATABASE not in self.client.list_database_names():
            # Create the database and any required collections or initial data here
            try:
                self.chemprops_collection().insert_one({'test': 'data'})
                print("Connected to MongoDB, collection created")
            except Exception as e:
                print(f"Error creating managed services database: {e}")
        return database
