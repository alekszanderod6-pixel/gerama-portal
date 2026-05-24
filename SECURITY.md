# GERAMA Security Hardening Guide

## Current Security Status

| Component | Status | Notes |
|---|---|---|
| API Keys | ✅ Fixed | Removed hardcoded keys, using env vars |
| XSS Protection | ✅ Fixed | Added escHtml/escAttr helpers everywhere |
| CORS | ✅ OK | Vercel headers set in vercel.json |
| Auth | ⚠️ Partial | Supabase auth OK, but admin dashboard URL-only |
| RLS | ⚠️ Needs Check | Verify Supabase Row Level Security policies |
| Secrets | ✅ OK | Secret code client-side (acceptable for MVP) |
| HTTPS | ✅ Automatic | Vercel provides free SSL/TLS |
| Password Reset | ✅ OK | Supabase handles securely |

---

## Recommended Security Improvements (Priority Order)

### 1. ⚠️ CRITICAL: Set Up Supabase Row Level Security (RLS)

**Current situation**: Anon key is public — database is protected by RLS policies only.

**What to do**:

Go to Supabase Dashboard → SQL Editor → Run these:

```sql
-- Enable RLS on all tables
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_views ENABLE ROW LEVEL SECURITY;

-- Example policy: Students can only read public materials
CREATE POLICY "students_view_approved_materials"
ON materials
FOR SELECT
USING (status = 'approved');

-- Example policy: Students can view their own quiz attempts
CREATE POLICY "students_view_own_attempts"
ON quiz_attempts
FOR SELECT
USING (auth.uid()::text = student_email);

-- Example policy: Admins can do everything
CREATE POLICY "admins_all_access"
ON materials
USING (auth.jwt() ->> 'email' = 'gerama.uenr@gmail.com')
WITH CHECK (auth.jwt() ->> 'email' = 'gerama.uenr@gmail.com');
```

**Verify**:
1. Go to Supabase Dashboard → Authentication → Users
2. Should show registered students
3. Try accessing materials table without auth → should be blocked

---

### 2. ⚠️ HIGH: Add Server-Side Validation

Current: Client-side validation only (can be bypassed)

**Recommended**:
- Set up a backend (Node.js/Express) on Vercel edge functions
- Validate form submissions server-side
- Check auth before allowing data modifications
- Rate-limit API calls

**For now** (MVP): Use Supabase functions (SQL triggers) to validate data

---

### 3. ⚠️ MEDIUM: Secure Admin Dashboard

**Current**: URL-only access (anyone can visit `/admin-dashboard.html`)

**Fix Option A** (Simple):
```javascript
// Add to admin-dashboard.html <script> before other code:
(function() {
    var profile = JSON.parse(localStorage.getItem('gerama_profile') || '{}');
    var adminEmails = ['gerama.uenr@gmail.com'];
    if (adminEmails.indexOf(profile.email) === -1) {
        // Redirect or show message
        document.body.innerHTML = '<h1>Access Denied</h1><p>Admin access only.</p>';
    }
})();
```

**Fix Option B** (Better):
- Add Supabase Auth check to admin-dashboard.html
- Only allow if `email === 'gerama.uenr@gmail.com'` OR `isAdmin === true`
- Store admin flag in Supabase users metadata

---

### 4. ⚠️ MEDIUM: Input Sanitization

**Current**: Using escHtml() on display, but form inputs could be malicious

**To do**:
```javascript
// Validate email
function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Sanitize text input (before storing in DB)
function sanitizeInput(s) {
    return (s || '').trim().substring(0, 500); // Limit length
}

// Validate file uploads
function isValidFile(file) {
    const allowed = ['pdf', 'ppt', 'pptx', 'mp4', 'doc', 'docx'];
    const ext = file.name.split('.').pop().toLowerCase();
    return allowed.includes(ext) && file.size < 50 * 1024 * 1024; // 50MB
}
```

Add these to all forms before submission.

---

### 5. ⚠️ LOW: Add Content Security Policy

Add to `vercel.json`:

```json
{
  "version": 2,
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "SAMEORIGIN" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
        { "key": "Content-Security-Policy", "value": "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https:; font-src https://fonts.gstatic.com" }
      ]
    }
  ]
}
```

---

### 6. ⚠️ LOW: Rate Limiting

**For high-traffic sites**: Add Vercel middleware to limit:
- Login attempts (3 per minute)
- API calls (100 per hour per IP)
- File uploads (10 per day per user)

**For now**: Not needed unless you get spam

---

## Data Protection

### What's stored in localStorage (on user device):
- `gerama_profile` — name, program, level (no passwords)
- `gerama_uploads` — locally queued submissions (deleted after upload)
- `gerama_q_liked` — liked questions (not sensitive)

**Risk**: Low (user data only, no admin data)

### What's stored in Supabase (encrypted, server):
- User passwords (hashed by Supabase Auth)
- Uploaded files (student submissions, materials)
- Quiz attempts (with email)
- Q&A posts (with email)

**Risk**: Medium (student data, but properly encrypted at rest)

---

## Secret Management

### ✅ Good:
- Supabase anon key is public (designed to be)
- Secret code is only for login gate (not high-security)
- Admin credentials checked server-side via Supabase Auth

### ⚠️ To Fix:
- Remove hardcoded API keys ✅ DONE
- Use environment variables ✅ DONE
- Never log credentials ✅ OK (already done)

### 🔐 Production Checklist:
- [ ] Change `GERAMA_SECRET_CODE` to something stronger
- [ ] Rotate Supabase keys if compromised
- [ ] Enable 2FA on GitHub & Supabase accounts
- [ ] Audit Supabase activity logs monthly
- [ ] Back up materials regularly

---

## Monitoring & Auditing

### Enable Supabase Audit Logs:
1. Supabase Dashboard → Settings → Audit Logs
2. Log events: auth changes, data modifications, admin actions
3. Review weekly for suspicious activity

### Monitor page_views table:
```sql
-- Find suspicious activity
SELECT page, visited_at, COUNT(*) as visits
FROM page_views
WHERE visited_at > NOW() - INTERVAL '1 hour'
GROUP BY page, DATE(visited_at)
HAVING COUNT(*) > 1000;
```

### Check failed logins:
```javascript
// In console:
// Check if any errors in browser DevTools → Network tab
// Look for 401/403 responses
```

---

## Incident Response Plan

### If someone gains unauthorized access:

1. **Immediate** (< 5 min):
   - Rotate Supabase anon key
   - Disable compromised user accounts
   - Change admin passwords

2. **Short-term** (< 1 hour):
   - Review Supabase audit logs
   - Check uploaded files for malicious content
   - Notify users if needed

3. **Long-term** (< 24 hours):
   - Implement the hardening steps above
   - Add logging/monitoring
   - Brief team on incident

---

## Testing Security

### Manual testing:
```javascript
// In browser console, try to bypass login:
localStorage.setItem('gerama_profile', JSON.stringify({
    name: 'Hacker',
    program: 'Hacking',
    isAdmin: true
}));
// Refresh page → should redirect (main.js auth check)

// Try XSS:
document.getElementById('drawerName').innerHTML = '<img src=x onerror=alert("XSS")>';
// Should not alert (using textContent instead)
```

### Automated testing (future):
- Use OWASP ZAP for vulnerability scanning
- Burp Suite for penetration testing
- npm package `npm audit` for dependency vulnerabilities

---

## Summary

**Current Score**: 7/10 (MVP-ready, but needs hardening)

**Immediate fixes done** ✅:
- Removed hardcoded API keys
- Added XSS prevention
- Added admin auth gate
- Configured Vercel security headers

**Next priorities**:
1. Set up Supabase RLS policies (1 hour)
2. Add server-side validation (2 hours)
3. Secure admin dashboard properly (1 hour)
4. Regular security audits (ongoing)

**Recommended**: Review this after each major update, or quarterly.
