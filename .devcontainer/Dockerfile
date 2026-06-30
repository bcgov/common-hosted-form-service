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
RUN apt-get update && \
    DEBIAN_FRONTEND=noninteractive apt-get install -y \
        curl \
        ca-certificates && \
    ARCH=$(dpkg --print-architecture) && \
    if [ "$ARCH" = "amd64" ]; then \
        K6_ARCH="amd64"; \
    elif [ "$ARCH" = "arm64" ]; then \
        K6_ARCH="arm64"; \
    else \
        K6_ARCH="amd64"; \
    fi && \
    K6_VERSION="v0.50.0" && \
    curl -L "https://github.com/grafana/k6/releases/download/${K6_VERSION}/k6-${K6_VERSION}-linux-${K6_ARCH}.tar.gz" -o /tmp/k6.tar.gz && \
    tar -xzf /tmp/k6.tar.gz -C /tmp && \
    mv /tmp/k6-${K6_VERSION}-linux-${K6_ARCH}/k6 /usr/local/bin/k6 && \
    chmod +x /usr/local/bin/k6 && \
    rm -rf /tmp/k6* && \
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

# Set JAVA_HOME dynamically based on architecture (works for both amd64 and arm64)
RUN ARCH=$(dpkg --print-architecture) && \
    if [ "$ARCH" = "amd64" ]; then \
        JAVA_DIR="java-17-openjdk-amd64"; \
    elif [ "$ARCH" = "arm64" ]; then \
        JAVA_DIR="java-17-openjdk-arm64"; \
    else \
        JAVA_DIR="java-17-openjdk-amd64"; \
    fi && \
    JAVA_HOME_PATH="/usr/lib/jvm/${JAVA_DIR}" && \
    echo "JAVA_HOME=${JAVA_HOME_PATH}" >> /etc/environment && \
    echo "export JAVA_HOME=${JAVA_HOME_PATH}" >> /etc/profile.d/java.sh && \
    echo "export PATH=\$JAVA_HOME/bin:\$PATH" >> /etc/profile.d/java.sh && \
    chmod +x /etc/profile.d/java.sh && \
    ln -sf ${JAVA_HOME_PATH} /usr/lib/jvm/java-17-openjdk
    
# Layer 5: Install global npm packages (changes with project dependencies)
RUN npm install -g knex jest dotenv-cli

# Layer 6: Ensure devcontainer scripts are executable (will be set during container startup)
