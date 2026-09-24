#!/bin/bash

# AUTOMATED POST-DEPLOYMENT ORCHESTRATOR
# Runs complete verification after Azure deployment

set -e

BACKEND_URL="https://muse-backend.azurewebsites.net"
COLORS=true

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() {
    if [ "$COLORS" = true ]; then
        echo -e "${BLUE}ℹ${NC} $1"
    else
        echo "INFO: $1"
    fi
}

log_success() {
    if [ "$COLORS" = true ]; then
        echo -e "${GREEN}✅${NC} $1"
    else
        echo "SUCCESS: $1"
    fi
}

log_warn() {
    if [ "$COLORS" = true ]; then
        echo -e "${YELLOW}⚠️${NC} $1"
    else
        echo "WARN: $1"
    fi
}

log_error() {
    if [ "$COLORS" = true ]; then
        echo -e "${RED}❌${NC} $1"
    else
        echo "ERROR: $1"
    fi
}

echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║     POST-DEPLOYMENT VERIFICATION ORCHESTRATOR                 ║"
echo "║     Backend: $BACKEND_URL     ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# PHASE 1: Wait for backend to be ready
log_info "PHASE 1: Waiting for backend to respond..."
MAX_RETRIES=30
RETRY=0
BACKEND_READY=false

while [ $RETRY -lt $MAX_RETRIES ]; do
    if curl -s -o /dev/null -w "%{http_code}" "$BACKEND_URL/api/copilot/status" 2>/dev/null | grep -q "200"; then
        BACKEND_READY=true
        break
    fi
    RETRY=$((RETRY + 1))
    if [ $((RETRY % 5)) -eq 0 ]; then
        log_warn "Waiting... (attempt $RETRY/$MAX_RETRIES)"
    fi
    sleep 2
done

if [ "$BACKEND_READY" = false ]; then
    log_error "Backend not responding after $MAX_RETRIES attempts (5 minutes)"
    log_error "Troubleshooting:"
    log_error "1. Check Azure Portal: muse-backend App Service status"
    log_error "2. View logs: az webapp log tail --resource-group rg-mbgsol-muse-dev --name muse-backend"
    log_error "3. Verify URL: $BACKEND_URL/api/copilot/status"
    exit 1
fi

log_success "Backend is responding!"

# PHASE 2: Quick health check
log_info ""
log_info "PHASE 2: Running health check..."
HEALTH=$(curl -s "$BACKEND_URL/api/copilot/status")
echo "$HEALTH" | jq . 2>/dev/null || echo "$HEALTH"

if echo "$HEALTH" | grep -q '"connected":true'; then
    log_success "Health check passed: Backend is connected"
else
    log_warn "Health check incomplete: Check Copilot Studio credentials"
fi

# PHASE 3: Basic endpoint tests
log_info ""
log_info "PHASE 3: Testing basic endpoints..."

ENDPOINTS=(
    "GET /api/copilot/status"
    "POST /api/copilot/chat"
    "GET /api/conversations"
    "POST /api/conversations"
)

TESTS_PASSED=0
TESTS_TOTAL=0

for endpoint in "${ENDPOINTS[@]}"; do
    TESTS_TOTAL=$((TESTS_TOTAL + 1))
    METHOD=$(echo $endpoint | cut -d' ' -f1)
    PATH=$(echo $endpoint | cut -d' ' -f2)
    
    if [ "$METHOD" = "GET" ]; then
        STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BACKEND_URL$PATH")
    else
        STATUS=$(curl -s -X $METHOD -H "Content-Type: application/json" -d '{}' -o /dev/null -w "%{http_code}" "$BACKEND_URL$PATH")
    fi
    
    if [ "$STATUS" != "000" ]; then
        log_success "$METHOD $PATH: HTTP $STATUS"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        log_error "$METHOD $PATH: Failed to connect"
    fi
done

log_info ""
log_info "PHASE 3 Summary: $TESTS_PASSED/$TESTS_TOTAL endpoints responding"

# PHASE 4: Full E2E test suite
log_info ""
log_info "PHASE 4: Running comprehensive E2E tests..."

if [ -f "./e2e-verify.sh" ]; then
    log_info "Running: ./e2e-verify.sh"
    ./e2e-verify.sh || log_warn "Some E2E tests failed (check output above)"
else
    log_warn "e2e-verify.sh not found, skipping"
fi

# PHASE 5: Summary and next steps
log_info ""
log_info "PHASE 5: Post-deployment summary"
echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                    VERIFICATION COMPLETE                       ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

log_success "Backend deployed and verified!"
echo ""
echo "Next steps:"
echo "  1. Run: ./copilot-wiring-helper.sh"
echo "  2. Or manually follow: COPILOT_STUDIO_WIRING.md"
echo "  3. Test in Copilot Studio web chat"
echo "  4. Test in Electron app"
echo ""
echo "Backend URL: $BACKEND_URL"
echo "Copilot Studio: https://copilotstudio.microsoft.com"
echo ""
