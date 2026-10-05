#!/bin/bash
# Azure App Service deployment script
# This is ONLY executed if .deployment file references it
# Otherwise Azure uses default Node.js detection and npm start

set -e

echo "Starting Node.js application..."
exec node dist/index.js
