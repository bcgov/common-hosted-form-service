ARG VARIANT="20.18.1-bookworm"
FROM node:${VARIANT}

RUN apt-get update && \
    DEBIAN_FRONTEND=noninteractive apt-get install -y \
        # Cypress prerequisites for running in Debian containers:
        # https://docs.cypress.io/app/get-started/install-cypress#UbuntuDebian
        libgtk2.0-0 libgtk-3-0 libgbm-dev libnotify-dev libnss3 libxss1 \
        libasound2 libxtst6 xauth xvfb \
        # For interactive git rebases
        vim
