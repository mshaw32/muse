#!/bin/bash
set -e

echo "=== Preparing Backend for Azure Portal Upload ==="
echo ""

# Create deployment package
DEPLOY_DIR="backend"
PACKAGE_NAME="muse-backend-deploy.zip"

# Check if we have dist folder
if [ ! -d "$DEPLOY_DIR/dist" ]; then
    echo "ERROR: Backend not built. Cannot find $DEPLOY_DIR/dist"
    exit 1
fi

echo "Creating deployment package..."
cd "$DEPLOY_DIR"

# Create minimal package.json for Azure App Service
if [ ! -f "package.json" ]; then
    cat > package.json << 'PKGJSON'
{
  "name": "muse-backend",
  "version": "0.1.0",
  "main": "dist/index.js",
  "scripts": {
    "start": "node dist/index.js"
  },
  "engines": {
    "node": "22.x"
  }
}
PKGJSON
    echo "Created package.json"
fi

# Zip the deployment
cd ..
rm -f "$PACKAGE_NAME"
zip -r "$PACKAGE_NAME" "$DEPLOY_DIR/dist" "$DEPLOY_DIR/package.json" "$DEPLOY_DIR/.deployment" "$DEPLOY_DIR/web.config" "$DEPLOY_DIR/.azure" > /dev/null 2>&1 || true

if [ ! -f "$PACKAGE_NAME" ]; then
    echo "ERROR: Failed to create zip file"
    exit 1
fi

echo "✅ Deployment package created: $PACKAGE_NAME"
ls -lh "$PACKAGE_NAME"
echo ""
echo "NEXT STEPS:"
echo "1. Go to: https://portal.azure.com"
echo "2. Search for: 'muse-backend' (App Service)"
echo "3. In left menu: Deployment > Deployment center"
echo "4. Select: 'Upload a zip file'"
echo "5. Upload: $PACKAGE_NAME"
echo "6. Click 'Deploy'"
echo ""
echo "Wait for deployment to complete (5-10 minutes)"
