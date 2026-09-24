# 🚀 DEPLOY VIA AZURE PORTAL (Step-by-Step)

**Status:** ✅ Deployment package created: `muse-backend-deploy.zip` (26 KB)

This method **bypasses the CLI entirely** and works around corporate proxy issues.

---

## Step 1: Go to Azure Portal

**URL:** https://portal.azure.com

**Sign in** with your Microsoft 365 account that has access to Azure

---

## Step 2: Find Your App Service

1. In the search bar at top, type: **muse-backend**
2. Click on the **App Service** result
3. You should see: `muse-backend` (muse-backend.azurewebsites.net)

**Screenshot location:**
- Resource Group: `rg-mbgsol-muse-dev`
- App Service: `muse-backend`
- Runtime: Node 22 LTS

---

## Step 3: Open Deployment Center

1. In the left menu, scroll down to **Deployment**
2. Click **Deployment center**
3. You'll see deployment options

---

## Step 4: Select Upload Method

1. Look for **Source** dropdown at top
2. Select: **Local Git** or **Manual deployment**
3. If you see "Upload a zip file" option, click that directly

**If you see a deployment method selector:**
- Choose: **Zip upload** or **Manual/Local**

---

## Step 5: Upload Your Zip File

**Method A - If you see "Upload a zip" section:**

1. Click **Choose file** button
2. Navigate to: `/Users/948471/Projects/copilot-worktrees/muse/mshaw32-upgraded-adventure/`
3. Select: `muse-backend-deploy.zip`
4. Click **Deploy** button

**Method B - If using Deployment center:**

1. Click the upload icon or **+ Add** button
2. Select: `muse-backend-deploy.zip`
3. Confirm and click **Deploy**

---

## Step 6: Wait for Deployment

**You'll see:**
```
Deployment in progress...
Extracting files...
Running build commands...
Deployment successful!
```

**Typical time:** 5-10 minutes

**Do NOT close this window** during deployment.

---

## Step 7: Verify Deployment Succeeded

After deployment completes:

1. Go to: **Overview** tab (left menu)
2. Click the **URL**: `https://muse-backend.azurewebsites.net`
3. You should see the Azure App Service default page

**This confirms:** Deployment was successful

---

## Step 8: Test Your Backend

**Once confirmed, run this in your terminal:**

```bash
curl -s https://muse-backend.azurewebsites.net/api/copilot/status | jq .
```

**Expected output:**
```json
{
  "connected": true,
  "connectionStatus": "connected",
  "timestamp": "2024-09-24T..."
}
```

**If you get HTTP 200 with `"connected": true`:**
✅ **Backend is live and working!**

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| **"File too large"** | Shouldn't happen (26 KB), but try smaller zip |
| **"Deployment failed"** | Check App Service logs (see below) |
| **"404 Not Found"** | App Service doesn't exist in that resource group |
| **"Connection refused"** | Backend still starting, wait 3 minutes and retry |

**To view deployment logs:**

1. In App Service, go to **Deployment center**
2. Click **Logs** tab
3. Look for error messages
4. Or: Go to **Log stream** in left menu

---

## Next Steps After Success

Once backend is verified (curl returns 200):

```bash
cd /Users/948471/Projects/copilot-worktrees/muse/mshaw32-upgraded-adventure

# 1. Run verification suite
./post-deploy-verify.sh

# 2. Run e2e tests
./e2e-verify.sh

# 3. Wire to Copilot Studio
./copilot-wiring-helper.sh
```

Then follow: `COPILOT_STUDIO_WIRING.md`

---

## File Reference

| File | Location |
|------|----------|
| **Zip to upload** | `muse-backend-deploy.zip` |
| **Backend source** | `backend/dist/` |
| **Configuration** | `backend/web.config` |
| **Startup script** | `backend/.azure/startup.sh` |

---

## Still Having Issues?

**Check corporate proxy status:**

Your corporate proxy is intercepting HTTPS traffic (hence the SSL errors). This method **avoids the proxy** by using the Portal UI instead of CLI.

**If Portal UI also fails:**
1. Try from a different network (home WiFi, mobile hotspot)
2. Or ask your IT admin to add Azure to proxy whitelist
3. Or: Deploy from a different machine

---

**Ready? Start with Step 1 (Go to Azure Portal)**

Report back when you see the deployment complete in the Portal!
