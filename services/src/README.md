# materialsmine
MaterialsMine managed service directory

## :high_brightness: Adding a new service
Create a new folder to add a new service/module. DO NOT put `*.py` file the in src or root directory of the services folder. The only `*.py` file allowed in the src directory is the `app.py` file.


```bash
# Run the following command from the root directory:
# 1. Change directory to services directory
cd services

# 2. Build all services 
docker-compose build

# To start the services after the first or initial build
docker-compose up

# To start services after the first or initial build in detachable mode
docker-compose up -d

# To shutdown/terminate all services
docker-compose down -v
```

## :high_brightness: Testing
To avoid testing failure
```bash
# cd into app directory and run
npm install

# Also cd into restfulservice directory and run
npm install
```

## :high_brightness: Access managed services via:
- managedservices: http://localhost:9090