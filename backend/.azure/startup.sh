#!/bin/bash

# Muse Backend - Production Startup Script for Azure App Service
# This script runs npm build and starts the Node server

echo "[$(date +'%Y-%m-%d %H:%M:%S')] MUSE Backend Starting..."

# Ensure dist directory exists and is built
if [ ! -d "dist" ]; then
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] dist/ not found. Building TypeScript..."
    npm run build
    if [ $? -ne 0 ]; then
        echo "[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: Build failed!"
        exit 1
    fi
fi

# Start the server
echo "[$(date +'%Y-%m-%d %H:%M:%S')] Starting Node server..."
PORT=${PORT:-8080}
exec node dist/index.js
