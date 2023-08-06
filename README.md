![](https://github.com/Duke-MatSci/materialsmine/workflows/CI/badge.svg?branch=develop&event=push)

# materialsmine
MaterialsMine App

## :high_brightness: Installation
Make sure to install [docker](https://docs.docker.com/get-docker/) on your machine first, then `git clone` the repo and run commands below to instantiate or terminate the application.

Windows OS: 
- Be sure to run the Docker installer as an administrator
- If the Docker engine fails to start, install the latest WSL2 Linux kernel update package by following Step 4 [here](https://docs.microsoft.com/en-us/windows/wsl/install-manual#step-4---download-the-linux-kernel-update-package)



# :warning: ADVISORY :warning:
> Before running the steps below, follow the steps [here](https://github.com/Duke-MatSci/materialsmine/blob/develop/resfulservice/misc/README.md) to retrieve and deploy required environment variables

> *IMPORTANT NOTICE:* Install nvm. For windows PC click [windows](https://learn.microsoft.com/en-us/windows/dev-environment/javascript/nodejs-on-windows#install-nvm-windows-nodejs-and-npm), for Mac `brew install nvm`

## :high_brightness: Testing
To avoid testing failure, install nvm & copy the command below and run in the project root directory.

```bash
npm i && cd app && npm i && cd ../resfulservice && npm i && cd ..
```

## :high_brightness: Starting All Application Services Options 1
Make sure nvm is installed with node >= v16.20.0 or run the command below to install the right node version:
```bash
 nvm install 16
```
Run the following command to start the applications from the root directory:
```bash
 npm run dev:start
```

## :high_brightness: Starting All Application Services Options 2
Run the following command from the root directory:

```bash
docker-compose build
```
Note: The build might stall at first try. If this occurs, repeat the previous step.


To start all services after the first or initial build
```bash
docker-compose up
```

If you prefer to start all services after the first or initial build in detachable mode
```bash
docker-compose up -d
```

To shutdown/terminate all services & unmount volumes
```bash
docker-compose down -v
```

## :high_brightness: Folder Structure
| :house: Root Directory | | |
| -  | :-: | - |
| :open_file_folder: app | Frontend Application | [Link](https://github.com/Duke-MatSci/materialsmine/tree/main/app) |
| :open_file_folder: nginx | A proxy server | [Link](https://github.com/Duke-MatSci/materialsmine/tree/main/router) |
| :open_file_folder: restfulservice | Backend Server Application | [Link](https://github.com/Duke-MatSci/materialsmine/tree/main/resfulservice) |
| :open_file_folder: services | Managed Services | WIP |
| :open_file_folder: whyis | Whyis Application | [Link](https://github.com/Duke-MatSci/materialsmine/tree/main/whyis) |

## :high_brightness: Access services via:
- Frontend: http://localhost
- Resful API: http://localhost/api
- Managed Services: http://localhost:5050
- Whyis: http://localhost:8000

## :high_brightness: Contributing to MaterialsMine:
1. File a new issue by selecting from and filling out one of our [issue templates](https://github.com/Duke-MatSci/materialsmine/issues/new/choose).
2. Make a new branch off of `develop` (unless working on an existing, in progress feature). This can be done directly from GitHub's issue page.

   General branch naming convention: `#<issue number>_short_but_specific_title` .
3. Before committing, run the full test suite by running `npm run test` from the root `materialsmine` directory.

   If you are adding a new feature, please create a unit test for that feature, either by using [Vue Test Utils](https://v1.test-utils.vuejs.org/) in `/app/tests/unit` for frontend features, or using [Chai](https://www.chaijs.com/) in `/resfulservice/spec` for backend.
4. Commit messages should follow Angular’s formatting guidelines, [described here](https://github.com/angular/angular/blob/main/CONTRIBUTING.md#-commit-message-format).
5. Push your branch to GitHub with `git push origin your_branch_name` .
6. In GitHub, send a pull request to `develop`. In your PR, describe your changes and [use a keyword](https://docs.github.com/en/issues/tracking-your-work-with-issues/linking-a-pull-request-to-an-issue#linking-a-pull-request-to-an-issue-using-a-keyword) to link the related issue (e.g., closes #999, fixes #001).
