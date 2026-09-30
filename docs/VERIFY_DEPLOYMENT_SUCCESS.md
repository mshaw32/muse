# How to Verify Deployment Success

**Purpose:** Confirm the deployment actually worked  
**Time:** 5 minutes after deployment completes  
**Difficulty:** Easy (just copy-paste commands)

---

## The 4 Verification Tests

### Test 1: Azure Portal Status (Visual Check)

**Location:** Azure Portal → App Service → muse-backend → Overview

**Look for:**

1. **Green "Running" Indicator**
   ```
   Status: Running (should be GREEN circle)
   ```
   If RED or STOPPED → Deployment failed

2. **URL shown**
   ```
   https://muse-backend.azurewebsites.net
   ```
   Copy this URL (you'll need it)

3. **Deployment status**
   - Scroll down to "Deployments" section
   - Latest deployment should show: ✓ Succeeded
   - Time should be recent (within last 5 minutes)

**If any of these are wrong:**
- See "Troubleshooting" section below
- The deployment failed or app crashed

---

### Test 2: API Health Check (Functional Test)

**Purpose:** Verify the app is actually running and responding

**Run this command:**

```bash
curl https://muse-backend.azurewebsites.net/api/copilot/health
```

**Expected Response:**
```json
{"status": "healthy", "timestamp": "2026-09-30T18:00:00Z"}
```

**What this means:**
- ✅ App received your request
- ✅ App processed the request
- ✅ App returned JSON response
- ✅ Everything is working

**If you get errors:**

```
# Error: Connection refused
curl: (7) Failed to connect

→ App not running. Go to Portal, restart it.
```

```
# Error: 404 Not Found
<html><body>404 - File or directory not found.</body></html>

→ Wrong URL or route not found. Check URL in Portal.
```

```
# Error: 503 Service Unavailable
<html><body>503 - Service Unavailable</body></html>

→ App crashed. Check logs in Portal.
```

---

### Test 3: Application Logs Check

**Purpose:** Verify app started without errors

**Location:** Azure Portal → App Service → muse-backend → Log stream

**What you should see:**

```
2026-09-30T18:00:00.000Z  INFO  Starting application...
2026-09-30T18:00:01.000Z  INFO  Loading configuration
2026-09-30T18:00:02.000Z  INFO  Server listening on port 8080
2026-09-30T18:00:03.000Z  INFO  Ready to receive requests
```

**What you should NOT see:**

```
ERROR   - anything red
FATAL   - anything critical
Cannot find module  
Cannot find tsconfig
Couldn't detect version
Build failed
```

**If you see errors:**
- Note the error message
- Check "Troubleshooting" section below
- Report the error

---

### Test 4: Deployment Build Log Check

**Purpose:** Verify the build phase actually completed

**Location:** Azure Portal → App Service → muse-backend → Deployment Center → Deployment logs

**What to look for:**

**Upload Phase:**
```
18:00:32 INFO Zip file received (31 KB)
18:00:33 INFO Extracting...
18:00:35 INFO Files extracted successfully
```

**Build Phase (This is the critical part):**
```
18:00:36 INFO Detected Node.js version: 22.0.0  ← MUST see this
18:00:37 INFO Running: npm install
18:00:45 INFO npm install succeeded
18:00:46 INFO Running: npm run build
18:00:47 INFO tsc -p tsconfig.json
18:00:55 INFO Build succeeded
18:00:56 INFO Generated 23 .js files
```

**Deploy Phase:**
```
18:00:57 INFO Starting application
18:00:58 INFO Server started
18:00:59 INFO Ready for traffic
```

**If you see:**
```
ERROR: Couldn't detect a version for the platform 'nodejs'
```
→ v3 zip not uploaded (you uploaded old one)
→ Upload muse-backend-deploy-v3.zip again

```
ERROR: Cannot find tsconfig.json
```
→ Wrong zip uploaded
→ Use muse-backend-deploy-v3.zip

```
ERROR: Build failed
```
→ See full error message
→ Report it

---

## Summary Checklist

**After deployment, all of these should be TRUE:**

- [ ] Azure Portal shows Status: "Running" (green)
- [ ] Azure Portal shows deployment time within last 5 minutes
- [ ] Latest deployment shows: ✓ Succeeded
- [ ] curl command returns JSON response (not error)
- [ ] Log stream shows "Server started" or "Ready"
- [ ] No ERROR or FATAL messages in logs
- [ ] Build log shows "Detected Node.js version: 22.0.0"
- [ ] Build log shows "npm run build" succeeded
- [ ] Build log shows files compiled

**If ALL of these are checked:** ✅ **DEPLOYMENT SUCCESSFUL**

**If ANY of these are not checked:** ❌ **DEPLOYMENT FAILED** → See troubleshooting

---

## Troubleshooting Guide

### Symptom: Status shows "Stopped" (Red)

**Cause:** App crashed or wasn't started

**Fix:**
1. Azure Portal → App Service → muse-backend
2. Top toolbar: Click "Start" button
3. Wait 30 seconds
4. Refresh page
5. Status should turn Green

**If still red:**
- Check logs for errors (Log stream section)
- Report error message

---

### Symptom: curl returns 404 Not Found

**Cause:** Wrong URL or route doesn't exist

**Fix:**
1. Go to Azure Portal → App Service → muse-backend → Overview
2. Copy the exact URL shown under "Default domain"
3. Try curl again with exact URL:
   ```bash
   curl https://[EXACT-URL-FROM-PORTAL]/api/copilot/health
   ```

**If still 404:**
- The route might not exist
- Report issue

---

### Symptom: curl times out / Connection refused

**Cause:** Network issue or app not running

**Fix:**
1. Wait 2 minutes (app might still starting)
2. Try curl again
3. If still fails, check Azure Portal status
4. If status is "Stopped", start it

**If keeps failing:**
- Network/firewall issue
- Check Zscaler/VPN settings

---

### Symptom: Build log shows "Couldn't detect version for nodejs"

**Cause:** Old zip file uploaded (without .node-version)

**Fix:**
1. Delete current deployment (Portal → Deployment Center → "New deployment")
2. Upload muse-backend-deploy-v3.zip (NOT v2 or v1)
3. Wait for build to complete
4. Check logs show "Detected Node.js version: 22.0.0"

---

### Symptom: Build log shows "Cannot find module"

**Cause:** Wrong zip structure

**Fix:**
1. Download: muse-backend-deploy-v3.zip (the LATEST one)
2. Do NOT use muse-backend-deploy.zip or muse-backend-deploy-v2.zip
3. Delete current deployment
4. Upload v3 again

---

### Symptom: Multiple deployment attempts, keeps failing

**Cause:** Uploading wrong or old zip file repeatedly

**Fix:**
1. **DELETE old zip files from your repo:**
   ```bash
   cd ~/muse
   ls -la muse-backend*.zip
   # You should see:
   # - muse-backend-deploy-v3.zip (KEEP THIS - upload this one)
   # - muse-backend-deploy-v2.zip (DELETE)
   # - muse-backend-deploy.zip (DELETE)
   ```

2. **Only upload:** `muse-backend-deploy-v3.zip`

3. **Verify file before uploading:**
   ```bash
   unzip -l muse-backend-deploy-v3.zip | grep "\.node-version"
   # Should show: backend/.node-version
   ```

---

## Quick Reference Card

```
DEPLOYMENT URL:
https://muse-backend.azurewebsites.net

TEST ENDPOINT:
curl https://muse-backend.azurewebsites.net/api/copilot/health

EXPECTED RESPONSE:
{"status": "healthy", "timestamp": "..."}

FILE TO UPLOAD:
muse-backend-deploy-v3.zip

VERIFICATION TIME:
5 minutes after deployment completes

SUCCESS INDICATOR:
Status: Running (green) + curl returns JSON + logs show "Server started"
```

---

## After Verification: Next Steps

**If deployment is successful:**

1. **Connect to Copilot Studio:**
   ```
   Go to: Copilot Studio → Your Agent
   Settings → API → Add Connection
   URL: https://muse-backend.azurewebsites.net
   ```

2. **Test integration:**
   ```
   Ask your Muse agent a question
   Should send to Azure backend
   Backend should respond
   ```

3. **Monitor in production:**
   ```
   Check logs regularly
   Monitor performance
   Watch for errors
   ```

---

**Status:** Ready to verify  
**Next Action:** Deploy muse-backend-deploy-v3.zip, then follow tests above
