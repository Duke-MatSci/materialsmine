![](https://github.com/Duke-MatSci/materialsmine/workflows/CI/badge.svg?branch=develop&event=push)

# materialsmine
MaterialsMine App

## :high_brightness: Installation
Make sure to install [docker](https://docs.docker.com/get-docker/) on your machine first & then git clone the repo and run `cmd` below to instantiate or terminate the application.

Windows OS: 
- Be sure to run the Docker installer as an administrator
- If the Docker engine fails to start, install the latest WSL2 Linux kernel update package by following Step 4 [here](https://docs.microsoft.com/en-us/windows/wsl/install-manual#step-4---download-the-linux-kernel-update-package)



# :warning: ADVISORY :warning:
> Before running the steps below, follow the steps [here](https://github.com/Duke-MatSci/materialsmine/blob/develop/resfulservice/misc/README.md) to retrieve and deploy required environment variables


```bash
# Run the following command from the root directory:
# 1. Install npm @ root directory:
npm install

# 2. Build all services 
docker-compose build

# Note:
# The build might stall at first try. If this occurs, repeat the previous step.

# To start all services after the first or initial build
docker-compose up

# To start all services after the first or initial build in detachable mode
docker-compose up -d

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
| :open_file_folder: nginx | A proxy server | [Link](https://github.com/Duke-MatSci/materialsmine/tree/main/router) |
| :open_file_folder: restfulservice | Backend Server Application | [Link](https://github.com/Duke-MatSci/materialsmine/tree/main/resfulservice) |
| :open_file_folder: whyis | Whyis Application | [Link](https://github.com/Duke-MatSci/materialsmine/tree/main/whyis) |

## :high_brightness: Access services via:
- Frontend: http://localhost:80
- Resful API: http://localhost:80/api
- Whyis: http://localhost:80/whyis
