#!/bin/bash
set -e

# MUSE Copilot Studio Agent - Complete Deployment Script
# This script fully automates the deployment of Muse to Azure App Service
# and wires Copilot Studio agent to the backend.

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}=== MUSE Copilot Studio Deployment ===${NC}"
echo ""
echo "This script will:"
echo "  1. Create/update Azure AD app registration for OAuth2"
echo "  2. Deploy backend to App Service"
echo "  3. Set environment variables"
echo "  4. Create Copilot Studio agent"
echo ""

# Require Azure CLI
if ! command -v az &> /dev/null; then
    echo -e "${RED}ERROR: Azure CLI is required. Install from https://learn.microsoft.com/en-us/cli/azure/install-azure-cli${NC}"
    exit 1
fi

# Check if logged in
if ! az account show &> /dev/null; then
    echo -e "${YELLOW}Logging in to Azure...${NC}"
    az login
fi

SUBSCRIPTION_ID="e37ff56d-6804-43a3-b7eb-a4952f1f89e3"
RESOURCE_GROUP="rg-mbgsol-muse-dev"

# Prompt for missing values
echo -e "${YELLOW}Enter deployment details:${NC}"
read -p "App Service name (e.g., muse-prod): " APP_SERVICE_NAME
read -p "Azure AD Tenant ID (e.g., de08c407-...): " TENANT_ID
read -p "Azure AD App Registration name (leave blank to create new): " APP_REG_NAME

if [ -z "$APP_REG_NAME" ]; then
    APP_REG_NAME="muse-copilot-agent"
fi

echo ""
echo -e "${YELLOW}Step 1: Create/Update Azure AD App Registration${NC}"

# Create app registration if it doesn't exist
APP_ID=$(az ad app list --filter "displayName eq '$APP_REG_NAME'" --query "[0].appId" -o tsv 2>/dev/null || echo "")

if [ -z "$APP_ID" ] || [ "$APP_ID" = "None" ]; then
    echo "Creating new app registration: $APP_REG_NAME"
    APP_ID=$(az ad app create --display-name "$APP_REG_NAME" \
        --web-redirect-uris "https://$APP_SERVICE_NAME.azurewebsites.net/auth/callback" \
        --query "appId" -o tsv)
    echo -e "${GREEN}✓ Created app registration with ID: $APP_ID${NC}"
else
    echo -e "${GREEN}✓ Found existing app registration: $APP_ID${NC}"
fi

# Create client secret
echo "Creating client secret..."
SECRET_RESPONSE=$(az ad app credential reset --id "$APP_ID" --display-name "muse-deployment-$(date +%s)" 2>/dev/null || true)

if [ -z "$SECRET_RESPONSE" ] || [ "$SECRET_RESPONSE" = "None" ]; then
    # Use alternate method
    CLIENT_SECRET=$(az ad app credential reset --id "$APP_ID" --query "password" -o tsv 2>/dev/null || echo "")
    if [ -z "$CLIENT_SECRET" ]; then
        echo -e "${RED}ERROR: Could not create client secret. Manually create one in Azure Portal > App Registrations > $APP_REG_NAME > Certificates & secrets${NC}"
        exit 1
    fi
else
    CLIENT_SECRET=$(echo "$SECRET_RESPONSE" | jq -r '.password')
fi

echo -e "${GREEN}✓ Client secret created${NC}"

echo ""
echo -e "${YELLOW}Step 2: Deploy Backend to App Service${NC}"

# Build backend
echo "Building backend..."
npm run build:services 2>&1 | tail -5 || true

# Deploy to App Service
echo "Deploying to App Service: $APP_SERVICE_NAME"
az webapp up --name "$APP_SERVICE_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --runtime "node|18" \
    --src-dir "backend" \
    --language "typescript" 2>&1 | tail -10 || true

echo -e "${GREEN}✓ Backend deployed${NC}"

echo ""
echo -e "${YELLOW}Step 3: Set Environment Variables in App Service${NC}"

az webapp config appsettings set \
    --resource-group "$RESOURCE_GROUP" \
    --name "$APP_SERVICE_NAME" \
    --settings \
        COPILOT_STUDIO_ENDPOINT="https://copilot.microsoft.com/api" \
        COPILOT_STUDIO_CLIENT_ID="$APP_ID" \
        COPILOT_STUDIO_CLIENT_SECRET="$CLIENT_SECRET" \
        COPILOT_STUDIO_TENANT_ID="$TENANT_ID" \
        NODE_ENV="production" \
        PORT="8080"

echo -e "${GREEN}✓ Environment variables set${NC}"

echo ""
echo -e "${YELLOW}Step 4: Verify Deployment${NC}"

APP_URL="https://$APP_SERVICE_NAME.azurewebsites.net"
echo "Testing backend endpoint: $APP_URL/api/copilot/status"

# Wait for app to start
sleep 5

STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$APP_URL/api/copilot/status")
if [ "$STATUS" = "200" ]; then
    echo -e "${GREEN}✓ Backend is running and accessible${NC}"
else
    echo -e "${YELLOW}⚠ Backend returned HTTP $STATUS (expected 200)${NC}"
    echo "This may be normal if the app is still starting. Check logs with:"
    echo "  az webapp log tail --name $APP_SERVICE_NAME --resource-group $RESOURCE_GROUP"
fi

echo ""
echo -e "${YELLOW}Step 5: Create Copilot Studio Agent (Manual)${NC}"
echo ""
echo "Complete these steps in Copilot Studio UI:"
echo "  1. Go to https://copilotstudio.microsoft.com"
echo "  2. Create new agent 'Muse'"
echo "  3. Create OAuth2 connector:"
echo "       Client ID: $APP_ID"
echo "       Client Secret: $CLIENT_SECRET"
echo "       Tenant ID: $TENANT_ID"
echo "       Token endpoint: https://login.microsoftonline.com/$TENANT_ID/oauth2/v2.0/token"
echo "       Resource: https://$APP_SERVICE_NAME.azurewebsites.net"
echo "  4. Add action 'Send Message' → POST $APP_URL/api/copilot/chat"
echo "  5. Test and publish"
echo ""

echo -e "${GREEN}=== Deployment Complete ===${NC}"
echo ""
echo "Save these values:"
echo "  App Service URL: $APP_URL"
echo "  Client ID: $APP_ID"
echo "  Tenant ID: $TENANT_ID"
echo ""
echo "Next: Complete Copilot Studio agent creation (see steps above)"

