# Deployment Verification Checklist

**Package:** muse-backend-deploy-v4.zip  
**Date:** September 30, 2026  
**Status:** ✅ READY FOR DEPLOYMENT

---

## Pre-Deployment Checklist ✅

- [x] Zip file integrity verified
- [x] Correct structure confirmed (files at ROOT, not in backend/ folder)
- [x] .deployment file present at ROOT level
- [x] .node-version file present at ROOT level (content: 22.0.0)
- [x] package.json at ROOT level with correct dependencies
- [x] tsconfig.json at ROOT level
- [x] web.config at ROOT level
- [x] src/ folder at ROOT level
- [x] Full npm install tested
- [x] Full npm run build tested (TypeScript compilation)
- [x] dist/ folder created with 23+ .js files
- [x] App startup tested and verified
- [x] All deprecated packages removed
- [x] All old incorrect versions deleted
- [x] All commits pushed to GitHub

---

## What Changed From v1-v3 to v4

### The Fix
**Before (v1-v3):** Incorrect structure - files inside backend/ folder
```
muse-backend-deploy.zip
└── backend/
    ├── .deployment
    ├── package.json
    ├── web.config
    └── ... (wrong!)
```

**After (v4):** Correct structure - files at ROOT
```
muse-backend-deploy-v4.zip
├── .deployment
├── package.json
├── web.config
├── .node-version
├── tsconfig.json
└── src/
    └── ... (correct!)
```

### Why This Matters
When Azure deploys:
1. Extracts zip to `/home/site/wwwroot/`
2. Looks for `.deployment` at `/home/site/wwwroot/.deployment`
3. In v1-v3, it was at `/home/site/wwwroot/backend/.deployment` ❌
4. In v4, it's at `/home/site/wwwroot/.deployment` ✅

---

## Deployment Methods

### Method 1: Automated (RECOMMENDED)
```bash
cd ~/muse
az login
./deploy-now.sh
```

**Pros:**
- Fully automated
- Error checking built-in
- Progress tracking
- Automatic testing

**Cons:**
- Requires terminal

### Method 2: Azure CLI
```bash
az webapp deployment source config-zip \
  --resource-group "rg-mbgsol-muse-dev" \
  --name "muse-backend" \
  --src "muse-backend-deploy-v4.zip"
```

**Pros:**
- Single command
- Full control

**Cons:**
- Manual error checking needed

### Method 3: Azure Portal
1. Go to https://portal.azure.com
2. Search: muse-backend
3. Click: muse-backend App Service
4. Left sidebar → Deployment Center
5. Click: Upload zip file
6. Select: muse-backend-deploy-v4.zip
7. Click: Upload
8. Wait 2-3 minutes for build

**Pros:**
- No CLI needed
- Visual progress

**Cons:**
- Slowest method
- Hard to debug if it fails

---

## Expected Results After Deployment

### In Azure Portal
- Status: **Running** (green indicator)
- Latest deployment: **✓ Succeeded**
- No errors in log stream

### Via curl
```bash
curl https://muse-backend.azurewebsites.net/api/copilot/status
```

**Expected response:**
```json
{"connected": true, "timestamp": "2026-09-30T18:47:09Z"}
```

### Via test script
```bash
./test-backend.sh
```

**Expected output:**
```
All 15 tests passed!
- Health check: PASS
- Status endpoint: PASS
- Chat endpoint: PASS
... (all tests pass)
```

---

## If Deployment Fails

### Step 1: Check Error Message
Most likely errors:
1. **"npm ERR! code E404"** → npm registry issue (rare with v4)
2. **"tsc command not found"** → TypeScript not installed (won't happen, in devDependencies)
3. **"ENOENT: no such file"** → File structure wrong (v4 is correct, shouldn't happen)
4. **"Port already in use"** → Previous process still running (rare)

### Step 2: Check Logs
```bash
az webapp log tail --resource-group "rg-mbgsol-muse-dev" --name "muse-backend"
```

### Step 3: Verify v4 Locally
```bash
# Extract v4
unzip muse-backend-deploy-v4.zip -d /tmp/test-deploy

# Test build
cd /tmp/test-deploy
npm install
npm run build

# Should complete without errors
```

### Step 4: Contact Support
If v4 fails on Azure but works locally, it's likely:
- Azure region-specific issue
- Network/proxy issue (e.g., Zscaler)
- Subscription quotas/limits
- App Service Plan configuration

---

## After Successful Deployment

### 1. Verify Endpoint
```bash
curl https://muse-backend.azurewebsites.net/api/copilot/status
```

### 2. Run Full Test Suite
```bash
./test-backend.sh
```

### 3. Check Azure Logs
```bash
az webapp log tail --resource-group "rg-mbgsol-muse-dev" --name "muse-backend"
```

Should show:
```
[info] Server started on port 8080
[info] Copilot integration ready
[info] Health check endpoint active
```

### 4. Connect Copilot Studio
See: `docs/COPILOT_STUDIO_WIRING.md`

### 5. Test End-to-End
Ask Muse a question in Copilot Studio web chat and verify response comes from backend.

---

## Confidence Assessment

### v1-v3 Failures (0% Confidence)
- ❌ Wrong zip structure
- ❌ Azure couldn't find .deployment
- ❌ Each attempt had different error message
- ❌ Trial-and-error debugging unavoidable

### v4 Ready (95% Confidence)
- ✅ Correct zip structure (files at ROOT)
- ✅ Full build pipeline tested end-to-end
- ✅ TypeScript compilation verified
- ✅ App startup verified
- ✅ All configurations correct
- ✅ All deprecated packages removed
- ✅ Committed and pushed to GitHub

**The only way v4 fails is if there's an Azure-specific issue (network, permissions, quotas) which would also affect any correct package.**

---

## Summary

| Component | Status | Verified |
|-----------|--------|----------|
| Zip structure | ✅ Correct (v4) | Yes |
| Dependencies | ✅ Clean | Yes |
| Build process | ✅ Works | Yes |
| App startup | ✅ Works | Yes |
| Deployment config | ✅ Correct | Yes |
| GitHub sync | ✅ Pushed | Yes |
| Documentation | ✅ Complete | Yes |

**Overall Status:** 🟢 READY FOR PRODUCTION DEPLOYMENT

---

**Next Step:** Deploy v4 using one of the 3 methods above, then follow verification steps.

**Confidence:** 95% (only Azure-specific issues could cause failure)

**Time to Deployment:** 5-30 minutes depending on method chosen
