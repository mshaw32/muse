# Deploy v5 Step-by-Step Guide

**Status:** ✅ Package verified and ready  
**Issue:** Azure CLI blocked by Zscaler proxy  
**Solution:** Use Azure Portal upload  

---

## What v5 Fixes

- ✅ Adds root GET endpoint (returns service info)
- ✅ Fixes "Cannot GET /" error
- ✅ Includes all TypeScript source files for build
- ✅ All routes compile correctly
- ✅ Ready for Copilot Studio integration

---

## Deployment via Azure Portal

### Step 1: Open Azure Portal
```
URL: https://portal.azure.com
```
- Use your Microsoft 365 account
- Should already be logged in

### Step 2: Navigate to muse-backend App Service
```
Search box (top): "muse-backend"
Click: muse-backend App Service
```

**Expected screen:** App Service overview with green "Running" status

### Step 3: Open Deployment Center
```
Left sidebar → Deployment Center
```

**Expected screen:** Shows "Recent Deployments" and Upload option

### Step 4: Upload v5 Package

**Option A: Click Upload Button**
1. Click: **Upload** button
2. Select file: `muse-backend-deploy-v5.zip`
   - Location: `~/muse/` directory (repo root)
   - File size: ~29 KB
3. Click: **Upload**

**Option B: Drag and Drop**
1. Drag file from Finder
2. Drop into Portal upload area

### Step 5: Monitor Deployment
```
Status progression:
Uploading → Building → Running
```

**Each stage:**
- **Uploading:** 10-30 seconds
- **Building:** 1-2 minutes (npm install + TypeScript compile)
- **Running:** Should go green automatically

**Watch the log:**
- Top of page shows build progress
- You'll see: "npm install", "npm run build", "Starting app"

### Step 6: Wait for Completion
- Green checkmark appears when done
- Page will show: "✓ Succeeded"
- Takes 2-3 minutes total

---

## After Deployment - Verify It Works

### Test Root Endpoint
```bash
curl https://muse-backend.azurewebsites.net/
```

**Expected response:**
```json
{
  "name": "MUSE Backend",
  "version": "1.0.0",
  "status": "running",
  "endpoints": {
    "health": "/health",
    "copilot": "/api/copilot",
    "voice": "/api/voice",
    "vault": "/api/vault-search",
    "memory": "/api/memory",
    "actions": "/api/actions",
    "session": "/api/session"
  }
}
```

### Test Health Endpoint
```bash
curl https://muse-backend.azurewebsites.net/health
```

**Expected response:** JSON with health status

### Test Copilot Status
```bash
curl https://muse-backend.azurewebsites.net/api/copilot/status
```

**Expected response:** Authentication state (may be unauthenticated, that's fine)

### Check Logs (Optional)
1. Portal → **Log stream**
2. Should show:
   ```
   MUSE backend listening on http://localhost:8080
   ```

---

## Troubleshooting

### If Upload Fails

**Error: "Upload failed"**
- Refresh page and try again
- Try Option B (drag and drop)
- Wait 30 seconds between attempts

**Error: "Build failed"**
- Check build logs in Portal
- Most likely issue: missing files in zip
- If this happens, contact me with the error

### If Deployment Shows "Running" but Curl Fails

**Error: "Cannot GET /"**
- Old version still running from v4
- Refresh browser: Ctrl+Shift+R (or Cmd+Shift+R on Mac)
- Wait 30 seconds, try again
- If still fails: Stop app → Start app in Portal

**Error: Connection refused**
- App may still be starting
- Wait 2 minutes and try again
- Check Portal status (should be green)

---

## File Information

**File:** `muse-backend-deploy-v5.zip`  
**Location:** `/Users/948471/Projects/copilot-worktrees/muse/` (repo root)  
**Size:** 29 KB  

**Contents:**
- `.deployment` - Azure build config
- `.node-version` - Node.js 22.0.0
- `web.config` - IIS routing
- `tsconfig.json` - TypeScript config
- `package.json` - Dependencies
- `src/` - TypeScript source (all files)
  - `index.ts` - Express app with root endpoint
  - `routes/` - 7 route files
  - `services/` - Copilot and voice services
- `dist/` - Pre-compiled JavaScript (23 files)

---

## What's Different in v5 vs v4

| Item | v4 | v5 |
|------|----|----|
| Root endpoint | ❌ Missing | ✅ Added |
| GET / response | Error 404 | JSON service info |
| TypeScript files | ✅ Included | ✅ Included |
| Routes | ✅ Compiled | ✅ Compiled |
| Ready to test | ❌ No | ✅ Yes |

---

## Expected Build Output

When Azure builds v5, you'll see in logs:
```
npm start
Found tar.zst based node_modules.
Extracting modules...
npm info using npm@10.9.2
npm info using node@22.23.1
> muse-backend@1.0 start
> node dist/index.js
MUSE backend listening on http://localhost:8080
```

All green. No errors. App running.

---

## Success Checklist

After deployment completes:
- [ ] Portal shows Status: **Running** (green)
- [ ] Latest Deployment: **✓ Succeeded**
- [ ] `curl https://muse-backend.azurewebsites.net/` returns JSON
- [ ] JSON includes: name, version, status, endpoints
- [ ] No errors in Portal logs
- [ ] Ready for next step: Copilot Studio wiring

---

## Next Steps (After Verification)

Once v5 is deployed and verified:
1. Connect Copilot Studio to this backend URL
2. Configure authentication
3. Test end-to-end conversation
4. Proceed to Phase 2 (conversation context, memory)

---

## Questions?

**File not found in Portal?**
- Make sure you're selecting from: `/Users/948471/Projects/copilot-worktrees/muse/`
- File name: exactly `muse-backend-deploy-v5.zip`

**Build fails after upload?**
- Check Portal build logs for specific error
- Most common: missing dependencies (shouldn't happen with v5)
- Contact if error not clear

**App runs but curl fails?**
- Hard refresh browser
- Wait 30 seconds
- Try from different terminal
- Check logs for actual errors

---

**Status: READY FOR DEPLOYMENT** ✅

Package is verified. All files present. Build tested. 
Ready to upload to Azure Portal.

Go to https://portal.azure.com and follow steps above.

Estimated time: 5-10 minutes total
