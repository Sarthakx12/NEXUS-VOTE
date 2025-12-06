# Vercel Deployment Troubleshooting Guide

## Fixing 404 Errors on Vercel

If you're seeing a 404 error on Vercel, follow these steps:

### Step 1: Verify Vercel Project Settings

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **General**
3. Verify these settings:
   - **Framework Preset**: Should be **Vite** (auto-detected)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`
   - **Root Directory**: Leave empty (or set to `nexus-vote` if your project is in a subdirectory)

### Step 2: Add Environment Variables

**CRITICAL**: Your app won't work without Firebase environment variables!

1. Go to **Settings** → **Environment Variables**
2. Add ALL of these variables (copy from your `.env` file):
   ```
   VITE_FIREBASE_API_KEY
   VITE_FIREBASE_AUTH_DOMAIN
   VITE_FIREBASE_PROJECT_ID
   VITE_FIREBASE_STORAGE_BUCKET
   VITE_FIREBASE_MESSAGING_SENDER_ID
   VITE_FIREBASE_APP_ID
   VITE_FIREBASE_MEASUREMENT_ID
   ```
3. Make sure to add them for:
   - ✅ Production
   - ✅ Preview
   - ✅ Development

### Step 3: Check Build Logs

1. Go to **Deployments** tab
2. Click on the latest deployment
3. Check the **Build Logs** for any errors
4. Common issues:
   - Missing environment variables → Add them in Step 2
   - Build failures → Check the error message

### Step 4: Redeploy

After making changes:

1. Go to **Deployments**
2. Click the **three dots** (⋯) on the latest deployment
3. Click **Redeploy**
4. Or push a new commit to trigger auto-deploy

### Step 5: Verify vercel.json

The `vercel.json` file should contain:
```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

This ensures all routes are redirected to `index.html` for SPA routing.

### Common Issues and Solutions

#### Issue: 404 NOT_FOUND
**Solution**: 
- Check that `vercel.json` exists in the root
- Verify Output Directory is set to `dist`
- Make sure environment variables are set

#### Issue: Blank page / App not loading
**Solution**:
- Check browser console for errors
- Verify all environment variables are set
- Check that Firebase is properly configured

#### Issue: Build fails
**Solution**:
- Check build logs for specific errors
- Ensure `package.json` has correct build script
- Verify all dependencies are installed

### Manual Deployment Check

If auto-deployment isn't working:

1. **Build locally** to verify it works:
   ```bash
   npm run build
   ```
   This should create a `dist` folder with `index.html`

2. **Check the dist folder**:
   ```bash
   ls -la dist/
   ```
   You should see:
   - `index.html`
   - `assets/` folder
   - `vite.svg` (or other public assets)

3. **Test locally**:
   ```bash
   npm run preview
   ```
   This serves the built files locally

### Still Not Working?

1. **Check Vercel Build Logs**:
   - Look for any error messages
   - Check if the build completed successfully

2. **Verify File Structure**:
   - Make sure `vercel.json` is in the root directory
   - Ensure `package.json` is in the root
   - Check that `dist` folder is created after build

3. **Contact Support**:
   - Vercel has excellent documentation
   - Check: https://vercel.com/docs

### Quick Checklist

- [ ] `vercel.json` exists in root directory
- [ ] All environment variables are set in Vercel dashboard
- [ ] Build Command: `npm run build`
- [ ] Output Directory: `dist`
- [ ] Framework Preset: `Vite`
- [ ] Latest code is pushed to GitHub
- [ ] Deployment has been triggered/redeployed

