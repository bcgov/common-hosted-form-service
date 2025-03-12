ARG VARIANT="20.18.2-bookworm"
FROM node:${VARIANT}

# Install dependencies and set up K6
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