#!/bin/bash

# Muse Backend - Post-Deployment Test Suite
# Run this after backend deployment to verify all endpoints work

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
APP_URL="${1:-https://muse-backend.azurewebsites.net}"
TEST_CONVERSATION_ID="test-$(date +%s)"
PASS_COUNT=0
FAIL_COUNT=0

echo -e "${BLUE}╔════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   MUSE BACKEND - POST-DEPLOYMENT TESTS    ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}Testing: $APP_URL${NC}"
echo "Conversation ID: $TEST_CONVERSATION_ID"
echo ""

# Test function
test_endpoint() {
    local name=$1
    local method=$2
    local endpoint=$3
    local data=$4
    local expected_status=$5

    echo -n "Test: $name... "
    
    if [ "$method" == "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" "$APP_URL$endpoint")
    else
        response=$(curl -s -w "\n%{http_code}" -X "$method" \
            -H "Content-Type: application/json" \
            -d "$data" \
            "$APP_URL$endpoint")
    fi
    
    http_code=$(echo "$response" | tail -1)
    body=$(echo "$response" | head -n -1)
    
    if [ "$http_code" == "$expected_status" ]; then
        echo -e "${GREEN}✓ HTTP $http_code${NC}"
        PASS_COUNT=$((PASS_COUNT + 1))
        
        # Show response if successful
        if [ ! -z "$body" ]; then
            echo "  Response: $(echo "$body" | jq -c '.' 2>/dev/null || echo "$body" | head -c 100)"
        fi
    else
        echo -e "${RED}✗ HTTP $http_code (expected $expected_status)${NC}"
        echo "  Response: $(echo "$body" | head -c 200)"
        FAIL_COUNT=$((FAIL_COUNT + 1))
    fi
    echo ""
}

# ============================================================================
# PHASE 2 ENDPOINTS (Core compatibility)
# ============================================================================

echo -e "${YELLOW}Phase 2: Core Compatibility Endpoints${NC}"
echo "────────────────────────────────────────"

test_endpoint \
    "Chat: Question (backward compat)" \
    "POST" \
    "/api/copilot/chat" \
    "{\"question\":\"Who are you?\",\"conversationId\":\"$TEST_CONVERSATION_ID\"}" \
    "200"

test_endpoint \
    "Chat: Prompt (Phase 3)" \
    "POST" \
    "/api/copilot/chat" \
    "{\"prompt\":\"Hello Muse\",\"conversationId\":\"$TEST_CONVERSATION_ID\"}" \
    "200"

test_endpoint \
    "Retrieve: Work Context" \
    "POST" \
    "/api/copilot/retrieve" \
    "{\"type\":\"work-context\",\"query\":\"my projects\"}" \
    "200"

test_endpoint \
    "Retrieve: Files" \
    "POST" \
    "/api/copilot/retrieve" \
    "{\"type\":\"files\",\"query\":\"documents\"}" \
    "200"

test_endpoint \
    "Retrieve: Meetings" \
    "POST" \
    "/api/copilot/retrieve" \
    "{\"type\":\"meetings\",\"query\":\"this week\"}" \
    "200"

test_endpoint \
    "Retrieve: Tasks" \
    "POST" \
    "/api/copilot/retrieve" \
    "{\"type\":\"tasks\",\"query\":\"high priority\"}" \
    "200"

# ============================================================================
# PHASE 3 ENDPOINTS (New functionality)
# ============================================================================

echo -e "${YELLOW}Phase 3: Core Functionality Endpoints${NC}"
echo "────────────────────────────────────────"

test_endpoint \
    "Status: Connection health" \
    "GET" \
    "/api/copilot/status" \
    "" \
    "200"

test_endpoint \
    "Auth: Login" \
    "POST" \
    "/api/copilot/auth/login" \
    "{}" \
    "200"

test_endpoint \
    "Conversation: New" \
    "POST" \
    "/api/copilot/conversation/new" \
    "{}" \
    "200"

test_endpoint \
    "Conversation: Active" \
    "GET" \
    "/api/copilot/conversation/active" \
    "" \
    "200"

test_endpoint \
    "Conversation: History" \
    "GET" \
    "/api/copilot/conversation/history" \
    "" \
    "200"

# ============================================================================
# STREAMING ENDPOINT (Advanced)
# ============================================================================

echo -e "${YELLOW}Streaming Endpoint${NC}"
echo "────────────────────────────────────────"

echo -n "Test: Stream response (SSE)... "
response=$(curl -s -w "\n%{http_code}" -X POST \
    -H "Content-Type: application/json" \
    -d "{\"prompt\":\"test\",\"conversationId\":\"$TEST_CONVERSATION_ID\"}" \
    "$APP_URL/api/copilot/chat/stream" | tail -1)

if [ "$response" == "200" ]; then
    echo -e "${GREEN}✓ HTTP 200${NC}"
    PASS_COUNT=$((PASS_COUNT + 1))
else
    echo -e "${RED}✗ HTTP $response (expected 200)${NC}"
    FAIL_COUNT=$((FAIL_COUNT + 1))
fi
echo ""

# ============================================================================
# ADDITIONAL ENDPOINTS
# ============================================================================

echo -e "${YELLOW}Additional Endpoints${NC}"
echo "────────────────────────────────────────"

test_endpoint \
    "Auth: Logout" \
    "POST" \
    "/api/copilot/auth/logout" \
    "{}" \
    "200"

test_endpoint \
    "Conversation: Clear" \
    "POST" \
    "/api/copilot/conversation/clear" \
    "{}" \
    "200"

test_endpoint \
    "Conversation: Export (JSON)" \
    "POST" \
    "/api/copilot/conversation/export" \
    "{\"conversationId\":\"test-conv\",\"format\":\"json\"}" \
    "200"

test_endpoint \
    "Conversation: Summarize" \
    "POST" \
    "/api/copilot/conversation/summarize" \
    "{\"conversationId\":\"test-conv\"}" \
    "200"

# ============================================================================
# ERROR HANDLING TESTS
# ============================================================================

echo -e "${YELLOW}Error Handling${NC}"
echo "────────────────────────────────────────"

test_endpoint \
    "Chat: Empty message (should fail)" \
    "POST" \
    "/api/copilot/chat" \
    "{\"message\":\"\",\"conversationId\":\"$TEST_CONVERSATION_ID\"}" \
    "400"

test_endpoint \
    "Retrieve: Unknown type" \
    "POST" \
    "/api/copilot/retrieve" \
    "{\"type\":\"unknown-type\",\"query\":\"test\"}" \
    "200"

# ============================================================================
# SUMMARY
# ============================================================================

echo ""
echo -e "${BLUE}╔════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                TEST SUMMARY               ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════╝${NC}"
echo ""

TOTAL=$((PASS_COUNT + FAIL_COUNT))

if [ $FAIL_COUNT -eq 0 ]; then
    echo -e "${GREEN}✓ All $TOTAL tests passed!${NC}"
    echo ""
    echo "Backend is ready for Copilot Studio integration."
    exit 0
else
    echo -e "${RED}✗ $FAIL_COUNT of $TOTAL tests failed${NC}"
    echo ""
    echo "Please review the errors above and check backend logs:"
    echo "  az webapp log tail --resource-group rg-mbgsol-muse-dev --name muse-backend"
    exit 1
fi
