#!/bin/bash
set -e

# Function to handle errors
error_handler() {
  echo "❌ Error occurred in line $1"
  exit 1
}

# Set error handler
trap 'error_handler $LINENO' ERR

# Convenience workspace directory for later use
WORKSPACE_DIR=$(pwd)
CHEFS_LOCAL_DIR=${WORKSPACE_DIR}/.devcontainer/chefs_local
# Note: Global npm packages (knex, jest, dotenv-cli) are now installed in Dockerfile

# Ensure we're in the workspace root
cd ${WORKSPACE_DIR}
echo "📍 Working directory: $(pwd)"

# Check if Docker is available
if ! command -v docker &> /dev/null; then
  echo "❌ Error: Docker is not available"
  exit 1
fi

# Check if Docker Compose is available
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
  echo "❌ Error: Docker Compose is not available"
  exit 1
fi

# Check if required directories exist
if [ ! -d "components" ]; then
  echo "❌ Error: components directory not found"
  exit 1
fi

if [ ! -d "app" ]; then
  echo "❌ Error: app directory not found"
  exit 1
fi

if [ ! -d "app/frontend" ]; then
  echo "❌ Error: app/frontend directory not found"
  exit 1
fi

# install dependencies in parallel for faster setup
echo "📦 Installing dependencies in parallel..."

# Install components dependencies
(cd components && npm install) &
COMPONENTS_PID=$!

# Install app dependencies  
(cd app && npm install) &
APP_PID=$!

# Install frontend dependencies
(cd app/frontend && npm install) &
FRONTEND_PID=$!

# Wait for all installations to complete
wait $COMPONENTS_PID $APP_PID $FRONTEND_PID

# Check if any installations failed
if [ $? -ne 0 ]; then
  echo "❌ Error: One or more npm installations failed"
  exit 1
fi

echo "✅ All dependencies installed successfully!"

# make an initial build of formio components and ready them for frontend
cd ${WORKSPACE_DIR}/app/frontend
npm run build:formio
npm run deploy:formio


# copy over the sample files to the image...
if [ ! -f "${CHEFS_LOCAL_DIR}/local.json" ]; then
  cp ${CHEFS_LOCAL_DIR}/local.sample.json ${CHEFS_LOCAL_DIR}/local.json
fi

# fire up postgres... we want to seed the db
echo "🐘 Starting PostgreSQL..."
if ! docker compose -f ${CHEFS_LOCAL_DIR}/docker-compose.yml up postgres -d; then
  echo "❌ Failed to start PostgreSQL"
  exit 1
fi

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
max_attempts=30
attempt=1
while [ $attempt -le $max_attempts ]; do
  # Check if PostgreSQL is accepting connections by testing the port
  if docker compose -f ${CHEFS_LOCAL_DIR}/docker-compose.yml exec -T postgres pg_isready -U app -d chefs > /dev/null 2>&1; then
    echo "✅ PostgreSQL is ready!"
    break
  fi
  echo "⏳ Attempt $attempt/$max_attempts: PostgreSQL not ready yet..."
  sleep 2
  attempt=$((attempt + 1))
done

if [ $attempt -gt $max_attempts ]; then
  echo "❌ PostgreSQL failed to start within expected time"
  echo "📋 PostgreSQL container status:"
  docker compose -f ${CHEFS_LOCAL_DIR}/docker-compose.yml ps postgres
  echo "📋 PostgreSQL logs:"
  docker compose -f ${CHEFS_LOCAL_DIR}/docker-compose.yml logs postgres
  exit 1
fi

# run an initial migration for the db and seed it...
export NODE_CONFIG_DIR=${CHEFS_LOCAL_DIR} # need this to connect to the running postgres instance.
cd ${WORKSPACE_DIR}/app # ensure we're in the app directory
echo "🗄️ Running database migrations..."
if ! npm run migrate; then
  echo "❌ Failed to run database migrations"
  exit 1
fi
# npm run seed:run

# take down postgres, do not need them running all the time.
echo "🛑 Stopping PostgreSQL..."
if ! docker compose -f ${CHEFS_LOCAL_DIR}/docker-compose.yml down; then
  echo "⚠️ Warning: Failed to stop PostgreSQL containers"
fi

# Note: Cypress installation is now handled via VS Code tasks
# Run Task -> Install Cypress
# Run Task -> Run Cypress Tests (Interactive)

