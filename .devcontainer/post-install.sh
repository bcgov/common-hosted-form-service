#!/bin/bash
set -ex

# Convenience workspace directory for later use
WORKSPACE_DIR=$(pwd)
CHEFS_LOCAL_DIR=${WORKSPACE_DIR}/.devcontainer/chefs_local

npm install knex -g
npm install jest -g

# install app libraries, prepare for app development and debugging...
cd app
npm install

# install frontend libraries, prepare for ux development and debugging...
cd frontend
npm install

# make an initial build of formio components and ready them for frontend
npm run build:formio
npm run deploy:formio

# copy over the sample files to the image...
cp -u ${CHEFS_LOCAL_DIR}/local.json.sample ${CHEFS_LOCAL_DIR}/local.json
cp -u ${CHEFS_LOCAL_DIR}/realm-export.json.sample ${CHEFS_LOCAL_DIR}/realm-export.json

# fire up keycloak and postgres... we want to seed the db
docker compose -f ${CHEFS_LOCAL_DIR}/docker-compose.yml up --wait
# run an initial migration for the db and seed it...
export NODE_CONFIG_DIR=${CHEFS_LOCAL_DIR} # need this to connect to the running postgres instance.
cd .. # back to app dir
npm run migrate
# npm run seed:run

# take down keycloak and postgres, do not need them running all the time.
docker compose -f ${CHEFS_LOCAL_DIR}/docker-compose.yml down

