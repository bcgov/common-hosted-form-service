ARG VARIANT="18.20.3-bookworm"
FROM node:${VARIANT}

# not much in here, could acheive this another way for sure...
# but this allows us a prepared place to add other things to the container OS.

RUN apt-get update && \
    DEBIAN_FRONTEND=noninteractive apt-get install -y \
        # For interactive git rebases
        vim
