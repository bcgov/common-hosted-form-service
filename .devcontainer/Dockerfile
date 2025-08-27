ARG VARIANT="20.18.3-bookworm"
FROM node:${VARIANT}

# Base utils
RUN apt-get update && DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
      ca-certificates curl gnupg vim xauth xvfb wget \
  && rm -rf /var/lib/apt/lists/*

# k6 (static binary; supports arm64/amd64)
ARG K6_VERSION="0.51.0"
RUN set -eux; \
  arch="$(dpkg --print-architecture)"; \
  case "$arch" in \
    amd64) karch="amd64" ;; \
    arm64) karch="arm64" ;; \
    *) echo "Unsupported arch: $arch"; exit 1 ;; \
  esac; \
  curl -fsSL -o /tmp/k6.tgz "https://github.com/grafana/k6/releases/download/v${K6_VERSION}/k6-v${K6_VERSION}-linux-${karch}.tar.gz"; \
  tar -xzf /tmp/k6.tgz -C /tmp; \
  mv "/tmp/k6-v${K6_VERSION}-linux-${karch}/k6" /usr/local/bin/k6; \
  chmod +x /usr/local/bin/k6; \
  rm -rf /tmp/k6*

# Cypress deps
RUN apt-get update && DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
      libasound2 libgbm-dev libgtk-3-0 libnss3 libxss1 libxtst6 \
  && rm -rf /var/lib/apt/lists/*

# Java for SonarLint
RUN apt-get update && DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
      openjdk-17-jre-headless \
  && rm -rf /var/lib/apt/lists/*

# Global npm tools
RUN npm install -g knex jest dotenv-cli