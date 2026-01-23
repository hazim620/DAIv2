# Deployment Instructions for AWS Amplify

## Resolving Git Lock File Issue

If you encounter a git lock file error, follow these steps:

1. **Close all Git processes:**
   - Close any IDE (VS Code, Cursor, etc.)
   - Close any Git GUI applications
   - Wait for OneDrive to finish syncing (if using OneDrive)

2. **Remove the lock file manually:**
   - Navigate to: `C:\Users\Yasir\OneDrive\Desktop\DAI\DAIv2\.git\`
   - Delete the file: `index.lock`
   - If you can't delete it, restart your computer and try again

3. **Or use PowerShell as Administrator:**
   ```powershell
   Remove-Item "C:\Users\Yasir\OneDrive\Desktop\DAI\DAIv2\.git\index.lock" -Force
   ```

## Push to GitHub

Once the lock file is resolved, run:

```powershell
cd "C:\Users\Yasir\OneDrive\Desktop\DAI\DAIv2"
git add .
git commit -m "Add DAI learning platform with customer pages, landing page, login/signup, and Arabic/English support"
git push origin main
```

Or simply run the provided script:
```powershell
.\push-to-github.ps1
```

## Deploy to AWS Amplify

1. **Go to AWS Amplify Console:**
   - Visit: https://console.aws.amazon.com/amplify/
   - Click "New app" → "Host web app"

2. **Connect Repository:**
   - Select "GitHub"
   - Authorize AWS Amplify to access your GitHub account
   - Select repository: `hazim620/DAIv2`
   - Select branch: `main`

3. **Configure Build Settings:**
   Amplify should auto-detect Next.js, but verify these settings:
   ```yaml
   version: 1
   frontend:
     phases:
       preBuild:
         commands:
           - npm ci
       build:
         commands:
           - npm run build
     artifacts:
       baseDirectory: .next
       files:
         - '**/*'
     cache:
       paths:
         - node_modules/**/*
   ```

4. **Environment Variables (if needed):**
   - Add any required environment variables in Amplify console

5. **Deploy:**
   - Click "Save and deploy"
   - Wait for the build to complete

## Build Settings for Next.js

If auto-detection doesn't work, use these build settings:

- **Build command:** `npm run build`
- **Output directory:** `.next`
- **Base directory:** (leave empty)

## Important Notes

- Make sure all dependencies are in `package.json`
- The app uses Next.js 14 with App Router
- Tailwind CSS is configured
- shadcn/ui components are included
- Arabic/English language support is implemented

## After Deployment

Your app will be available at: `https://[app-id].amplifyapp.com`

You can also set up a custom domain in the Amplify console.
