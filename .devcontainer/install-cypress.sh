#!/bin/bash

# Interactive Cypress installation script with explicit paths
echo "🤔 Checking for Cypress setup..."

# Define explicit paths - handle running from .devcontainer directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORKSPACE_ROOT="${WORKSPACE_ROOT:-$(dirname "${SCRIPT_DIR}")}"
CYPRESS_DIR="${WORKSPACE_ROOT}/tests/functional/cypress"
PACKAGE_JSON="${CYPRESS_DIR}/package.json"

echo "📍 Script directory: ${SCRIPT_DIR}"
echo "📍 Workspace root: ${WORKSPACE_ROOT}"
echo "📍 Cypress directory: ${CYPRESS_DIR}"

if [ -f "${PACKAGE_JSON}" ]; then
  echo "📦 Found package.json in ${CYPRESS_DIR}"
  read -p "Install Cypress? (y/n): " -n 1 -r
  echo ""
  
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "📦 Installing Cypress in ${CYPRESS_DIR}..."
    cd "${CYPRESS_DIR}"
    if npm ci; then
      echo "✅ Cypress installed successfully!"
      echo "📍 Installation location: ${CYPRESS_DIR}"
    else
      echo "❌ Cypress installation failed"
      exit 1
    fi
  else
    echo "⏭️ Skipped Cypress installation"
  fi
else
  echo "❌ package.json not found at ${PACKAGE_JSON}"
  echo "💡 Expected location: ${CYPRESS_DIR}/package.json"
  echo "💡 Current working directory: $(pwd)"
  exit 1
fi 
