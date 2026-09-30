# Deploy v5 via Azure Portal (Bypass Proxy)

**Issue:** Azure CLI blocked by Zscaler proxy (SSL certificate verification)  
**Solution:** Use Azure Portal upload instead

## Steps

1. **Go to Azure Portal**
   - URL: https://portal.azure.com

2. **Navigate to muse-backend**
   - Search box: `muse-backend`
   - Click: muse-backend App Service

3. **Upload Deployment Package**
   - Left sidebar → **Deployment Center**
   - Click: **Upload** (or drag/drop)
   - Select file: `muse-backend-deploy-v5.zip`
   - Location: `/Users/948471/Projects/copilot-worktrees/muse/mshaw32-upgraded-adventure/muse-backend-deploy-v5.zip`
   - Click: **Upload**

4. **Wait for Build**
   - Status should change: Uploading → Building → Running
   - Takes 2-3 minutes
   - You'll see progress in the deployment center

5. **Verify**
   After deployment completes:
   ```bash
   curl https://muse-backend.azurewebsites.net/
   ```

   Should return:
   ```json
   {
     "name": "MUSE Backend",
     "version": "1.0.0",
     "status": "running",
     "endpoints": { ... }
   }
   ```

6. **Check Logs** (optional)
   - Portal → Log stream
   - Should show: "MUSE backend listening on http://localhost:8080"

## File Details

- **File:** muse-backend-deploy-v5.zip
- **Location:** Repo root
- **Size:** ~39 KB
- **Contents:** Updated root endpoint handler + all TypeScript files compiled

## What Changed in v5

Added root GET endpoint that returns JSON with:
- Service name: "MUSE Backend"
- Version: "1.0.0"
- Status: "running"
- Available endpoints list

This fixes the "Cannot GET /" error.

## After Upload

Once deployed, you can test:
- **Root:** https://muse-backend.azurewebsites.net/
- **Health:** https://muse-backend.azurewebsites.net/health
- **Copilot:** https://muse-backend.azurewebsites.net/api/copilot/status

All should return JSON responses.
