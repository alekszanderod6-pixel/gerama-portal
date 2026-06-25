# GERAMA Deployment & Environment Setup Guide

## Quick Summary

- **Repo:** `https://github.com/alekszanderod6-pixel/gerama-portal.git`
- **Deploy branch:** `deploy-v2`
- **Hosting:** Vercel (static site)
- **Database:** Supabase
- **No build step needed** — all HTML/CSS/JS files deployed as-is

---

## Step 1: Clean Git History (Fix Secret Scanning)

The Supabase anon key was accidentally committed to git history. GitHub is blocking pushes. Fix it:

### Option A: BFG Repo-Cleaner (Recommended)

```bash
# Install BFG (Windows):
choco install bfg

# Clone the mirror (keep your current folder untouched)
cd c:\temp
git clone --mirror https://github.com/alekszanderod6-pixel/gerama-portal.git

# Remove all instances of the anon key from history
bfg --replace-text passwords.txt gerama-portal.git
# Create passwords.txt with one line: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Prune reflog
cd gerama-portal.git
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# Push back
git push --mirror https://github.com/alekszanderod6-pixel/gerama-portal.git

# Clone fresh
cd c:\Users\aleks\Desktop\WebDev_1
rm -r gerama
git clone https://github.com/alekszanderod6-pixel/gerama-portal.git gerama
cd gerama
git checkout deploy-v2
```

### Option B: Manual (If BFG fails)

```bash
cd c:\Users\aleks\Desktop\WebDev_1\gerama

# Rewrite history to remove the key
git filter-branch --force --index-filter \
  'git rm --cached --ignore-unmatch js/supabase-config.js' \
  --prune-empty --tag-name-filter cat -- --all

# Verify the key is gone
git log --all --full-history -- js/supabase-config.js

# Force push (only works after GitHub secret scanning dismissal)
git push origin --force --all --tags
```

### Step 1b: Dismiss GitHub Alert

1. Go to: `https://github.com/alekszanderod6-pixel/gerama-portal`
2. Click **Security** tab → **Secret scanning**
3. Find "Supabase Service Role Key" alert
4. Click **Dismiss** (choose reason: "False positive" or "Wont fix")
5. Now your `git push origin deploy-v2` should succeed

---

## Step 2: Deploy to Vercel

### 2a: Connect Repository

1. Go to **https://vercel.com**
2. Click **New Project**
3. Select **Import Git Repository**
4. Paste: `https://github.com/alekszanderod6-pixel/gerama-portal`
5. Choose **deploy-v2** branch (not main)
6. Click **Import**

### 2b: Configure Environment Variables

In **Project Settings → Environment Variables**, add:

| Variable | Value | Scope |
|---|---|---|
| `SUPABASE_URL` | Your Supabase project URL | Production, Preview, Development |
| `SUPABASE_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhkcm5udnZydGJ3anN4dHJ4emZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY1MjQ3MTgsImV4cCI6MjA5MjEwMDcxOH0.rEHkz3HOoXArRkasGSaxK6JQZrQHI2LAJ7c6Dj8DaQI` | Production, Preview, Development |
| `GERAMA_CODE` | `GERAMA2026` | Production, Preview, Development |

**Note:** No build command or output directory needed (static site).

### 2c: Deploy

1. Click **Deploy**
2. Wait 2-3 minutes for build to complete
3. Your site is live at: `https://gerama-portal.vercel.app` (or custom domain)

---

## Step 3: Configure Custom Domain (Optional)

1. In **Vercel Dashboard** → Select project → **Settings** → **Domains**
2. Add your domain (e.g., `gerama.uenr.edu.gh`)
3. Update DNS records as shown in Vercel
4. Wait 5-30 minutes for DNS propagation

---

## Local Development Setup

### Install Dependencies

```bash
cd c:\Users\aleks\Desktop\WebDev_1\gerama

# No npm packages needed for this project — it's 100% vanilla JS
# But if you want to test locally:
```

### Create Local Environment File

Create `js/env-config.js` (NOT tracked in git):

```javascript
// Copy from js/env-config.example.js and fill in values
window.__SUPABASE_URL = 'YOUR_SUPABASE_PROJECT_URL';
window.__SUPABASE_KEY = 'YOUR_SUPABASE_ANON_KEY';
window.__GERAMA_CODE = 'GERAMA2026';
window.__GEMINI_KEY__ = '';  // Optional, only if testing AI features
window.__GROQ_KEY__ = '';    // Optional, only if testing AI features
```

### Run Locally

```bash
# Windows PowerShell (simple Python server)
cd c:\Users\aleks\Desktop\WebDev_1\gerama
python -m http.server 8000

# Then open: http://localhost:8000
```

Or use VS Code **Live Server** extension:
1. Right-click `index.html`
2. Select **Open with Live Server**
3. Auto-refreshes on file changes

---

## Environment Variables Reference

### Supabase

- **URL**: Your Supabase project URL
- **Anon Key**: Your Supabase anon key — This is PUBLIC by design
- **Why public?**: Supabase uses Row Level Security (RLS) to secure data at database level
- **Storage bucket:** `gerama-materials` (must be public for student downloads)

### Secret Code

- **Value**: `GERAMA2026`
- **Purpose**: Client-side login gate (login.html validation)
- **Note**: This is NOT cryptographically secure — it's just a convenience gate
- **For production**: Add server-side authentication to admin-dashboard.html

### API Keys (AI Features)

- **Gemini**: Not needed for MVP (leave empty)
- **Groq**: Not needed for MVP (leave empty)
- **Why**: These are optional. Leave empty unless you're integrating AI features.

---

## Git Workflow After Deployment

### For updates:

```bash
cd c:\Users\aleks\Desktop\WebDev_1\gerama

# Make your changes
# Edit files...

# Commit
git add .
git commit -m "Update: [description]"

# Push to deploy-v2
git push origin deploy-v2

# Vercel auto-deploys after ~2-3 minutes
```

### For emergency hotfixes:

```bash
# Hotfix branches (fast deployment)
git checkout -b hotfix/emergency-fix
# Edit files...
git commit -m "Hotfix: [description]"
git push origin hotfix/emergency-fix

# Create PR on GitHub to deploy-v2
# Merge when approved
# Vercel auto-deploys
```

---

## Monitoring & Logs

### Check deployment status:
1. Go to **Vercel Dashboard** → project → **Deployments**
2. Click latest deployment
3. View **Build Logs** and **Runtime Logs**

### Check errors:
- Browser console: `F12` → **Console** tab
- Supabase errors: Check browser Network tab → Supabase requests
- Page views: Supabase **page_views** table

---

## Troubleshooting

### Site shows 404 errors
- Check `vercel.json` has rewrite rule for SPA
- Ensure all `.html` files are in root (not in subdirectories)

### Supabase connection fails
- Check environment variables are set correctly
- Verify bucket `gerama-materials` is public
- Test connection: Open DevTools → Network → look for Supabase requests

### Auth not working
- Check `GERAMA_CODE` is correct: `GERAMA2026`
- Verify Supabase project is accessible
- Check RLS policies on `users` table

### Slow page loads
- Run Lighthouse audit: DevTools → Lighthouse
- Optimize large PDFs/videos (consider adding to GitHub or CDN)
- Serve compressed assets (Vercel does this automatically)

---

## Security Checklist

- ✅ Anon key is public (secured by RLS)
- ✅ Secret code on client-side (no high-security data behind this)
- ✅ Admin dashboard URL-only access (add proper auth in future)
- ✅ CORS headers set in vercel.json
- ✅ No sensitive data in localStorage (only profile & session state)
- ⚠️ Supabase RLS policies must be configured (ask me if unsure)
- ⚠️ Add rate limiting if site gets heavy traffic

---

## Next Steps

1. **Clean git history** (Step 1)
2. **Push to deploy-v2** (now will succeed)
3. **Deploy to Vercel** (Step 2)
4. **Test everything:**
   - Home page loads
   - Login works (email + secret code)
   - Resources page loads materials
   - Admin dashboard accessible via URL
   - Q&A board works
   - File uploads work
5. **Configure domain** (Step 3, optional)

---

## Questions?

- Check browser console for JavaScript errors
- Check Supabase dashboard for database/RLS issues
- Check Vercel deployment logs for build issues
- Review supabase-config.js for initialization issues
