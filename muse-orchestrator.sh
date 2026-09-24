#!/bin/bash

# Muse Backend - Master Deployment Orchestrator
# Automated end-to-end deployment, verification, and wiring

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

REPO_ROOT="/Users/948471/Projects/copilot-worktrees/muse/mshaw32-upgraded-adventure"
APP_URL="https://muse-backend.azurewebsites.net"

echo -e "${BLUE}╔════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║    MUSE BACKEND - MASTER ORCHESTRATOR     ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════╝${NC}"
echo ""

# ============================================================================
# MENU
# ============================================================================

show_menu() {
    echo -e "${YELLOW}What would you like to do?${NC}"
    echo ""
    echo "1. Check deployment status"
    echo "2. Verify backend is ready"
    echo "3. Run comprehensive tests"
    echo "4. Show Copilot Studio wiring guide"
    echo "5. Run end-to-end verification"
    echo "6. Show all commands"
    echo "0. Exit"
    echo ""
    read -p "Select option (0-6): " choice
}

# ============================================================================
# COMMANDS
# ============================================================================

check_status() {
    echo -e "${YELLOW}Checking deployment status...${NC}"
    echo ""
    
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$APP_URL/api/copilot/status" 2>/dev/null || echo "000")
    
    if [ "$HTTP_CODE" == "200" ] || [ "$HTTP_CODE" == "401" ]; then
        echo -e "${GREEN}✓ Backend is running${NC}"
        echo "  URL: $APP_URL"
        echo "  Status: HTTP $HTTP_CODE"
        echo ""
        
        # Show response
        echo "  Response:"
        curl -s "$APP_URL/api/copilot/status" | jq '.' 2>/dev/null || echo "  (unable to parse response)"
    else
        echo -e "${RED}✗ Backend not responding${NC}"
        echo "  HTTP Code: $HTTP_CODE"
        echo ""
        echo "  Troubleshooting:"
        echo "  - Check logs: az webapp log tail --resource-group rg-mbgsol-muse-dev --name muse-backend"
        echo "  - Restart: az webapp restart --resource-group rg-mbgsol-muse-dev --name muse-backend"
    fi
    echo ""
}

verify_backend() {
    echo -e "${YELLOW}Verifying backend...${NC}"
    echo ""
    cd "$REPO_ROOT"
    ./post-deploy-verify.sh "$APP_URL"
}

run_tests() {
    echo -e "${YELLOW}Running tests...${NC}"
    echo ""
    cd "$REPO_ROOT"
    ./test-backend.sh "$APP_URL"
}

show_wiring() {
    echo -e "${YELLOW}Copilot Studio Wiring Guide${NC}"
    echo ""
    cd "$REPO_ROOT"
    ./copilot-wiring-helper.sh "$APP_URL"
}

e2e_verify() {
    echo -e "${YELLOW}Running end-to-end verification...${NC}"
    echo ""
    cd "$REPO_ROOT"
    ./e2e-verify.sh "$APP_URL"
}

show_all_commands() {
    echo ""
    echo -e "${YELLOW}QUICK REFERENCE - ALL COMMANDS${NC}"
    echo ""
    echo -e "${BLUE}Deployment:${NC}"
    echo "  ./DEPLOY_ALL.sh                    - Automated deployment"
    echo "  ./MANUAL_DEPLOYMENT.md             - Step-by-step guide"
    echo ""
    echo -e "${BLUE}Verification:${NC}"
    echo "  ./post-deploy-verify.sh            - Verify backend is ready"
    echo "  ./test-backend.sh                  - Run all endpoint tests"
    echo "  ./e2e-verify.sh                    - Full end-to-end testing"
    echo ""
    echo -e "${BLUE}Copilot Studio:${NC}"
    echo "  ./copilot-wiring-helper.sh         - Wiring guide and helpers"
    echo "  COPILOT_STUDIO_WIRING.md           - Full wiring documentation"
    echo ""
    echo -e "${BLUE}Documentation:${NC}"
    echo "  QUICKSTART.md                      - Quick start guide"
    echo "  DEPLOYMENT_FINAL.md                - 50-page reference"
    echo "  START_HERE.md                      - Overview"
    echo ""
    echo -e "${BLUE}Direct curl tests:${NC}"
    echo "  curl $APP_URL/api/copilot/status"
    echo "  curl -X POST $APP_URL/api/copilot/chat -H 'Content-Type: application/json' -d '{\"prompt\":\"hello\"}'"
    echo ""
}

# ============================================================================
# MAIN LOOP
# ============================================================================

if [ $# -eq 0 ]; then
    # Interactive mode
    while true; do
        show_menu
        echo ""
        
        case $choice in
            1)
                check_status
                ;;
            2)
                verify_backend
                ;;
            3)
                run_tests
                ;;
            4)
                show_wiring
                ;;
            5)
                e2e_verify
                ;;
            6)
                show_all_commands
                ;;
            0)
                echo -e "${GREEN}Goodbye!${NC}"
                exit 0
                ;;
            *)
                echo -e "${RED}Invalid option${NC}"
                ;;
        esac
        
        read -p "Press Enter to continue..."
        clear
    done
else
    # Command mode
    case $1 in
        status)
            check_status
            ;;
        verify)
            verify_backend
            ;;
        test)
            run_tests
            ;;
        wiring)
            show_wiring
            ;;
        e2e)
            e2e_verify
            ;;
        help|commands)
            show_all_commands
            ;;
        *)
            echo "Usage: $0 [status|verify|test|wiring|e2e|help]"
            echo ""
            echo "Or run without arguments for interactive menu:"
            echo "  $0"
            exit 1
            ;;
    esac
fi
