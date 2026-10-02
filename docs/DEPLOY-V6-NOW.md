# Deploy v6 with Real Azure AD Authentication

**Status:** ✅ v6 Ready for Deployment  
**What's New:** Real Azure AD authentication (replaces mock)  
**Time to Deploy:** 10-15 minutes  

---

## Quick Summary

The v5 backend was returning 401 because the auth was a **mock implementation**. v6 now has **real Azure AD authentication** using your app registration credentials.

### What Changed
```
v5: CopilotStudioAuth.getStatus() → always returns { authenticated: false }
v6: CopilotStudioAuth.getStatus() → returns real status from Azure AD token
```

---

## Deploy v6 - Two Options

### Option 1: Azure Portal (Recommended - No Zscaler Issues)

1. Go to: https://portal.azure.com
2. Search: `muse-backend` (App Service)
3. Left sidebar → **Deployment center**
4. **Upload** tab → **Choose file**
5. Select: `muse-backend-deploy-v6.zip`
6. Click **Upload**
7. Wait for "Deployment successful" message (usually 2-3 minutes)
8. Green checkmark appears

### Option 2: Azure CLI (If Zscaler Allows)

```bash
az webapp deployment source config-zip \
  --resource-group rg-mbgsol-muse-dev \
  --name muse-backend \
  --src muse-backend-deploy-v6.zip
```

---

## After Deployment - 4 Steps

### Step 1: Verify Credentials Are Set (2 min)

```bash
# Check if credentials are in App Service
az webapp config appsettings list \
  --resource-group rg-mbgsol-muse-dev \
  --name muse-backend | grep COPILOT
```

**Should output:**
```
COPILOT_STUDIO_CLIENT_ID = "your-id"
COPILOT_STUDIO_CLIENT_SECRET = "your-secret"
COPILOT_STUDIO_TENANT_ID = "de08c407-19b9-427d-9fe8-edf254300ca7"
```

**If NOT set, run this NOW:**

```bash
az webapp config appsettings set \
  --resource-group rg-mbgsol-muse-dev \
  --name muse-backend \
  --settings \
    COPILOT_STUDIO_CLIENT_ID="<YOUR_CLIENT_ID>" \
    COPILOT_STUDIO_CLIENT_SECRET="<YOUR_CLIENT_SECRET>" \
    COPILOT_STUDIO_TENANT_ID="de08c407-19b9-427d-9fe8-edf254300ca7"
```

Replace `<YOUR_CLIENT_ID>` and `<YOUR_CLIENT_SECRET>` with your actual values from Azure Portal.

### Step 2: Restart App Service (1 min)

```bash
az webapp restart \
  --resource-group rg-mbgsol-muse-dev \
  --name muse-backend
```

Wait 30 seconds for app to start.

### Step 3: Test Authentication (1 min)

```bash
# Should now return real authentication status
curl https://muse-backend.azurewebsites.net/api/copilot/status
```

**Success Response:**
```json
{
  "connected": true,
  "state": "authenticated",
  "connectionStatus": "connected",
  "hasToken": true,
  "tokenExpiresAt": "2026-10-02T16:52:32.858Z",
  "lastError": null,
  "user": {
    "authenticated": true
  }
}
```

**Failure Response (if credentials are wrong):**
```json
{
  "connected": false,
  "state": "unauthenticated",
  "connectionStatus": "disconnected",
  "hasToken": false,
  "lastError": "Invalid client credentials",
  "user": null
}
```

### Step 4: Proceed to Copilot Studio Setup (5 min)

If Step 3 returned `connected: true`, you're ready for Copilot Studio!

Follow: `COPILOT_STUDIO_QUICK_START.md`

---

## Troubleshooting v6

### Still Getting 401?

1. **Deployment might still be running**
   - Wait 2-3 more minutes
   - Refresh the Azure Portal

2. **Credentials not set**
   - Run Step 1 above to set them
   - Then run Step 2 to restart app

3. **Credentials are wrong**
   - Go to Azure Portal → App registrations → your app
   - Copy Client ID again (exact match!)
   - Create new Client Secret (old one might be expired)
   - Run Step 1 above with correct values

4. **Tenant ID is wrong**
   - Should be: `de08c407-19b9-427d-9fe8-edf254300ca7`
   - Check Azure Portal to confirm

5. **App registration is disabled**
   - Go to Azure Portal → App registrations → your app
   - Check if it's enabled (green checkmark)

### App Won't Start?

1. **Check deployment logs:**
   ```bash
   az webapp log tail --resource-group rg-mbgsol-muse-dev --name muse-backend
   ```

2. **Common issues:**
   - Missing @azure/identity package (included in v6 - should work)
   - Node version mismatch (v6 uses Node 22)
   - Corrupted ZIP file (try uploading again)

3. **If still stuck:**
   - Check if v6 ZIP is valid: `unzip -t muse-backend-deploy-v6.zip`
   - Verify .deployment file exists at root of ZIP
   - Try deploying again

---

## What v6 Does Automatically

On startup, v6 will:

1. ✅ Check if COPILOT_STUDIO_CLIENT_ID env var is set
2. ✅ If set, read CLIENT_ID, SECRET, and TENANT_ID from env vars
3. ✅ Create Azure AD credential object with those values
4. ✅ Attempt to authenticate with Azure AD
5. ✅ Print result to logs:
   - Success: `✅ Successfully authenticated with Azure AD on startup`
   - Failure: `⚠️ Failed to authenticate on startup: [error details]`

If any of these fail, the app still runs but `/api/copilot/status` returns `connected: false`.

---

## Next: Copilot Studio Integration

Once Step 3 shows `connected: true`, you're ready to wire Copilot Studio!

Follow this guide: `COPILOT_STUDIO_QUICK_START.md`

The key difference from before:
- Power Automate flow will now successfully authenticate with your backend
- No more 401 errors
- Chat messages will flow through your real backend

---

## Files

- **muse-backend-deploy-v6.zip** - Deployment package (ready to upload)
- **docs/AUTH-DEBUG-AND-FIX.md** - Detailed technical explanation
- **docs/COPILOT_STUDIO_QUICK_START.md** - Next steps after v6 is deployed

---

**Ready? Upload v6.zip to Azure Portal now!** 🚀

