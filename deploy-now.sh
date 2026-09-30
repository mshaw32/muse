#!/bin/bash

# Muse Backend - One-Command Azure Deployment
# Simply runs: az webapp deployment source config-zip
#
# Prerequisites: 
#   - az login (must be logged in to Azure)
#   - muse-backend-deploy-v4.zip (in current directory)
#
# Usage: ./deploy-now.sh

set -e

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║         Muse Backend - Azure Deployment (v4 - FIXED)          ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Check if logged in
if ! az account show &> /dev/null; then
    echo "❌ Not logged in to Azure"
    echo ""
    echo "Run: az login"
    exit 1
fi

# Check if zip exists
if [ ! -f "muse-backend-deploy-v4.zip" ]; then
    echo "❌ muse-backend-deploy-v4.zip not found"
    echo ""
    echo "Make sure you're in:"
    echo "  /Users/948471/Projects/copilot-worktrees/muse/mshaw32-upgraded-adventure"
    exit 1
fi

echo "✅ Ready to deploy"
echo ""
echo "Uploading muse-backend-deploy-v4.zip..."
echo ""

# Deploy
az webapp deployment source config-zip \
  --resource-group "rg-mbgsol-muse-dev" \
  --name "muse-backend" \
  --src "muse-backend-deploy-v4.zip"

echo ""
echo "✅ Upload complete!"
echo ""
echo "Waiting for build... (2-3 minutes)"
sleep 30

# Test endpoint
echo ""
echo "Testing: https://muse-backend.azurewebsites.net/api/copilot/health"
curl -s https://muse-backend.azurewebsites.net/api/copilot/health || echo "Still building..."

echo ""
echo ""
echo "═══════════════════════════════════════════════════════════════════"
echo "Deployment initiated!"
echo ""
echo "Monitor in Azure Portal:"
echo "  https://portal.azure.com"
echo "  → Search: muse-backend"
echo "  → Deployment Center → Deployment logs"
echo ""
echo "Test when ready:"
echo "  curl https://muse-backend.azurewebsites.net/api/copilot/health"
echo ""
echo "Read verification guide:"
echo "  docs/VERIFY_DEPLOYMENT_SUCCESS.md"
echo "═══════════════════════════════════════════════════════════════════"
