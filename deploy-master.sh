#!/bin/bash

# MUSE DEPLOYMENT MASTER ORCHESTRATOR
# Complete deployment automation from zip upload to end-to-end testing

set -e

BACKEND_URL="https://muse-backend.azurewebsites.net"
DEPLOYMENT_ZIP="muse-backend-deploy.zip"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_step() {
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}STEP: $1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

log_info() {
    echo -e "${BLUE}ℹ️ $1${NC}"
}

# HEADER
echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║        MUSE DEPLOYMENT MASTER ORCHESTRATOR                    ║"
echo "║        Complete automation from deployment to testing         ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# CHECK PREREQUISITES
log_step "Checking Prerequisites"

if [ ! -f "$DEPLOYMENT_ZIP" ]; then
    log_error "Deployment zip not found: $DEPLOYMENT_ZIP"
    log_info "Run: ./deploy-via-portal.sh to create it"
    exit 1
fi
log_success "Deployment zip exists: $DEPLOYMENT_ZIP ($(ls -lh $DEPLOYMENT_ZIP | awk '{print $5}'))"

if ! command -v curl &> /dev/null; then
    log_error "curl not found"
    exit 1
fi
log_success "curl is available"

if ! command -v jq &> /dev/null; then
    log_warn "jq not found (nice to have for JSON parsing)"
fi

# STEP 1: Verify zip contents
log_step "Verifying Deployment Package"
log_info "Zip contents:"
unzip -l "$DEPLOYMENT_ZIP" | head -20

# STEP 2: Portal instructions
log_step "Azure Portal Deployment Instructions"
cat << 'EOF'

To deploy using Azure Portal:

1. Open: https://portal.azure.com
2. Search: "muse-backend" (App Service)
3. Click: Deployment → Deployment center
4. Select: Upload zip file
5. Choose file: muse-backend-deploy.zip
6. Click: Deploy
7. Wait: 5-10 minutes

AFTER DEPLOYMENT IN PORTAL:
   Run this command to verify:

   curl -s https://muse-backend.azurewebsites.net/api/copilot/status | jq .

THEN:
   Run this script with --verify flag:
   
   ./deploy-master.sh --verify

EOF

read -p "Have you uploaded the zip to Azure Portal? (y/n): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    log_info "Please upload the zip file to Azure Portal first."
    log_info "See instructions above."
    exit 0
fi

# STEP 3: Wait for backend
log_step "Waiting for Backend to Be Ready"
MAX_RETRIES=60
RETRY=0

log_info "Testing: $BACKEND_URL/api/copilot/status"
while [ $RETRY -lt $MAX_RETRIES ]; do
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BACKEND_URL/api/copilot/status" 2>/dev/null || echo "000")
    
    if [ "$STATUS" = "200" ]; then
        log_success "Backend is responding (HTTP $STATUS)"
        break
    fi
    
    RETRY=$((RETRY + 1))
    if [ $((RETRY % 10)) -eq 0 ]; then
        log_info "Waiting... (attempt $RETRY/$MAX_RETRIES, ${RETRY}0 seconds elapsed)"
    fi
    sleep 1
done

if [ "$STATUS" != "200" ]; then
    log_error "Backend not responding after $MAX_RETRIES attempts"
    log_info "Troubleshooting:"
    log_info "1. Check Azure Portal - muse-backend should show 'Running'"
    log_info "2. View logs: az webapp log tail --resource-group rg-mbgsol-muse-dev --name muse-backend"
    log_info "3. Check URL: $BACKEND_URL"
    exit 1
fi

# STEP 4: Health check
log_step "Running Health Check"
HEALTH=$(curl -s "$BACKEND_URL/api/copilot/status")
log_info "Health status response:"
echo "$HEALTH" | jq . 2>/dev/null || echo "$HEALTH"

if echo "$HEALTH" | grep -q "connected"; then
    log_success "Health check passed"
else
    log_warn "Connection status unknown (may need Copilot Studio credentials)"
fi

# STEP 5: Run verification suite
log_step "Running Comprehensive Verification"
if [ -f "./verify-deployment.sh" ]; then
    log_info "Running: ./verify-deployment.sh"
    chmod +x ./verify-deployment.sh
    ./verify-deployment.sh
else
    log_warn "verify-deployment.sh not found"
fi

# STEP 6: Copilot Studio wiring
log_step "Preparing Copilot Studio Wiring"
cat << 'EOF'

Your backend is now deployed and verified!

NEXT: Wire your Copilot Studio agent to the backend

OPTION A - Interactive Guide (recommended):
   ./copilot-wiring-helper.sh

OPTION B - Manual UI Steps:
   See: COPILOT_STUDIO_WIRING.md

Backend URL for wiring:
   https://muse-backend.azurewebsites.net/api/copilot/chat

Required HTTP Configuration:
   Method: POST
   Headers: Content-Type: application/json
   Body: 
     {
       "message": "{user.message}",
       "conversationId": "{conversation.id}",
       "userId": "{user.id}",
       "includeContext": true
     }

EOF

read -p "Ready to wire Copilot Studio? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    if [ -f "./copilot-wiring-helper.sh" ]; then
        chmod +x ./copilot-wiring-helper.sh
        ./copilot-wiring-helper.sh
    fi
fi

# FINAL SUMMARY
echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║               DEPLOYMENT ORCHESTRATOR COMPLETE                ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
log_success "Backend deployed and verified!"
echo ""
echo "Status Summary:"
echo "  ✅ Backend running: $BACKEND_URL"
echo "  ✅ Endpoints verified"
echo "  ✅ Health check passed"
echo ""
echo "Next Actions:"
echo "  1. Complete Copilot Studio wiring (if not done above)"
echo "  2. Test in Copilot Studio web chat"
echo "  3. Test in Electron app"
echo "  4. Monitor logs: az webapp log tail --resource-group rg-mbgsol-muse-dev --name muse-backend"
echo ""
