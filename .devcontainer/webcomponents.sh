#!/bin/bash

# Define explicit paths - handle running from .devcontainer directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORKSPACE_ROOT="${WORKSPACE_ROOT:-$(dirname "${SCRIPT_DIR}")}"

echo "📍 Script directory: ${SCRIPT_DIR}"
echo "📍 Workspace root: ${WORKSPACE_ROOT}"

# make an initial build of formio components and ready them for frontend
cd ${WORKSPACE_ROOT}/app/frontend
npm run build:formio
npm run deploy:formio

# make an initial build of webcomponents
# need to build the frontend first to get the formio and font awesome assets
cd ${WORKSPACE_ROOT}/app/frontend
npm run build
# then build the webcomponents
cd ${WORKSPACE_ROOT}/app
npm run webcomponents:build


