# 📱 AZURE PORTAL - MANUAL DEPLOYMENT GUIDE

**Zscaler Workaround:** Use Browser UI instead of CLI  
**Deployment file ready:** `muse-backend-deploy.zip` (26 KB)

---

## Step 1: Open Azure Portal

**URL:** https://portal.azure.com

**Action:**
1. Click the link above
2. Sign in with your Microsoft 365 credentials
3. You should see the Azure Portal dashboard

---

## Step 2: Find Your App Service

**In the search bar at the top of Portal:**

1. Click the **search icon** (magnifying glass)
2. Type: `muse-backend`
3. You should see results

**Expected to see:**
```
App Services > muse-backend
  Resource Group: rg-mbgsol-muse-dev
  Status: Running
```

**Action:** Click on **muse-backend** to open it

---

## Step 3: Navigate to Deployment Center

**In the App Service page (muse-backend):**

**Left sidebar menu:**

1. Scroll down the left menu
2. Look for section: **Deployment**
3. Click: **Deployment center** (or **Deployment slots** then select deployment center)

**You should see:**
- Source dropdown (usually showing "External Git" or "Local Git")
- Deployment history
- Build logs

---

## Step 4: Find the Upload Option

**In Deployment Center page:**

**Look for one of these options:**

### Option A: Zip Upload Tab
- Click the **Zip upload** tab (if visible at top)
- Should show: "Upload a zip file"

### Option B: Manual Deployment
- If no Zip tab, look for **Manual deployment** or **Build settings**
- Find: "Upload or Deploy" section

### Option C: Create New Deployment
- Click **+ Sync**
- Or **+ Create a new deployment**
- Select: **Upload files**

---

## Step 5: Upload the Deployment Zip

**The upload area should show:**
- A **Choose File** or **Select File** button
- Or a **drag-and-drop** zone

**Action:**

1. Click **Choose File** button
2. Navigate to your home directory:
   ```
   /Users/948471/Projects/copilot-worktrees/muse/mshaw32-upgraded-adventure/
   ```
3. Select: `muse-backend-deploy.zip`
4. Click **Open** (or double-click the file)

**You should see:**
- File name appears in the upload field
- Shows file size: ~26 KB
- Shows: "Ready to deploy"

---

## Step 6: Deploy

**After file is selected:**

1. Look for **Deploy** button (usually blue, bottom right)
2. Click: **Deploy**

**You'll see messages:**
```
Deployment started...
Uploading file...
Extracting files...
Building...
Deployment in progress...
```

**Do NOT close this page.** Wait for completion.

---

## Step 7: Wait for Deployment to Complete

**Typical timeline:**

```
0-2 min:   "Uploading file"
2-5 min:   "Extracting"
5-10 min:  "Building" or "Deploying"
10-15 min: "Deployment completed successfully"
```

**You'll see a green checkmark:**
```
✅ Deployment successful
   Deployed on: 2024-09-24 16:45:00 UTC
```

---

## Step 8: Verify Deployment

**After you see "Deployment successful":**

1. Click **Overview** tab (left sidebar)
2. You should see:
   - Status: **Running**
   - URL: `muse-backend.azurewebsites.net`

3. Click the URL to test
4. You should see Azure App Service default page (or 404)

**This confirms:** Deployment was uploaded

---

## Step 9: Test Backend is Responding

**In your terminal, run:**

```bash
curl -s https://muse-backend.azurewebsites.net/api/copilot/status | jq .
```

**Expected output:**
```json
{
  "connected": true,
  "connectionStatus": "connected",
  "timestamp": "2024-09-24T16:45:00Z"
}
```

**If you get HTTP 200 + JSON response:**
✅ **Backend is live and working!**

**If connection refused or timeout:**
- Wait 2-3 more minutes (Azure startup)
- Retry the curl command

---

## Troubleshooting - If Upload Fails

### Error: "File is too large"
- Shouldn't happen (file is 26 KB)
- Try refreshing Portal and uploading again

### Error: "Upload interrupted"
- Zscaler blocking upload
- Try different approach: Use **Kudu Console** (see below)

### Error: "Deployment failed"
- Look at deployment logs
- Click **Logs** tab in Deployment center
- Check for error messages

### Upload button doesn't appear
- Try different browser (Chrome, Safari, Edge)
- Clear browser cache: Ctrl+Shift+Delete
- Try incognito/private window

---

## Alternative: Kudu Console Upload

If Portal upload doesn't work:

1. In App Service page, go to **Advanced Tools**
2. Click **Go** (opens Kudu Console)
3. Go to **Debug Console** → **PowerShell** or **Bash**
4. Navigate to: `D:\home\site\wwwroot\`
5. Upload zip file manually

**Alternative Kudu URL:**
```
https://muse-backend.scm.azurewebsites.net/
```

---

## Step 10: Run Verification

**Once backend is confirmed responding (Step 9 curl passed):**

```bash
cd /Users/948471/Projects/copilot-worktrees/muse/mshaw32-upgraded-adventure

# Quick health check
curl -s https://muse-backend.azurewebsites.net/api/copilot/status | jq .

# Comprehensive test
./e2e-verify.sh

# Interactive Copilot Studio wiring
./copilot-wiring-helper.sh
```

---

## Screenshots Reference

### What you're looking for in Portal:

**Deployment Center page:**
```
┌────────────────────────────────────────┐
│  Deployment center                     │
├────────────────────────────────────────┤
│  Source: [Dropdown]  Build: [Tab]     │
│  ┌────────────────────────────────────┐
│  │ ☑ Choose File Button               │
│  │ Or Drag-drop zone                  │
│  │                                    │
│  │ [ Upload / Deploy Button ]         │
│  └────────────────────────────────────┘
│                                        │
│  Recent deployments:                   │
│  ✅ muse-backend-deploy.zip (just now) │
└────────────────────────────────────────┘
```

**After deployment:**
```
┌────────────────────────────────────────┐
│  Deployment center                     │
├────────────────────────────────────────┤
│  ✅ Latest deployment successful       │
│                                        │
│  Deployment details:                   │
│  • Date: 2024-09-24 16:45 UTC         │
│  • Status: Active                     │
│  • Triggered by: Manual upload        │
└────────────────────────────────────────┘
```

---

## Complete Checklist

- [ ] Opened Azure Portal: https://portal.azure.com
- [ ] Searched and opened: muse-backend (App Service)
- [ ] Clicked: Deployment → Deployment center
- [ ] Found: Upload/Deploy section
- [ ] Selected file: muse-backend-deploy.zip
- [ ] Clicked: Deploy button
- [ ] Waited: Deployment completed (5-15 min)
- [ ] Saw: Green checkmark "Deployment successful"
- [ ] Ran curl test: Got HTTP 200
- [ ] Next: Run ./e2e-verify.sh

---

## Need Help During Portal Upload?

**Common issues:**

1. **Can't find Deployment Center**
   - In App Service, go to left menu
   - Look for "Deployment" section
   - Click "Deployment center"

2. **Upload button not visible**
   - Refresh the page (F5)
   - Try different browser tab
   - Clear cache and try again

3. **File upload hangs**
   - This is Zscaler blocking
   - Wait 30 seconds, then cancel
   - Try Kudu Console instead (see Alternative section)

4. **Can't see deployment status**
   - Click "Refresh" button
   - Check "Logs" tab for live output
   - Try "Overview" tab to see overall status

---

## Success Indicators

✅ **Portal shows:**
- Status: Running
- Latest deployment: Successful (green checkmark)

✅ **Terminal shows:**
```bash
$ curl -s https://muse-backend.azurewebsites.net/api/copilot/status | jq .
{
  "connected": true,
  "connectionStatus": "connected",
  "timestamp": "2024-09-24T16:45:00Z"
}
```

✅ **You see:**
- HTTP 200 response
- JSON output with "connected": true

---

## Next Steps After Success

Once deployment is verified (curl test passes):

```bash
# 1. Comprehensive verification
./e2e-verify.sh

# 2. Wire to Copilot Studio
./copilot-wiring-helper.sh

# 3. Test in web chat and Electron app
```

---

## File Location Reminder

If you need to re-upload the zip:
```
/Users/948471/Projects/copilot-worktrees/muse/mshaw32-upgraded-adventure/muse-backend-deploy.zip
```

To create a fresh zip (if needed):
```bash
cd /Users/948471/Projects/copilot-worktrees/muse/mshaw32-upgraded-adventure
./deploy-via-portal.sh
```

---

**Ready? Start here:** https://portal.azure.com

**Report back when you see "Deployment successful" in Portal!** ✅
