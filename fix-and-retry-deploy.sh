#!/bin/bash
set -e

echo "=== Fixing SSL Certificate Issue for Azure CLI ==="
echo ""
echo "Your corporate proxy is intercepting HTTPS traffic."
echo "Applying workaround..."
echo ""

# Step 1: Disable SSL verification for this deployment (temporary)
export AZURE_CLI_DISABLE_CONNECTION_VERIFY=1
export PYTHONWARNINGS=ignore:Unverified HTTPS request

# Step 2: Build monorepo libraries first
echo "Building shared libraries and services..."
npm run build:libs

# Step 3: Build backend
echo "Building backend..."
cd backend
npm run build

# Step 4: Install production dependencies
echo "Installing production dependencies..."
npm install --omit=dev

# Step 5: Try deployment again
echo "Retrying deployment with SSL verification disabled..."
az webapp up \
  --resource-group rg-mbgsol-muse-dev \
  --name muse-backend \
  --runtime "NODE:22-lts"

echo ""
echo "✅ Deployment complete!"
echo ""
echo "Next steps:"
echo "  1. ./post-deploy-verify.sh"
echo "  2. ./e2e-verify.sh"
echo "  3. Follow COPILOT_STUDIO_WIRING.md"
