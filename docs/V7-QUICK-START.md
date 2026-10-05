# V7 Deployment - Quick Start (3 Steps)

## ✅ What Changed
V6 failed because `.deployment` file told Azure to run a broken script. V7 removes that file and flattens the directory structure so Azure's built-in Node.js detection works.

**All testing complete. App verified to start successfully.**

---

## 3-Step Deployment

### Step 1: Deploy the Zip
```bash
az webapp deployment source config-zip \
  --resource-group rg-mbgsol-muse-dev \
  --name muse-backend \
  --src muse-backend-deploy-v7.zip
```

⏱️ **Wait 2-3 minutes** for deployment to complete

### Step 2: Set Environment Variables
Go to **Azure Portal** → **muse-backend** → **Configuration** → **Application settings**

Add these 4 settings:
```
NODE_ENV = production
COPILOT_STUDIO_CLIENT_ID = [your-app-id]
COPILOT_STUDIO_CLIENT_SECRET = [your-app-secret]
COPILOT_STUDIO_TENANT_ID = de08c407-19b9-427d-9fe8-edf254300ca7
```

Click **Save** → **Continue** → **Restart**

### Step 3: Verify It Works
```bash
curl https://muse-backend.azurewebsites.net/api/copilot/status

# Should return JSON with:
# "connected": true
# "connectionStatus": "disconnected" (until auth is configured)
```

---

## Why This Works

| What | V6 (Broken) | V7 (Fixed) |
|-----|-----------|----------|
| `.deployment` file | ✗ Present (runs broken script) | ✓ **Removed** |
| File locations | ✗ `backend/package.json` | ✓ `package.json` at root |
| `web.config` | ✗ `backend/web.config` | ✓ `web.config` at root |
| `.node-version` | ✗ Nested | ✓ At root level |
| Local test run | ✗ Not tested | ✓ **App starts successfully** |
| Dependencies | ✓ 101 packages | ✓ 101 packages verified |

---

## If It Fails

**Error: "Couldn't detect a version for platform 'nodejs'"**
- ✓ Fixed in V7 (removed .deployment file)
- If you still see this, the old V6 zip may be cached
- Delete old zip: `rm -f muse-backend-deploy-v6.zip`

**Error: "Cannot GET /"**
- This is normal! App requires authentication setup
- Check `/api/copilot/status` instead

**Error: web.config issues**
- ✓ Fixed in V7 (web.config now at root)

---

## Full Documentation

See: `docs/V7-DEPLOYMENT-FINAL-VERIFIED.md` for complete details, testing results, and troubleshooting.

---

**Status: ✅ READY TO DEPLOY**

The package has been:
- ✓ Extracted and verified
- ✓ All dependencies confirmed (101 packages)
- ✓ TypeScript compilation verified
- ✓ Application startup tested
- ✓ Committed to GitHub

**Upload and deploy v7 now.**
