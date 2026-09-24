#!/bin/bash

# Muse Backend - Automated Post-Deployment Execution
# Run this immediately after deployment completes to verify, test, and prepare for Copilot wiring

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
APP_URL="${1:-https://muse-backend.azurewebsites.net}"
MAX_RETRIES=10
RETRY_DELAY=5

echo -e "${BLUE}╔════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   MUSE BACKEND - POST-DEPLOYMENT EXEC     ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════╝${NC}"
echo ""

# ============================================================================
# PHASE 1: WAIT FOR BACKEND TO BE READY
# ============================================================================

echo -e "${YELLOW}[1/4] Waiting for backend to be ready...${NC}"
echo "URL: $APP_URL"
echo ""

READY=0
for i in $(seq 1 $MAX_RETRIES); do
    echo -n "  Attempt $i/$MAX_RETRIES... "
    
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$APP_URL/api/copilot/status" 2>/dev/null || echo "000")
    
    if [ "$HTTP_CODE" == "200" ] || [ "$HTTP_CODE" == "401" ]; then
        echo -e "${GREEN}✓ Backend is ready (HTTP $HTTP_CODE)${NC}"
        READY=1
        break
    else
        echo -e "HTTP $HTTP_CODE (retrying in ${RETRY_DELAY}s...)"
        sleep $RETRY_DELAY
    fi
done

if [ $READY -eq 0 ]; then
    echo -e "${RED}✗ Backend failed to start after $MAX_RETRIES attempts${NC}"
    echo ""
    echo "Troubleshooting:"
    echo "  1. Check app service logs:"
    echo "     az webapp log tail --resource-group rg-mbgsol-muse-dev --name muse-backend"
    echo "  2. Verify app service is running:"
    echo "     az webapp show --resource-group rg-mbgsol-muse-dev --name muse-backend"
    echo "  3. Try restarting:"
    echo "     az webapp restart --resource-group rg-mbgsol-muse-dev --name muse-backend"
    exit 1
fi

echo ""

# ============================================================================
# PHASE 2: RUN QUICK HEALTH CHECK
# ============================================================================

echo -e "${YELLOW}[2/4] Running quick health check...${NC}"
echo ""

# Get status
STATUS=$(curl -s "$APP_URL/api/copilot/status" | jq '.' 2>/dev/null || echo "{}")

echo "Status response:"
echo "$STATUS" | jq '.' 2>/dev/null || echo "$STATUS"
echo ""

# ============================================================================
# PHASE 3: RUN COMPREHENSIVE TEST SUITE
# ============================================================================

echo -e "${YELLOW}[3/4] Running comprehensive test suite...${NC}"
echo ""

cd /Users/948471/Projects/copilot-worktrees/muse/mshaw32-upgraded-adventure

./test-backend.sh "$APP_URL"

TEST_RESULT=$?

echo ""

# ============================================================================
# PHASE 4: PREPARE FOR COPILOT STUDIO WIRING
# ============================================================================

echo -e "${YELLOW}[4/4] Preparing for Copilot Studio wiring...${NC}"
echo ""

if [ $TEST_RESULT -eq 0 ]; then
    echo -e "${GREEN}✓ All tests passed!${NC}"
    echo ""
    echo "Backend is ready for Copilot Studio integration."
    echo ""
    echo "Next steps:"
    echo "  1. Open Copilot Studio: https://copilotstudio.microsoft.com"
    echo "  2. Open your Muse agent"
    echo "  3. Follow: COPILOT_STUDIO_WIRING.md (steps 1-8)"
    echo "  4. Use this URL for HTTP action:"
    echo ""
    echo -e "     ${YELLOW}$APP_URL/api/copilot/chat${NC}"
    echo ""
    echo "  5. Test in web chat: Send 'Hello Muse'"
    echo "  6. Verify response appears"
    echo "  7. Publish agent"
    echo ""
    echo -e "${GREEN}╔════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║       DEPLOYMENT & VERIFICATION PASSED     ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════╝${NC}"
    echo ""
    exit 0
else
    echo -e "${RED}✗ Tests failed.${NC}"
    echo ""
    echo "Troubleshooting:"
    echo "  1. Check detailed logs above"
    echo "  2. Common issues:"
    echo "     - Credentials not set: az webapp config appsettings set ..."
    echo "     - TypeScript not compiled: npm run build in backend/"
    echo "     - Port not configured: Check PORT env var"
    echo "  3. Restart and retry:"
    echo "     az webapp restart --resource-group rg-mbgsol-muse-dev --name muse-backend"
    echo "     sleep 30"
    echo "     ./post-deploy-verify.sh"
    exit 1
fi
