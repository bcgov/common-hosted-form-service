#!/bin/bash
# This script attempts to gracefully determine if @bcgov/formio needs to be build and imported

set -euo pipefail

FORMIO_DIR="src/formio"

# Build and copy if the src/formio directory is missing or empty
if [ ! -d $FORMIO_DIR ] || [ -z "$(ls -A $FORMIO_DIR)" ]; then
    echo "BCGov Formio Custom Components are missing - attempting to build...";
    npm run build:formio
    rm -rf $FORMIO_DIR
    cp -R ../../components/lib $FORMIO_DIR
    echo "BCGov Formio Custom Components are built and deployed";
else
    echo "BCGov Formio Custom Components is present"
fi
