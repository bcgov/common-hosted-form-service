ARG VARIANT="20.18.2-bookworm"
FROM node:${VARIANT}

# Install some extras such as vim for interactive rebases. Also some
# Cypress prerequisites for running in Debian containers:
# https://docs.cypress.io/app/get-started/install-cypress#UbuntuDebian

RUN apt-get update && \
    DEBIAN_FRONTEND=noninteractive apt-get install -y \
        libasound2 \
        libgbm-dev \
        libgtk-3-0 \
        libgtk2.0-0 \
        libnotify-dev \
        libnss3 \
        libxss1 \
        libxtst6 \
        vim \
        xauth \
        xvfb \
    && apt-get clean
