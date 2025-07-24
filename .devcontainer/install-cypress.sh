#!/bin/bash

# Interactive Cypress installation script
echo "🤔 Checking for Cypress setup..."

if [ -f "package.json" ]; then
  echo "📦 Found package.json in $(pwd)"
  read -p "Install Cypress? (y/n): " -n 1 -r
  echo ""
  
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "📦 Installing Cypress..."
    if npm ci; then
      echo "✅ Cypress installed successfully!"
    else
      echo "❌ Cypress installation failed"
      exit 1
    fi
  else
    echo "⏭️ Skipped Cypress installation"
  fi
else
  echo "❌ package.json not found in $(pwd)"
  echo "💡 Make sure you're in the correct Cypress directory"
  exit 1
fi 
