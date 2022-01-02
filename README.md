# materialsmine
MaterialsMine App

## :high_brightness: Installation
Make sure to install [docker](https://docs.docker.com/get-docker/) on your machine first & then git clone the repo and run `cmd` below to instantiate or terminate the application.
```bash
# Run the following command from the root directory:
# 1. Install npm @ root directory:
npm install

# 2. Build all services 
docker-compose build .

# To start all services after the first or initial build
docker-compose up

# To shutdown/terminate all services
docker-compose down
```

## :high_brightness: Testing
To avoid testing failure
```bash
# cd into app directory and run
npm install

# Also cd into restfulservice directory and run
npm install
```

## :high_brightness: Folder Structure
| :house: Root Directory | | |
| -  | :-: | - |
| :open_file_folder: app | Frontend Application | [Link](https://github.com/Duke-MatSci/materialsmine/tree/main/app) |
| :open_file_folder: restfulservice | Backend Server Application | [Link](https://github.com/Duke-MatSci/materialsmine/tree/main/resfulservice) |
| :open_file_folder: router | A proxy server | [Link](https://github.com/Duke-MatSci/materialsmine/tree/main/router) |
| :open_file_folder: whyis | Whyis Application | [Link](https://github.com/Duke-MatSci/materialsmine/tree/main/whyis) |