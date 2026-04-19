# GERAMA Portal Deployment Guide

## Step 1: Prepare Project for Deployment

### 1.1 Update Supabase Configuration
The current Supabase configuration is ready for deployment with your live project URL and publishable key.

### 1.2 Create README.md
Create a README file for your GitHub repository.

### 1.3 Create vercel.json (Optional)
For custom deployment settings.

## Step 2: Create GitHub Repository

### 2.1 Initialize Git Repository
```bash
cd c:\Users\aleks\Desktop\WebDev_1\gerama
git init
git add .
git commit -m "Initial commit: GERAMA Portal with Supabase auth"
```

### 2.2 Create GitHub Repository
1. Go to https://github.com
2. Click "New repository"
3. Name: `gerama-portal`
4. Description: "GERAMA Academic Resources Portal - UENR"
5. Make it Public
6. Don't initialize with README (we already have files)
7. Click "Create repository"

### 2.3 Push to GitHub
```bash
git remote add origin https://github.com/YOUR_USERNAME/gerama-portal.git
git branch -M main
git push -u origin main
```

## Step 3: Deploy to Vercel

### 3.1 Connect Vercel to GitHub
1. Go to https://vercel.com
2. Sign up/login with GitHub
3. Click "New Project"
4. Import your `gerama-portal` repository
5. Vercel will auto-detect it as a static site

### 3.2 Configure Build Settings
- **Framework Preset**: Other
- **Root Directory**: ./
- **Build Command**: (leave empty for static site)
- **Output Directory**: (leave empty)
- **Install Command**: (leave empty)

### 3.3 Add Environment Variables (if needed)
For this project, Supabase config is already in the code, so no env vars needed.

### 3.4 Deploy
Click "Deploy" - Vercel will build and deploy your site.

## Step 4: Update Supabase for Live Domain

### 4.1 Get Your Vercel URL
After deployment, Vercel will give you a URL like:
`https://gerama-portal-xyz.vercel.app`

### 4.2 Update Supabase Settings
1. Go to your Supabase dashboard: https://hdrnnvvrtbwjsxtrxzfj.supabase.co
2. Navigate to **Authentication** > **Settings**
3. Update **Site URL** to your Vercel URL
4. Add your Vercel URL to **Redirect URLs**
5. Click **Save**

## Step 5: Test Live Deployment

### 5.1 Test Authentication Flow
1. Visit your live Vercel URL
2. Try signing up with GERAMA2026
3. Check email for verification
4. Test login functionality
5. Verify sidebar appears correctly

### 5.2 Test All Features
- Navigation between pages
- Sidebar functionality
- Profile editing
- Download tracking
- Resource library

## Troubleshooting

### Common Issues:
1. **CORS errors**: Ensure your Vercel URL is added to Supabase redirect URLs
2. **Auth errors**: Check that email confirmation is enabled in Supabase
3. **404 errors**: Verify all file paths are correct
4. **Styling issues**: Check that CSS files are loading properly

### Debug Tips:
- Use browser console (F12) to check for errors
- Check Vercel deployment logs
- Verify Supabase configuration

## Custom Domain (Optional)

### Add Custom Domain:
1. In Vercel dashboard, go to **Settings** > **Domains**
2. Add your custom domain (e.g., gerama-uenr.com)
3. Update DNS records as instructed by Vercel
4. Update Supabase Site URL to your custom domain

## Maintenance

### Regular Tasks:
- Monitor Vercel analytics
- Update Supabase settings if needed
- Backup your code regularly
- Test authentication after any changes
