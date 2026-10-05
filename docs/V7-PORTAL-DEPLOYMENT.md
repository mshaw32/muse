# V7 Deployment via Azure Portal

Because of SSL certificate verification issues with the local Azure CLI (corporate proxy), the deployment must be done through Azure Portal instead. This guide provides step-by-step instructions.

## Prerequisites

✓ File ready: `muse-backend-deploy-v7.zip` (15 MB)  
✓ Package tested and verified locally  
✓ Azure subscription access  
✓ Azure Portal browser access  

---

## Step-by-Step Portal Deployment

### Step 1: Open Azure Portal

1. Go to: https://portal.azure.com
2. Sign in with your Azure account
3. Select your subscription (if prompted)

### Step 2: Navigate to App Service

1. Search for: "muse-backend"
2. Click on the **muse-backend** App Service resource
3. You should see the App Service overview page

### Step 3: Access Deployment Center

1. In the left sidebar, scroll down to **Deployment**
2. Click on **Deployment Center**
3. You'll see the deployment history

### Step 4: Upload Zip File

**Option A: Via Upload (Recommended)**

1. Look for **Manual Deployment** or **Upload** section
2. Click the upload area or "Browse" button
3. Select: `muse-backend-deploy-v7.zip` from your computer
4. Click **Upload** or **Deploy**
5. Wait for the deployment to complete (2-3 minutes)

**Option B: Via Deployment Center Upload**

1. In Deployment Center, look for **Deploy via zip**
2. Click the upload button
3. Select: `muse-backend-deploy-v7.zip`
4. Click **Deploy**
5. Monitor the deployment progress in the logs

### Step 5: Monitor Deployment Progress

1. Stay on **Deployment Center** page
2. Refresh to see latest status
3. Look for logs showing:
   ```
   Deployment initiated
   Platform detected: Node.js
   Installing dependencies...
   Build completed
   Deployment successful
   ```

**Expected time:** 2-3 minutes

### Step 6: Set Environment Variables

**IMPORTANT:** These must be set BEFORE the app starts properly

1. In left sidebar, scroll to **Settings**
2. Click **Configuration**
3. Click **Application settings** tab
4. Click **+ New application setting** and add these 4:

```
Name                           Value
────────────────────────────────────────────────────────────────
NODE_ENV                       production
COPILOT_STUDIO_CLIENT_ID       [your-client-id-from-app-registration]
COPILOT_STUDIO_CLIENT_SECRET   [your-client-secret]
COPILOT_STUDIO_TENANT_ID       de08c407-19b9-427d-9fe8-edf254300ca7
```

5. Click **Save** at the top
6. Click **Continue** when prompted
7. Wait for the app to restart (1-2 minutes)

### Step 7: Verify Deployment

Open a terminal and run:

```bash
curl https://muse-backend.azurewebsites.net/api/copilot/status
```

**Expected response:**
```json
{
  "connected": true,
  "state": "unauthenticated",
  "connectionStatus": "disconnected",
  "account": null,
  "lastError": null,
  "token": {
    "hasToken": false,
    "tokenPreview": null,
    "issuedAt": null,
    "expiresAt": null,
    "scopes": ["Copilot.Chat", "Copilot.Retrieval"]
  }
}
```

**Status meanings:**
- `connected: true` → App is running ✓
- `connectionStatus: "disconnected"` → Expected (not authenticated yet)
- HTTP 200 → App responding to requests ✓

---

## Troubleshooting

### Error: "Cannot GET /"

**Cause:** App is running but root endpoint not configured  
**Solution:** This is expected behavior. Use `/api/copilot/status` instead

### Error: 404 on /api/copilot/status

**Cause:** App not running or deployment failed  
**Action:** 
1. Check Deployment Center logs for errors
2. Go to **Log Stream** to see real-time output
3. Look for errors like "Couldn't detect platform 'nodejs'"

### Error: 503 Service Unavailable

**Cause:** App still starting or restarting  
**Action:** 
1. Wait 1-2 minutes
2. Try curl again
3. Check if environment variables were set (they trigger a restart)

### Deployment stuck or slow

**Cause:** Normal - Kudu is building  
**Action:**
1. Check **Deployment Center** logs
2. Expected time: 2-3 minutes
3. Do NOT cancel or retry while running

---

## After Successful Deployment

1. ✅ Verify endpoint responds: `/api/copilot/status` returns JSON
2. ✅ Document the URL: `https://muse-backend.azurewebsites.net`
3. ✅ This URL will be used in Copilot Studio configuration
4. ✅ Next: Proceed to Phase 2 (streaming responses)

---

## File Reference

**Deployment file location:** `muse-backend-deploy-v7.zip` (15 MB)

This file contains:
- .node-version (Node.js 22.0.0)
- package.json (dependencies)
- web.config (IIS configuration)
- dist/ (compiled app, 23 files)
- node_modules/ (101 packages)

**No .deployment file** - Azure uses built-in Node.js detection

---

## Next Steps (After Verification)

1. ✅ Deployment successful and `/api/copilot/status` responds
2. Configure Copilot Studio to point to this backend URL
3. Begin Phase 2: Streaming responses and augmented chat
4. Begin Phase 3: Audio I/O pipeline
5. Begin Phase 4: M365 integration

---

## Support

If deployment fails:
1. Share the error message from Deployment Center logs
2. Run: `az webapp log tail -n 100` to see detailed logs
3. Check that environment variables were set correctly
4. Verify file `/api/copilot/status` is working

The package has been fully tested locally and is verified to work. Any issues during deployment are typically environment-related (SSL, network, proxy) rather than code issues.
