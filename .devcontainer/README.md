# CHEFS Development with Dev Container

The following guide will get you up and running and developing/debugging CHEFS as quickly as possible.
We provide a [`devcontainer`](https://containers.dev) and will use [`VS Code`](https://code.visualstudio.com) to illustrate.

By no means is CHEFS development limited to these tools; they are merely examples.

## Caveats

The primary use case for this `devcontainer` is for developing, debugging and unit testing CHEFS source code.

There are limitations running this devcontainer, such as all networking is within this container. This container has [docker-in-docker](https://github.com/microsoft/vscode-dev-containers/blob/main/script-library/docs/docker-in-docker.md) which allows running demos, building docker images, running `docker compose` all within this container.

## Files

The `.devcontainer` folder contains the `devcontainer.json` file which defines this container. We are using a `Dockerfile` and `post-install.sh` to build and configure the container run image. The `Dockerfile` is simple but in place for simplifying image enhancements. The `post-install.sh` will install the required node libraries for CHEFS including the frontend and formio components.

In order to run CHEFS you require Postgresql (seeded) and the CHEFS backend/API and frontend/UX - optionally you will use a [NATS](https://nats.io/) server for event streaming. Previously, this was a series of downloads and configuration updates and numerous commands to run. See `.devcontainer/chefs_local` files.

**NODE_CONFIG_DIR** to simplify loading a default configuration to the CHEFS infrastructure (Postgresql, etc), we set an environment variable [`NODE_CONFIG_DIR`](https://github.com/node-config/node-config/wiki/Environment-Variables#node_config_dir). This supercedes the files found under `app/config`. Running node apps and commands (ex. knex, launch configurations) will use this environment variable and load configuration from `.devcontainer/chefs_local`.

Also included are convenient launch tasks to run and debug CHEFS.

## Open CHEFS in the devcontainer

To open CHEFS in a devcontainer, we open the _root_ of this repository. We can open in 2 ways:

1. Open Visual Studio Code, and use the Command Palette and use `Dev Containers: Open Folder in Container...`
2. Open Visual Studio Code and `File|Open Folder...`, you should be prompted to `Reopen in Container`.

## Running CHEFS locally

Postgresql will be launched using docker compose. These will run inside of the devcontainer (docker-in-docker) but the ports are forwarded to the host machine and are accessible on the local host.

CHEFS API and Frontend are running as node applications on the devcontainer - again, ports are forwarded to the host.

### Configuring CHEFS locally

When the devcontainer is built, it copies `.devcontainer/chefs_local/local.sample.json` to `.devcontainer/chefs_local/local.json`. This copy is not checked in and allows the developer to make changes and tweaks without impacting other developers or accidentially committing passwords.

### Authorization Prerequisites

1.  An IDIR account is required to access CHEFS.

### Run/Debug

1. start Postgresql and NATS. Many ways to start...
   - right click on `.devcontainer/chefs_local/docker-compose.yml` and select `Compose up`
   - or use command palette `Docker: Compose Up` then select `.devcontainer/chefs_local/docker-compose.yml`
   - or `Terminal | Run Task...|chefs_local up`
2. start CHEFS
   - Run and Debug, select 'CHEFS' which will start both the API and the frontend.
3. debug Frontend with Chrome
   - Run and Debug, select 'CHEFS Frontend - chrome' which will start a Chrome browser against the frontend, will allow breakpoints in `/app/frontend/src`
4. stop Postgresql and NATS. Many ways to stop...
   - right click on `.devcontainer/chefs_local/docker-compose.yml` and select `Compose down`
   - or use command palette `Docker: Compose Down` then select `.devcontainer/chefs_local/docker-compose.yml`
   - or `Terminal | Run Task...|chefs_local down`

_Notes_

- `CHEFS Frontend` launch configuration is using the `chefs-frontend-localhost-5300` client in Keycloak, not `chefs-frontend-xxxx` client as we do in production.
- `CHEFS API` will use the configuration found at `.devcontainer/chefs_local/local.json`
- `Postgres DB`: localhost:5432
- `CHEFS Frontend`: http://localhost:5173/app
- `CHEFS API`: http://localhost:5173/app/api/v1

## Formio Components

If you are developing the formio components, you should build and redeploy them before running your local debug instances of CHEFS. Use tasks `Components build` and `Components Deploy`.

## KNEX - Database tools

[knex](https://knexjs.org) is installed globally and should be run from the `/app` directory where the knex configuration is located. Use knex to stub out migrations or to rollback migrations as you are developing.

### create a migration file

This will create a stub file with a timestamp. You will populate the up and down methods to add/update/delete database objects.

```
cd app
knex migrate:make my_new_migration_script
> Created Migration: /workspaces/common-hosted-form-service/app/src/db/migrations/20240119172630_my_new_migration_script.js
```

### rollback previous migration

When developing your migrations, you may find it useful to run the migration and roll it back if it isn't exactly what you expect to happen.

#### run the migration(s)

```
cd app
knex migrate:latest
> Batch 2 run: 1 migrations
```

#### rollback the migration(s)

```
cd app
knex migrate:rollback
> Batch 2 rolled back: 1 migrations
```

Please review the [knex](https://knexjs.org) for more detail and how to leverage the tool.

## Troubleshooting

All development machines are unique and here we will document problems that have been encountered and how to fix them.

### Failure during load of devcontainer when running webpack (Segmentation Fault)

Encountered on Mac Ventura 13.6, with Mac Docker Desktop 4.26.1 when running `npm run build:formio` on load, we hit a `Segmentation Fault`. The issue was resolved when turning off the virtualization settings in Docker Desktop.

Under Settings, select `gRPC Fuse` instead of `VirtioFS` then unselect `Use Virtualization framework`. Restart Docker and VS Code.
