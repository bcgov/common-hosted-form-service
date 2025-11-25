ARG VARIANT="20.18.3-bookworm"
FROM node:${VARIANT}

# Layer 1: Install basic system utilities (rarely change)
RUN apt-get update && \
    DEBIAN_FRONTEND=noninteractive apt-get install -y \
        vim \
        xauth \
        xvfb \
        wget \
    && apt-get clean

# Layer 2: Install k6 for performance testing (changes occasionally)
RUN apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69 && \
    echo "deb https://dl.k6.io/deb stable main" | tee /etc/apt/sources.list.d/k6.list && \
    apt-get update && \
    DEBIAN_FRONTEND=noninteractive apt-get install -y k6 && \
    apt-get clean

# Layer 3: Install Cypress dependencies (changes with Cypress updates)
RUN apt-get update && \
    DEBIAN_FRONTEND=noninteractive apt-get install -y \
    libasound2 \
    libgbm-dev \
    libgtk-3-0 \
    libnss3 \
    libxss1 \
    libxtst6 \
    && apt-get clean

# Layer 4: Install Java for SonarLint (changes with project dependencies)
RUN apt-get update && \
    DEBIAN_FRONTEND=noninteractive apt-get install -y \
        openjdk-17-jre-headless \
    && apt-get clean

# Layer 5: Install global npm packages (changes with project dependencies)
RUN npm install -g knex jest dotenv-cli

# Layer 6: Ensure devcontainer scripts are executable (will be set during container startup)
