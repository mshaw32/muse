#!/bin/bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   MUSE COPILOT STUDIO - FULL DEPLOYMENT   ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════╝${NC}"
echo ""

# Configuration
RESOURCE_GROUP="rg-mbgsol-muse-dev"
APP_SERVICE_NAME="muse-backend"
PLAN_NAME="MuseAppPlan"
REGION="eastus"
SUBSCRIPTION="e37ff56d-6804-43a3-b7eb-a4952f1f89e3"
TENANT_ID="de08c407-19b9-427d-9fe8-edf254300ca7"

echo -e "${YELLOW}Configuration:${NC}"
echo "  Subscription: $SUBSCRIPTION"
echo "  Tenant: $TENANT_ID"
echo "  Resource Group: $RESOURCE_GROUP"
echo "  App Service: $APP_SERVICE_NAME"
echo "  Plan: $PLAN_NAME (B1)"
echo "  Region: $REGION"
echo ""

# Step 1: Login
echo -e "${YELLOW}[1/5] Authenticating to Azure...${NC}"
if az account show &>/dev/null; then
    CURRENT_TENANT=$(az account show --query "tenantId" -o tsv 2>/dev/null)
    if [ "$CURRENT_TENANT" != "$TENANT_ID" ]; then
        echo "Wrong tenant. Logging in..."
        az login --tenant $TENANT_ID
    else
        echo -e "${GREEN}✓ Already logged in${NC}"
    fi
else
    echo "Logging in..."
    az login --tenant $TENANT_ID
fi

echo ""

# Step 2: Create App Service Plan
echo -e "${YELLOW}[2/5] Creating App Service Plan: $PLAN_NAME${NC}"

PLAN_EXISTS=$(az appservice plan show \
  --name $PLAN_NAME \
  --resource-group $RESOURCE_GROUP \
  --query "id" -o tsv 2>/dev/null || echo "")

if [ -z "$PLAN_EXISTS" ]; then
    echo "Plan doesn't exist, creating..."
    az appservice plan create \
      --name $PLAN_NAME \
      --resource-group $RESOURCE_GROUP \
      --sku B1 \
      --is-linux
    echo -e "${GREEN}✓ Plan created${NC}"
else
    echo -e "${GREEN}✓ Plan already exists${NC}"
fi

echo ""

# Step 3: Create App Service
echo -e "${YELLOW}[3/5] Creating App Service: $APP_SERVICE_NAME${NC}"

APP_EXISTS=$(az webapp show \
  --resource-group $RESOURCE_GROUP \
  --name $APP_SERVICE_NAME \
  --query "id" -o tsv 2>/dev/null || echo "")

if [ -z "$APP_EXISTS" ]; then
    echo "App Service doesn't exist, creating..."
    az webapp create \
      --resource-group $RESOURCE_GROUP \
      --plan $PLAN_NAME \
      --name $APP_SERVICE_NAME \
      --runtime "NODE:22-lts"
    echo -e "${GREEN}✓ App Service created${NC}"
else
    echo -e "${GREEN}✓ App Service already exists${NC}"
fi

APP_URL=$(az webapp show \
  --resource-group $RESOURCE_GROUP \
  --name $APP_SERVICE_NAME \
  --query "defaultHostName" -o tsv)

echo "App Service URL: https://$APP_URL"
echo ""

# Step 4: Deploy backend code
echo -e "${YELLOW}[4/5] Deploying backend code...${NC}"

# Go to repo root, then backend
REPO_ROOT=$(cd /Users/948471/Projects/copilot-worktrees/muse/mshaw32-upgraded-adventure && pwd)
cd "$REPO_ROOT/backend"

# Build the backend
echo "Building backend..."
npm install --omit=dev --silent 2>/dev/null || echo "npm install skipped"

# Deploy from backend directory (az webapp up runs from cwd)
echo "Uploading code to App Service..."
az webapp up \
  --resource-group $RESOURCE_GROUP \
  --name $APP_SERVICE_NAME \
  --runtime "NODE:22-lts"

echo -e "${GREEN}✓ Code deployed${NC}"
echo ""

# Step 5: Prompt for credentials
echo -e "${YELLOW}[5/5] Configuring environment variables...${NC}"
echo ""
echo "We need your Azure AD credentials for Copilot Studio authentication."
echo "You can get these from:"
echo "  1. Azure Portal → Azure AD → App registrations"
echo "  2. Or use the app registration created by deploy.sh"
echo ""

read -p "Enter COPILOT_STUDIO_CLIENT_ID (Azure AD app ID): " CLIENT_ID
read -p "Enter COPILOT_STUDIO_CLIENT_SECRET (app password): " CLIENT_SECRET

# Set environment variables
echo "Setting environment variables..."
az webapp config appsettings set \
  --resource-group $RESOURCE_GROUP \
  --name $APP_SERVICE_NAME \
  --settings \
    COPILOT_STUDIO_ENDPOINT="https://copilot.microsoft.com/api" \
    COPILOT_STUDIO_CLIENT_ID="$CLIENT_ID" \
    COPILOT_STUDIO_CLIENT_SECRET="$CLIENT_SECRET" \
    COPILOT_STUDIO_TENANT_ID="$TENANT_ID" \
    NODE_ENV="production" \
    PORT="8080" \
  --output none

echo -e "${GREEN}✓ Environment variables set${NC}"
echo ""

# Step 6: Test the backend
echo -e "${YELLOW}Testing backend connectivity...${NC}"
sleep 5

STATUS_CODE=$(curl -s -o /dev/null -w "%{http_code}" "https://$APP_URL/api/copilot/status" 2>/dev/null || echo "000")

if [ "$STATUS_CODE" = "200" ]; then
    echo -e "${GREEN}✓ Backend is live and responding!${NC}"
elif [ "$STATUS_CODE" = "401" ]; then
    echo -e "${YELLOW}⚠ Backend responding (401 - auth needed, which is expected)${NC}"
else
    echo -e "${YELLOW}⚠ Backend returned HTTP $STATUS_CODE (may still be starting)${NC}"
fi

echo ""
echo -e "${GREEN}╔════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║        DEPLOYMENT COMPLETE ✓              ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════╝${NC}"
echo ""
echo "Your Muse backend is deployed!"
echo ""
echo -e "${BLUE}Next Steps:${NC}"
echo "1. Go to https://copilotstudio.microsoft.com"
echo "2. Open your 'Muse' agent"
echo "3. Add a tool with this URL:"
echo ""
echo -e "${YELLOW}   https://$APP_URL/api/copilot/chat${NC}"
echo ""
echo "4. Configure authentication with:"
echo "   - Client ID: $CLIENT_ID"
echo "   - Client Secret: $CLIENT_SECRET"
echo "   - Tenant: $TENANT_ID"
echo ""
echo "5. Wire the tool to your agent's message action"
echo "6. Test the agent"
echo "7. Publish"
echo ""
echo "For detailed instructions, see: DEPLOYMENT_FINAL.md"
echo ""

