# Azure Portal Manual Deployment (No CLI Needed)

**Use this if CLI deployment fails due to SSL/proxy issues.**

---

## Step 1: Build Libraries (2 minutes)

```bash
cd /Users/948471/Projects/copilot-worktrees/muse/mshaw32-upgraded-adventure

npm run build:libs
```

Expected output:
```
@muse/shared build complete
@muse/services build complete
```

---

## Step 2: Build Backend Locally (1 minute)

```bash
cd backend
npm run build
```

Expected output:
```
[...]
✔ Compiled successfully
```

---

## Step 3: Create Deployment Package (1 minute)

From repo root:

```bash
cd backend
zip -r ../muse-backend-deploy.zip dist package.json
```

---

## Step 3: Create Deployment Package (1 minute)

From repo root:

```bash
cd backend
zip -r ../muse-backend-deploy.zip dist package.json
```

**File created:** `muse-backend-deploy.zip` (~2-3 MB)

---

## Step 4: Upload via Azure Portal (3 minutes)

### 4a. Go to App Service
1. Open [Azure Portal](https://portal.azure.com)
2. Search: "muse-backend"
3. Click the App Service resource

### 4b. Navigate to Deployment Center
1. Left sidebar → **Deployment Center**
2. Tab: **Manual Deployment**
3. Button: **Connect**

### 4c. Upload Zip
1. Drag and drop `muse-backend-deploy.zip` onto the upload area
   OR
2. Click upload button and select `muse-backend-deploy.zip`
3. Wait for "Deployment started" message

### 4d: Monitor Deployment
1. Stay on Deployment Center tab
2. Wait ~3-5 minutes for status to show "Success"
3. You'll see:
   ```
   Deployment Status: Success
   Commit ID: <hash>
   Last Deployment: 2024-09-24 ...
   ```

---

## Step 5: Configure Environment Variables (2 minutes)

### 5a: Navigate to Configuration
1. Left sidebar → **Configuration**
2. Tab: **Application Settings**

### 5b: Add Credentials
Click **+ New application setting** for each:

| Name | Value | Source |
|------|-------|--------|
| `NODE_ENV` | `production` | Copy exactly |
| `COPILOT_STUDIO_CLIENT_ID` | `[your-client-id]` | From Copilot Studio OAuth2 setup |
| `COPILOT_STUDIO_CLIENT_SECRET` | `[your-client-secret]` | From Copilot Studio OAuth2 setup |
| `COPILOT_STUDIO_TENANT_ID` | `[your-tenant-id]` | Your Azure tenant ID |

### 5c: Save
Click **Save** button at top

### 5d: Restart App Service
1. Top bar → **Restart**
2. Confirm: "Yes"
3. Wait 30 seconds for app to restart

---

## Step 6: Verify Deployment (1 minute)

### 6a: Test Health Endpoint
```bash
curl https://muse-backend.azurewebsites.net/api/copilot/status
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2024-09-24T16:24:00.000Z"
}
```

### 6b: If Error
1. Go back to App Service
2. Left sidebar → **Log stream**
3. Look for error messages
4. Common issues:
   - Missing env variables → Add them in Configuration
   - Wrong credentials → Verify in Copilot Studio
   - App not started → Wait 1 minute and retry

---

## Total Time: ~11 minutes

- Libraries: 2 min
- Backend build: 1 min
- Zip: 1 min
- Upload: 3-5 min
- Configure: 2 min
- Test: 1 min

---

## Success Criteria

✅ Deployment Center shows "Success"  
✅ `curl /api/copilot/status` returns HTTP 200  
✅ Response includes `"status":"ok"`

---

## Next Steps After Deployment

Run verification:
```bash
./post-deploy-verify.sh
./e2e-verify.sh
```

Then wire to Copilot Studio:
```bash
./copilot-wiring-helper.sh
```

