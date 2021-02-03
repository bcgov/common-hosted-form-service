#!/bin/bash
# This script attempts to gracefully rebuild and update @bcgov/formio if necessary

set -euo pipefail

FORMIO_DIR="src/formio"
LIB_DIR="../../components/lib"
TITLE="BCGov Formio Custom Components"

buildComponents() {
    echo "Attempting to build...";
    npm run clean:formio
    npm run build:formio
}

updateComponents() {
    echo "Removing $FORMIO_DIR..."
    rm -rf $FORMIO_DIR
    echo "Copying contents from $LIB_DIR to $FORMIO_DIR..."
    cp -R $LIB_DIR $FORMIO_DIR
    echo "$TITLE has been updated";
}

# Build and deploy if the src/formio directory is missing or empty
if [ ! -d $FORMIO_DIR ] || [ -z "$(ls -A $FORMIO_DIR)" ]; then
    echo "$TITLE is missing";
    buildComponents
    updateComponents

# Rebuild and redeploy if a newer version detected in components directory
elif [ "$(stat -c %Y src/formio)" -lt "$(stat -c %Y ../../components)" ]; then
    echo "$TITLE has been modified"
    buildComponents
    updateComponents

# Do nothing and continue
else
    echo "$TITLE is present and up to date"
fi
