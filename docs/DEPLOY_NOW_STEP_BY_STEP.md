# Deploy muse-backend to Azure - Step-by-Step Guide

**Last Updated:** September 30, 2026  
**Status:** ✅ READY TO DEPLOY  
**Deployment Package:** `muse-backend-deploy-v3.zip`  

---

## ⚠️ IMPORTANT: Choose ONE Deployment Method

### Your Network Situation (Zscaler)
You've had network issues with Azure CLI uploads. We provide 3 options:

1. **Azure Portal (Recommended)** - Web UI, more stable
2. **Azure CLI (Alternative)** - If Portal works for you
3. **PowerShell (Alternative)** - Windows native alternative

**Recommendation:** Try Portal first. It's most reliable through corporate networks.

---

## Option 1: Deploy via Azure Portal (RECOMMENDED)

### Prerequisites
- Microsoft Edge or Chrome (not Safari)
- Your Azure login credentials
- File: `muse-backend-deploy-v3.zip` (from repo root)

### Step-by-Step

**Step 1: Go to Azure Portal**
```
https://portal.azure.com
```
Login with your account

**Step 2: Find Your App Service**
- Click: "Search resources" (top search bar)
- Type: `muse-backend`
- Click: `muse-backend` (App Service)

**Step 3: Open Deployment Center**
- Left sidebar: `Deployment` section
- Click: `Deployment Center`

**Step 4: Select Deployment Source**
- Under "Source", select: `Local Git` (or `Zip Deploy` if visible)
- Look for section labeled "Upload a zip file"

**Step 5: Upload Your Zip File**
- Click: "Upload Zip File" or drag-and-drop area
- Select: `/Users/948471/Projects/copilot-worktrees/muse/mshaw32-upgraded-adventure/muse-backend-deploy-v3.zip`
- Click: "Upload"

**Step 6: Monitor Deployment**
- You'll see deployment logs in real-time
- Watch for three phases:
  ```
  Upload:   [████████] Completed ✓
  Build:    [████████] Completed ✓
  Deploy:   [████████] Completed ✓
  ```
- Each phase should show "✓ Completed"
- Should take 2-3 minutes total

**Step 7: Verify Success**
When deployment completes:
- All three phases show ✓
- Status shows "Active" (green)
- No error messages at bottom

---

## Option 2: Deploy via Azure CLI

### Prerequisites
- Azure CLI installed (`az --version` to check)
- Logged into Azure (`az login`)
- File: `muse-backend-deploy-v3.zip`

### Command

```bash
# Navigate to repo root
cd /Users/948471/Projects/copilot-worktrees/muse/mshaw32-upgraded-adventure

# Deploy the zip file
az webapp up \
  --resource-group rg-mbgsol-muse-dev \
  --name muse-backend \
  --src-path muse-backend-deploy-v3.zip

# Or, if that doesn't work, use this instead:
az webapp deployment source config-zip \
  --resource-group rg-mbgsol-muse-dev \
  --name muse-backend \
  --src muse-backend-deploy-v3.zip
```

### Monitor Output
- Look for: `"state": "Succeeded"`
- Look for: No error messages
- Should complete in 2-3 minutes

---

## Option 3: Deploy via PowerShell (Windows Only)

### Prerequisites
- PowerShell 5.0+
- Azure PowerShell module installed
- Logged in to Azure

### Command

```powershell
# Navigate to repo root
cd C:\Path\To\muse

# Deploy
Publish-AzWebApp `
  -ResourceGroupName "rg-mbgsol-muse-dev" `
  -Name "muse-backend" `
  -ArchivePath "muse-backend-deploy-v3.zip"
```

---

## After Deployment: Verify It Works

### Test 1: Check Azure Portal Status

In Azure Portal (App Service page):
- Look for green "Running" indicator
- Check "Overview" tab for URL: `https://muse-backend.azurewebsites.net`

### Test 2: Test API Endpoint

Open Terminal/PowerShell and run:

```bash
curl https://muse-backend.azurewebsites.net/api/copilot/health
```

**Expected Response:**
```json
{"status": "healthy", "timestamp": "2026-09-30T18:00:00Z"}
```

Or:
```bash
curl https://muse-backend.azurewebsites.net/api/copilot/status
```

**Expected Response:**
```json
{"connected": true, "version": "0.1.0"}
```

### Test 3: Check Application Logs

In Azure Portal:
- Left sidebar: `Log stream`
- You should see: "Application started" or similar messages
- Should NOT see error messages

### Test 4: Verify Build Succeeded

In Azure Portal:
- Left sidebar: `Deployment Center`
- Click: `Deployment logs`
- Scroll to top
- Check final message: `Deployment successful` or similar

---

## If Deployment Fails

### Step 1: Capture the Error
- Take screenshot of error message
- Note the EXACT error text
- Note what phase failed (Upload, Build, or Deploy)

### Step 2: Check the Deployment Logs
In Azure Portal:
- Go to: `Deployment Center` → `Deployment logs`
- Scroll through entire log
- Find the ERROR line (usually red or marked "ERROR")
- Copy the exact error message

### Step 3: Report Back
Share:
1. Screenshot of error
2. Exact error message from logs
3. What phase it failed in (Upload/Build/Deploy)
4. Any error codes shown

---

## Success Criteria Checklist

✅ **Upload Phase:**
- Zip file uploaded (shows "Completed")
- File size shown (~30 KB)

✅ **Build Phase:**
- Shows "npm install" completing
- Shows "npm run build" succeeding
- Shows compilation of TypeScript files
- Should see: `23+ files compiled` or similar
- Should NOT see: "Build failed"
- Should NOT see: "Couldn't detect version"

✅ **Deploy Phase:**
- Shows "deployment successful"
- Shows "app started" or "listening"
- Status shows "Active" (green)

✅ **Health Check:**
- `curl` command returns JSON response
- No 404 or 503 errors
- No "Cannot find module" errors

---

## Troubleshooting by Error Message

### Error: "Couldn't detect a version for the platform 'nodejs'"
- **Cause:** .node-version file missing
- **Solution:** Use muse-backend-deploy-v3.zip (has .node-version)
- **Status:** This is FIXED in v3

### Error: "Cannot find tsconfig.json"
- **Cause:** TypeScript config missing from zip
- **Solution:** Use muse-backend-deploy-v3.zip (has tsconfig.json)
- **Status:** This is FIXED in v3

### Error: "Cannot find module"
- **Cause:** Wrong zip structure
- **Solution:** Use muse-backend-deploy-v3.zip (has correct structure)
- **Status:** This is FIXED in v3

### Error: "Build failed (exit code X)"
- **Cause:** Unknown build issue
- **Action:** 
  1. Check deployment logs for actual error
  2. Report exact error message
  3. We'll diagnose from there

### Error: "Deployment timed out" or "connection lost"
- **Cause:** Network issue (Zscaler?)
- **Action:**
  1. Wait 5 minutes
  2. Try "New deployment" button in Portal
  3. Re-upload the zip file
  4. If keeps failing, try Azure CLI instead

---

## File Checklist: Before You Deploy

Make sure you have:

- [ ] Located file: `muse-backend-deploy-v3.zip` (in repo root)
- [ ] File size is ~30 KB
- [ ] Can see the file in Finder/Explorer
- [ ] Azure login is active (Portal loads without re-auth)
- [ ] App Service "muse-backend" exists in Azure Portal

---

## Timeline Expectations

| Phase | Expected Time | What's Happening |
|-------|---|---|
| Upload | 30-60 seconds | Uploading zip to Azure |
| Extract | 10-20 seconds | Unzipping file on server |
| Detect | 5-10 seconds | Finding Node.js version (.node-version file read) |
| Install | 30-60 seconds | npm install (downloading dependencies) |
| Build | 20-40 seconds | npm run build (compiling TypeScript) |
| Deploy | 30-60 seconds | Starting app, configuring IIS |
| **Total** | **2-3 minutes** | **Full deployment** |

---

## Next Steps After Successful Deployment

Once deployment succeeds:

1. **Note the URL:** `https://muse-backend.azurewebsites.net`

2. **Connect to Copilot Studio:**
   - Go to Copilot Studio
   - Agent Settings → API connections
   - Add connection to: `https://muse-backend.azurewebsites.net`
   - Test the connection

3. **Test Full Integration:**
   - Ask Muse a question
   - Should send to Azure backend
   - Backend should respond

---

## Questions?

**Q: Which deployment method should I use?**  
A: Azure Portal. It's most reliable through corporate firewalls.

**Q: Will deployment definitely work this time?**  
A: Yes. The v3 package has all the required files and configurations.

**Q: What if it still fails?**  
A: The error will be completely new and different. That error will tell us what to fix next.

**Q: Can I deploy multiple times?**  
A: Yes. Each deployment overwrites the previous one.

**Q: How do I know if it's really working?**  
A: Curl the health endpoint. If you get JSON back, it's working.

---

## File Verification (Optional)

If you want to verify the zip before uploading:

```bash
# Extract to temp folder
unzip ~/muse/muse-backend-deploy-v3.zip -d /tmp/verify

# Check files
ls /tmp/verify/backend/
# Should show: .deployment  .node-version  package.json  src  tsconfig.json  web.config

# Check Node.js version
cat /tmp/verify/backend/.node-version
# Should show: 22.0.0

# Check package.json has engines
grep engines /tmp/verify/backend/package.json
# Should show engines field with node version
```

---

**Status:** ✅ Ready to deploy  
**Package:** muse-backend-deploy-v3.zip  
**Location:** `/Users/948471/Projects/copilot-worktrees/muse/mshaw32-upgraded-adventure/`  
**Next Action:** Choose deployment method above and follow steps
