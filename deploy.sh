#!/bin/bash

# Master deployment wrapper
# Intelligently handles all 3 deployment options
# Tests connectivity and chooses the best method

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   MUSE DEPLOYMENT - SMART ORCHESTRATOR    ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════╝${NC}"
echo ""

# First: Run pre-flight checks
echo -e "${CYAN}Running pre-flight checks...${NC}"
if ! ./pre-flight-check.sh | grep -q "All checks passed"; then
    echo -e "${RED}❌ Pre-flight checks failed. Fix issues and retry.${NC}"
    exit 1
fi
echo ""

# Test Azure CLI connectivity
echo -e "${CYAN}Testing Azure CLI connectivity...${NC}"
if ! az account show &>/dev/null; then
    echo -e "${RED}❌ Azure CLI not logged in${NC}"
    echo "Run: az login --tenant de08c407-19b9-427d-9fe8-edf254300ca7"
    exit 1
fi
echo -e "${GREEN}✓ Azure CLI authenticated${NC}"
echo ""

# Test HTTPS connectivity to Azure
echo -e "${CYAN}Testing HTTPS connectivity to Azure...${NC}"
HTTPS_TEST=$(curl -s -o /dev/null -w "%{http_code}" https://login.microsoft.com/ 2>/dev/null || echo "000")

if [ "$HTTPS_TEST" = "200" ] || [ "$HTTPS_TEST" = "302" ]; then
    echo -e "${GREEN}✓ HTTPS connectivity working${NC}"
    DEPLOY_METHOD="automated"
    echo ""
    echo -e "${YELLOW}Deploying via Option A: Automated (CLI)${NC}"
    echo "This will:"
    echo "  1. Build shared libraries"
    echo "  2. Build backend"
    echo "  3. Install dependencies"
    echo "  4. Deploy to Azure App Service"
    echo "  5. Set environment variables"
    echo ""
    read -p "Continue with automated deployment? (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        ./fix-and-retry-deploy.sh
        DEPLOY_SUCCESS=$?
    else
        DEPLOY_SUCCESS=1
    fi
else
    echo -e "${YELLOW}⚠ HTTPS connectivity issue detected${NC}"
    echo "Likely cause: Corporate proxy/firewall"
    echo ""
    echo -e "${YELLOW}Switching to Option C: Azure Portal (No CLI)${NC}"
    echo ""
    echo "This will:"
    echo "  1. Build libraries locally"
    echo "  2. Build backend locally"
    echo "  3. Create deployment zip"
    echo "  4. Show instructions to upload via Azure Portal"
    echo ""
    read -p "Continue with Portal-based deployment? (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        DEPLOY_METHOD="portal"
        
        # Build and zip locally
        echo -e "${CYAN}Building libraries...${NC}"
        npm run build:libs
        
        echo -e "${CYAN}Building backend...${NC}"
        cd backend
        npm run build
        npm install --omit=dev
        
        echo -e "${CYAN}Creating deployment package...${NC}"
        cd ..
        zip -r muse-backend-deploy.zip backend/dist backend/package.json
        
        echo -e "${GREEN}✅ Deployment package created: muse-backend-deploy.zip${NC}"
        echo ""
        echo -e "${YELLOW}Next steps:${NC}"
        echo "  1. Open Azure Portal: https://portal.azure.com"
        echo "  2. Search: 'muse-backend'"
        echo "  3. Click App Service resource"
        echo "  4. Go to: Deployment Center → Manual Deployment"
        echo "  5. Upload: muse-backend-deploy.zip"
        echo "  6. Wait ~5 minutes for deployment to complete"
        echo "  7. Go to: Configuration → Application Settings"
        echo "  8. Add these settings:"
        echo "     - NODE_ENV = production"
        echo "     - COPILOT_STUDIO_CLIENT_ID = [your-client-id]"
        echo "     - COPILOT_STUDIO_CLIENT_SECRET = [your-client-secret]"
        echo "     - COPILOT_STUDIO_TENANT_ID = de08c407-19b9-427d-9fe8-edf254300ca7"
        echo "  9. Click Restart"
        echo "  10. Follow COPILOT_STUDIO_WIRING.md for wiring"
        echo ""
        echo "File ready for upload: muse-backend-deploy.zip"
        DEPLOY_SUCCESS=0
    else
        DEPLOY_SUCCESS=1
    fi
fi

echo ""
echo "════════════════════════════════════════════"

if [ $DEPLOY_SUCCESS -eq 0 ]; then
    echo -e "${GREEN}✅ Deployment initiated successfully${NC}"
    echo ""
    echo -e "${YELLOW}Next steps:${NC}"
    echo "  1. Wait for deployment to complete"
    echo "  2. Run: ./post-deploy-verify.sh"
    echo "  3. Run: ./e2e-verify.sh"
    echo "  4. Run: ./copilot-wiring-helper.sh"
    echo "  5. Follow: COPILOT_STUDIO_WIRING.md"
else
    echo -e "${RED}❌ Deployment failed or cancelled${NC}"
    echo ""
    echo -e "${YELLOW}To retry:${NC}"
    echo "  • Option A (Automated): ./fix-and-retry-deploy.sh"
    echo "  • Option B (Manual): Follow MANUAL_DEPLOYMENT.md"
    echo "  • Option C (Portal): Follow AZURE_PORTAL_DEPLOYMENT.md"
fi

exit $DEPLOY_SUCCESS
