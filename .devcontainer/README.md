# Common Hosted Form Service - devcontainer

***fill this in with more detail***

## Purpose
The `devcontainer` is for developers to be up and running with a local version of CHEFS as quickly as possible. In order to run CHEFS you require Keycloak (configured), Postgresql (seeded) and the CHEFS backend/API and frontend/UX. Previously, this was a series of downloads and configuration updates and numerous commands to run.

In this container, we provide a preconfigured Keycloak, standup a Postgresql instance, load all required node libraries for backend and frontend (including building the formio components library) and convenient launch tasks to run and debug CHEFS.

## Running CHEFS locally
Keycloak and Postgresql will be launched using docker compose. These will run inside of the devcontainer (docker-in-docker) but the ports are forwarded to the host machine and are accessible on the local host.

CHEFS API and Frontend are running as node applications on the devcontainer - again, ports are forwarded to the host.

1. start Keycloak and Postgresql. Many ways to start... 
    - right click on `.devcontainer/chefs_local/docker-compose.yml` and select `Compose up`
    - or use command palette `Docker: Compose Up` then select `.devcontainer/chefs_local/docker-compose.yml`
    - or `Terminal | Run Task...|chefs_local up`
2. start CHEFS
    - Run and Debug, select 'CHEFS' which will start both the API and the frontend.
3. debug Frontend with Chrome
    - Run and Debug, select 'CHEFS Frontend - chrome' which will start a Chrome browser against the frontend, will allow breakpoints in `/app/frontend/src`

## Troubleshooting
All development machines are unique and here we will document problems that have been encountered and how to fix them.

### Failure during load of devcontainer when running webpack (Segmentation Fault)
Encountered on Mac Ventura 13.6, with Mac Docker Desktop 4.26.1 when running `npm run build:formio` on load, we hit a `Segmentation Fault`. The issue was resolved when turning off the virtualization settings in Docker Desktop.

Under Settings, select `gRPC Fuse` instead of `VirtioFS` then unselect `Use Virtualization framework`. Restart Docker and VS Code.