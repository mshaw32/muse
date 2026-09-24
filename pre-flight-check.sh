#!/bin/bash

# Pre-flight checklist before deployment
# Ensures everything is ready to go

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   MUSE DEPLOYMENT - PRE-FLIGHT CHECK      ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════╝${NC}"
echo ""

CHECKS_PASSED=0
CHECKS_FAILED=0

# Check 1: Node.js installed
echo -n "Checking Node.js... "
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    echo -e "${GREEN}✓${NC} ($NODE_VERSION)"
    ((CHECKS_PASSED++))
else
    echo -e "${RED}✗ NOT FOUND${NC}"
    ((CHECKS_FAILED++))
fi

# Check 2: npm installed
echo -n "Checking npm... "
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm -v)
    echo -e "${GREEN}✓${NC} ($NPM_VERSION)"
    ((CHECKS_PASSED++))
else
    echo -e "${RED}✗ NOT FOUND${NC}"
    ((CHECKS_FAILED++))
fi

# Check 3: Azure CLI installed
echo -n "Checking Azure CLI... "
if command -v az &> /dev/null; then
    AZ_VERSION=$(az --version | head -1)
    echo -e "${GREEN}✓${NC} (installed)"
    ((CHECKS_PASSED++))
else
    echo -e "${RED}✗ NOT FOUND${NC}"
    ((CHECKS_FAILED++))
fi

# Check 4: Azure CLI login
echo -n "Checking Azure login... "
if az account show &>/dev/null; then
    ACCOUNT=$(az account show --query name -o tsv 2>/dev/null)
    echo -e "${GREEN}✓${NC} (logged in as $ACCOUNT)"
    ((CHECKS_PASSED++))
else
    echo -e "${RED}✗ NOT LOGGED IN${NC}"
    echo "    Run: az login --tenant de08c407-19b9-427d-9fe8-edf254300ca7"
    ((CHECKS_FAILED++))
fi

# Check 5: Backend directory exists
echo -n "Checking backend directory... "
if [ -d "backend" ]; then
    echo -e "${GREEN}✓${NC}"
    ((CHECKS_PASSED++))
else
    echo -e "${RED}✗ NOT FOUND${NC}"
    ((CHECKS_FAILED++))
fi

# Check 6: package.json exists
echo -n "Checking root package.json... "
if [ -f "package.json" ]; then
    echo -e "${GREEN}✓${NC}"
    ((CHECKS_PASSED++))
else
    echo -e "${RED}✗ NOT FOUND${NC}"
    ((CHECKS_FAILED++))
fi

# Check 7: Shared libraries exist
echo -n "Checking shared library... "
if [ -d "shared" ]; then
    echo -e "${GREEN}✓${NC}"
    ((CHECKS_PASSED++))
else
    echo -e "${RED}✗ NOT FOUND${NC}"
    ((CHECKS_FAILED++))
fi

# Check 8: Services library exists
echo -n "Checking services library... "
if [ -d "services" ]; then
    echo -e "${GREEN}✓${NC}"
    ((CHECKS_PASSED++))
else
    echo -e "${RED}✗ NOT FOUND${NC}"
    ((CHECKS_FAILED++))
fi

# Check 9: Deployment scripts exist
echo -n "Checking deployment scripts... "
if [ -x "DEPLOY_ALL.sh" ] && [ -x "fix-and-retry-deploy.sh" ]; then
    echo -e "${GREEN}✓${NC}"
    ((CHECKS_PASSED++))
else
    echo -e "${RED}✗ MISSING OR NOT EXECUTABLE${NC}"
    ((CHECKS_FAILED++))
fi

# Check 10: Git status
echo -n "Checking git status... "
if git status &>/dev/null; then
    BRANCH=$(git branch --show-current)
    echo -e "${GREEN}✓${NC} (branch: $BRANCH)"
    ((CHECKS_PASSED++))
else
    echo -e "${RED}✗ NOT A GIT REPO${NC}"
    ((CHECKS_FAILED++))
fi

echo ""
echo "════════════════════════════════════════════"
echo -e "Checks passed: ${GREEN}$CHECKS_PASSED${NC}/10"
echo -e "Checks failed: ${RED}$CHECKS_FAILED${NC}/10"
echo "════════════════════════════════════════════"
echo ""

if [ $CHECKS_FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ All checks passed! Ready for deployment.${NC}"
    echo ""
    echo "Next step: Run one of these commands"
    echo ""
    echo "  Option A (Automated):"
    echo "    ./fix-and-retry-deploy.sh"
    echo ""
    echo "  Option B (Manual):"
    echo "    Follow MANUAL_DEPLOYMENT.md"
    echo ""
    echo "  Option C (Portal):"
    echo "    Follow AZURE_PORTAL_DEPLOYMENT.md"
    exit 0
else
    echo -e "${RED}❌ Some checks failed. Fix issues above, then retry.${NC}"
    echo ""
    if ! command -v az &> /dev/null; then
        echo -e "${YELLOW}Install Azure CLI:${NC} brew install azure-cli"
    fi
    if ! az account show &>/dev/null; then
        echo -e "${YELLOW}Login to Azure:${NC} az login --tenant de08c407-19b9-427d-9fe8-edf254300ca7"
    fi
    exit 1
fi
