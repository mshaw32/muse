#!/bin/bash

# Muse Backend - Copilot Studio Wiring Helper
# Provides automation and verification for Copilot Studio integration

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

APP_URL="${1:-https://muse-backend.azurewebsites.net}"

echo -e "${BLUE}╔════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   MUSE COPILOT STUDIO WIRING HELPER       ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════╝${NC}"
echo ""

# ============================================================================
# VERIFY BACKEND IS READY
# ============================================================================

echo -e "${YELLOW}Verifying backend...${NC}"

HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$APP_URL/api/copilot/status" 2>/dev/null)

if [ "$HTTP_CODE" != "200" ] && [ "$HTTP_CODE" != "401" ]; then
    echo -e "${RED}✗ Backend not responding (HTTP $HTTP_CODE)${NC}"
    echo "Run ./post-deploy-verify.sh first"
    exit 1
fi

echo -e "${GREEN}✓ Backend is ready${NC}"
echo ""

# ============================================================================
# SHOW WIRING INSTRUCTIONS
# ============================================================================

echo -e "${YELLOW}COPILOT STUDIO WIRING STEPS:${NC}"
echo ""
echo "1. Open Copilot Studio: https://copilotstudio.microsoft.com"
echo "2. Click 'My Copilots' and open 'Muse'"
echo "3. Click 'Actions' → 'Add an action' → 'Create a new cloud flow'"
echo ""
echo -e "${BLUE}HTTP Configuration:${NC}"
echo "  Method: POST"
echo "  URL: $APP_URL/api/copilot/chat"
echo "  Headers:"
echo "    Content-Type: application/json"
echo ""
echo -e "${BLUE}Body (Example):${NC}"
echo "  {\"message\": \"Hello Muse\", \"conversationId\": \"123\"}"
echo ""
echo "4. Test in web chat: Send 'Hello Muse, who are you?'"
echo "5. Verify response appears"
echo "6. Click 'Publish'"
echo ""

# ============================================================================
# PROVIDE TEST COMMANDS
# ============================================================================

echo -e "${YELLOW}QUICK TEST COMMANDS:${NC}"
echo ""
echo "Test chat endpoint:"
echo "  curl -X POST $APP_URL/api/copilot/chat \\"
echo "    -H 'Content-Type: application/json' \\"
echo "    -d '{\"message\": \"Hello\", \"conversationId\": \"test\"}'"
echo ""
echo "Test streaming endpoint:"
echo "  curl -X POST $APP_URL/api/copilot/chat/stream \\"
echo "    -H 'Content-Type: application/json' \\"
echo "    -d '{\"prompt\": \"Hello\", \"conversationId\": \"test\"}'"
echo ""

# ============================================================================
# PROVIDE TROUBLESHOOTING
# ============================================================================

echo -e "${YELLOW}TROUBLESHOOTING:${NC}"
echo ""
echo "If Copilot Studio can't reach backend:"
echo "  1. Verify locally: curl $APP_URL/api/copilot/status"
echo "  2. Check auth: HTTP POST requires proper credentials"
echo "  3. Test power automate: Check flow execution logs"
echo "  4. Restart if needed: az webapp restart --resource-group rg-mbgsol-muse-dev --name muse-backend"
echo ""
echo "For detailed wiring guide, see: COPILOT_STUDIO_WIRING.md"
echo ""

# ============================================================================
# ENDPOINT REFERENCE
# ============================================================================

echo -e "${YELLOW}AVAILABLE ENDPOINTS:${NC}"
echo ""
echo "Status (GET):"
echo "  $APP_URL/api/copilot/status"
echo ""
echo "Chat (POST):"
echo "  $APP_URL/api/copilot/chat"
echo "  Body: {\"prompt\": \"...\", \"conversationId\": \"...\"}"
echo ""
echo "Chat Stream (POST, SSE):"
echo "  $APP_URL/api/copilot/chat/stream"
echo "  Body: {\"prompt\": \"...\", \"conversationId\": \"...\"}"
echo ""
echo "Conversations (GET/POST):"
echo "  $APP_URL/api/copilot/conversation/new"
echo "  $APP_URL/api/copilot/conversation/active"
echo "  $APP_URL/api/copilot/conversation/history"
echo "  $APP_URL/api/copilot/conversation/clear"
echo ""

echo -e "${GREEN}Ready to wire to Copilot Studio!${NC}"
