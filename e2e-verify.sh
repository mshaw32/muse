#!/bin/bash

# Muse Backend - Complete End-to-End Testing
# Verifies entire deployment pipeline from start to finish

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Track results
PASS_COUNT=0
FAIL_COUNT=0
TESTS=()

# Test function
assert_endpoint() {
    local name=$1
    local method=$2
    local endpoint=$3
    local data=$4
    local expected_code=$5
    
    echo -n "  $name... "
    
    if [ "$method" == "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" "$endpoint")
    else
        response=$(curl -s -w "\n%{http_code}" -X "$method" \
            -H "Content-Type: application/json" \
            -d "$data" "$endpoint")
    fi
    
    code=$(echo "$response" | tail -1)
    body=$(echo "$response" | head -n -1)
    
    if [ "$code" == "$expected_code" ]; then
        echo -e "${GREEN}✓${NC}"
        PASS_COUNT=$((PASS_COUNT + 1))
        TESTS+=("$name")
    else
        echo -e "${RED}✗ (HTTP $code, expected $expected_code)${NC}"
        FAIL_COUNT=$((FAIL_COUNT + 1))
    fi
}

# Main
APP_URL="${1:-https://muse-backend.azurewebsites.net}"

echo -e "${BLUE}╔════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   MUSE BACKEND - E2E VERIFICATION SUITE   ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════╝${NC}"
echo ""
echo "Testing: $APP_URL"
echo ""

# Phase 1: Core Endpoints
echo -e "${YELLOW}PHASE 1: Core Functionality${NC}"
assert_endpoint "Status" "GET" "$APP_URL/api/copilot/status" "" "200"
assert_endpoint "Chat" "POST" "$APP_URL/api/copilot/chat" '{"prompt":"test"}' "200"
assert_endpoint "Chat Stream" "POST" "$APP_URL/api/copilot/chat/stream" '{"prompt":"test"}' "200"
echo ""

# Phase 2: Conversation Management
echo -e "${YELLOW}PHASE 2: Conversation Management${NC}"
assert_endpoint "New Conversation" "POST" "$APP_URL/api/copilot/conversation/new" "{}" "200"
assert_endpoint "Active Conversation" "GET" "$APP_URL/api/copilot/conversation/active" "" "200"
assert_endpoint "Conversation History" "GET" "$APP_URL/api/copilot/conversation/history" "" "200"
assert_endpoint "Clear Conversation" "POST" "$APP_URL/api/copilot/conversation/clear" "{}" "200"
echo ""

# Phase 3: Authentication
echo -e "${YELLOW}PHASE 3: Authentication${NC}"
assert_endpoint "Auth Login" "POST" "$APP_URL/api/copilot/auth/login" "{}" "200"
assert_endpoint "Auth Logout" "POST" "$APP_URL/api/copilot/auth/logout" "{}" "200"
echo ""

# Phase 4: Data Retrieval
echo -e "${YELLOW}PHASE 4: Data Retrieval${NC}"
assert_endpoint "Retrieve (work-context)" "POST" "$APP_URL/api/copilot/retrieve" '{"type":"work-context"}' "200"
assert_endpoint "Retrieve (files)" "POST" "$APP_URL/api/copilot/retrieve" '{"type":"files"}' "200"
assert_endpoint "Retrieve (meetings)" "POST" "$APP_URL/api/copilot/retrieve" '{"type":"meetings"}' "200"
echo ""

# Phase 5: Conversation Operations
echo -e "${YELLOW}PHASE 5: Conversation Operations${NC}"
assert_endpoint "Export Conversation" "POST" "$APP_URL/api/copilot/conversation/export" '{"conversationId":"test"}' "200"
assert_endpoint "Summarize Conversation" "POST" "$APP_URL/api/copilot/conversation/summarize" '{"conversationId":"test"}' "200"
echo ""

# Summary
echo -e "${BLUE}╔════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║              TEST SUMMARY                 ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════╝${NC}"
echo ""

TOTAL=$((PASS_COUNT + FAIL_COUNT))

if [ $FAIL_COUNT -eq 0 ]; then
    echo -e "${GREEN}✓ ALL $TOTAL TESTS PASSED${NC}"
    echo ""
    echo "Backend verification complete!"
    echo ""
    echo "Next steps:"
    echo "  1. Run: ./copilot-wiring-helper.sh"
    echo "  2. Follow Copilot Studio wiring guide"
    echo "  3. Test in web chat"
    echo "  4. Publish agent"
    exit 0
else
    echo -e "${RED}✗ $FAIL_COUNT of $TOTAL tests failed${NC}"
    echo ""
    echo "Troubleshooting:"
    echo "  - Check logs: az webapp log tail --resource-group rg-mbgsol-muse-dev --name muse-backend"
    echo "  - Restart app: az webapp restart --resource-group rg-mbgsol-muse-dev --name muse-backend"
    echo "  - Retry: ./e2e-verify.sh"
    exit 1
fi
