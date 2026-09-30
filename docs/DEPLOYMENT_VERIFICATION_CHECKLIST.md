# Deployment Verification Checklist

**PURPOSE:** Prevent deployment failures by verifying all required files are included BEFORE uploading to Azure.

**Last Updated:** September 30, 2024  
**Package Version:** muse-backend-deploy-v2.zip

---

## ⚠️ Why Previous Deployments Failed

### Root Cause Analysis

**Problem 1: Missing `tsconfig.json` in first zip**
- Created: muse-backend-deploy.zip (Sept 24)
- Included: dist/ (compiled code), node_modules/ (dependencies)
- Missing: src/ (source), tsconfig.json (TypeScript config)
- Result: Azure tried to run `npm run build` but couldn't find tsconfig.json
- Error: `TS5058: The specified path does not exist: 'tsconfig.json'`

**Problem 2: Incorrect deployment strategy**
- Old approach: Pre-compiled code only
- Issue: Azure App Service expects source code, not pre-compiled artifacts
- Solution: Include source + configs, let Azure compile

---

## ✅ Pre-Deployment Verification

Run this checklist **BEFORE** uploading zip to Azure Portal.

### 1. Local Build Verification

```bash
cd backend
npm install  # Must install with dev dependencies
npm run build  # Must complete with 0 errors
```

**Verification:**
- ✅ `npm install` completes without errors
- ✅ No warnings about missing dependencies
- ✅ `npm run build` runs TypeScript compiler (tsc)
- ✅ `dist/` directory created with compiled .js files
- ✅ dist/index.js exists (main entry point)

### 2. Required Files Checklist

In `backend/` directory, verify these files exist:

```
backend/
├── package.json               ✓ MUST INCLUDE (dependencies list)
├── package-lock.json          ⚠️ AUTO-GENERATED (nice to have)
├── tsconfig.json              ✓ MUST INCLUDE (TypeScript config)
├── .deployment                ✓ MUST INCLUDE (Azure config)
├── web.config                 ✓ MUST INCLUDE (IIS config)
├── src/                        ✓ MUST INCLUDE (source code)
│   ├── index.ts
│   ├── runtime.ts
│   ├── routes/
│   ├── services/
│   └── ... (all TypeScript files)
├── dist/                       ❌ DO NOT INCLUDE (Azure builds it)
├── node_modules/              ❌ DO NOT INCLUDE (Azure installs it)
└── .git/                       ❌ DO NOT INCLUDE (not needed)
```

**Verification Command:**
```bash
cd backend
ls -la package.json tsconfig.json .deployment web.config src/
```

**Expected Output:**
```
-rw-r--r--  ... package.json       ✓
-rw-r--r--  ... tsconfig.json      ✓
-rw-r--r--  ... .deployment        ✓
-rw-r--r--  ... web.config         ✓
drwxr-xr-x  ... src/               ✓
```

### 3. Zip Package Verification

**Before uploading, verify zip contents:**

```bash
# Check zip file exists
ls -lh muse-backend-deploy-v2.zip

# List contents
unzip -l muse-backend-deploy-v2.zip

# Verify critical files
unzip -l muse-backend-deploy-v2.zip | grep -E "tsconfig|package.json|\.deployment|web.config"
```

**Expected Results:**
- File size: 25-35 KB
- Contains tsconfig.json: ✓ (1 file)
- Contains package.json: ✓ (1 file)
- Contains .deployment: ✓ (1 file)
- Contains web.config: ✓ (1 file)
- Contains src/ files: ✓ (25+ files)
- Does NOT contain dist/: ✓ (0 files)
- Does NOT contain node_modules/: ✓ (0 files)

**Verification Command:**
```bash
unzip -l muse-backend-deploy-v2.zip | tail -5
```

---

## 🚀 Azure Portal Upload Steps

1. **Navigate to Deployment Center**
   - App Service → Muse Backend → Deployment → Deployment Center
   - Deployment method: "Zip push deploy"

2. **Upload via Kudu (Advanced Tools)**
   - App Service → Advanced Tools → Go
   - Kudu Dashboard opens
   - Click "Debug console" → CMD
   - Navigate to D:\home\site\wwwroot
   - Drag & drop muse-backend-deploy-v2.zip
   - Or use curl to upload

3. **Extract and Deploy**
   - Kudu will automatically extract
   - Azure will run: `npm install`
   - Azure will run: `npm run build`
   - Azure will run: `npm start`

4. **Monitor Deployment Logs**
   - App Service → Deployment logs
   - Watch for:
     - ✓ "npm install" completes (41s typical)
     - ✓ "npm run build" completes
     - ✓ "npm start" launches successfully

---

## 🔍 What to Look for During Azure Build

### Expected Success Sequence

```
13:51:12  INFO  npm warn deprecated glob@7.2.3: Old versions...
13:51:16  INFO  added 145 packages
13:51:17  INFO  Package install done in 41 sec(s).
13:51:17  INFO  Running 'npm run build'...
13:51:18  INFO  > muse-backend@0.1.0 build
13:51:18  INFO  > tsc -p tsconfig.json
13:51:20  INFO  Build process completed
13:51:20  INFO  Starting application 'npm start'
```

### Common Failure Points

**❌ Failure: "TS5058: The specified path does not exist: 'tsconfig.json'"**
- Cause: tsconfig.json not in zip
- Fix: Add tsconfig.json to zip

**❌ Failure: "npm error code 127: tsc: command not found"**
- Cause: TypeScript not installed (dev dependency missing)
- Fix: Ensure `npm install` installs dev dependencies
- Verify: package.json has `"typescript": "^5.6.3"` in devDependencies

**❌ Failure: "Cannot find module '@muse/services'"**
- Cause: Phantom packages in code
- Status: FIXED in previous commits
- Verify: backend/src has local ./services/MuseRuntime.ts

**❌ Failure: "Cannot find file './routes/copilot'"**
- Cause: Route files missing from src/
- Fix: Verify all route files in src/routes/

---

## 📋 Pre-Upload Checklist Template

Use this before every upload:

```
☐ Local build verification
  ☐ npm install completes without errors
  ☐ npm run build succeeds with 0 errors
  ☐ dist/ directory created with .js files
  
☐ File existence checks
  ☐ backend/package.json exists
  ☐ backend/tsconfig.json exists
  ☐ backend/.deployment exists
  ☐ backend/web.config exists
  ☐ backend/src/ directory exists with files
  
☐ Zip package verification
  ☐ muse-backend-deploy-v2.zip exists
  ☐ Zip size between 25-35 KB
  ☐ Zip contains tsconfig.json
  ☐ Zip contains package.json
  ☐ Zip contains src/ files (25+ files)
  ☐ Zip does NOT contain dist/
  ☐ Zip does NOT contain node_modules/
  
☐ Upload to Azure
  ☐ Zip uploaded to Kudu
  ☐ Deployment logs show "npm install"
  ☐ Deployment logs show "npm run build"
  ☐ No TypeScript errors in logs
  ☐ No "command not found" errors
  
☐ Post-deployment test
  ☐ Test endpoint: curl https://muse-backend.azurewebsites.net/api/health
  ☐ Expect: {"status":"running"}
```

---

## 🛠️ How to Recreate the Correct Zip

```bash
cd /path/to/muse

# Step 1: Ensure backend has all dependencies (with dev)
cd backend
npm install

# Step 2: Verify build works
npm run build

# Step 3: Go back to project root
cd ..

# Step 4: Create zip with ONLY source + configs
zip -r muse-backend-deploy-v2.zip \
  backend/package.json \
  backend/package-lock.json \
  backend/tsconfig.json \
  backend/src/ \
  backend/web.config \
  backend/.deployment

# Step 5: Verify zip contents
unzip -l muse-backend-deploy-v2.zip

# Step 6: Upload to Azure Portal
# (See Azure Portal Upload Steps above)
```

---

## 📊 File Size Reference

| Component | Size | Notes |
|-----------|------|-------|
| package.json | <1 KB | Dependency list |
| tsconfig.json | <1 KB | TypeScript config |
| src/ | ~15 KB | TypeScript source (28 files) |
| .deployment | <1 KB | Azure deployment config |
| web.config | ~2 KB | IIS configuration |
| **Total Zip** | ~25 KB | All source files |
| dist/ (if included) | ~50 KB | Should NOT be included |
| node_modules/ (if included) | ~500+ MB | Should NOT be included |

---

## ✨ Prevention Strategy Going Forward

### For Every Code Change:

1. **Before committing to git:**
   ```bash
   npm install  # Ensure dependencies
   npm run build  # Verify TypeScript compiles
   npm start  # Test locally if possible
   ```

2. **Before creating deployment zip:**
   - Run all checks above
   - Use the checklist template
   - Take screenshot of npm build output

3. **Before uploading to Azure:**
   - Verify zip contents with unzip -l
   - Check file count and sizes
   - Keep previous zip for comparison (size should be similar)

4. **After uploading to Azure:**
   - Wait for build to complete
   - Read all deployment logs
   - Look for "npm warn" vs "npm error" (warnings OK, errors not OK)
   - Test endpoint immediately

### Documentation

- Keep this checklist file updated
- Update it when new dependencies are added
- Note any "gotchas" learned from future deployments

---

## 🆘 If Deployment Still Fails

**DO NOT retry with same zip.**

Instead:

1. **Read Azure deployment logs COMPLETELY**
   - Screenshot the error
   - Copy full error message

2. **Check this document for matching error pattern**
   - Search for error code (e.g., TS5058)
   - Follow fix instructions

3. **If error not listed here:**
   - This is a NEW type of error
   - Document it in "Common Failure Points" section
   - Fix the code
   - Create NEW zip
   - Mark old zip as "broken-[description].zip"

4. **Never use same zip twice**
   - Each attempt to upload creates a new deployment
   - Old zip will still be tried if you upload without fixing

---

## 🎯 Success Indicators

After deployment to Azure, you should see:

```
✅ Upload: Completed
✅ Build: Succeeded (showing "npm run build" output)
✅ Deploy: Succeeded
✅ Health Check: https://muse-backend.azurewebsites.net/api/health returns 200
```

If you see anything else, refer back to this document.

---

**Document Version:** 1.0  
**Last Updated:** Sept 30, 2024  
**Status:** Active (Use for all future deployments)
