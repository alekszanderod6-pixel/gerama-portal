// ═════════════════════════════════════════════════════════════════
// ENVIRONMENT CONFIGURATION TEMPLATE
// ═════════════════════════════════════════════════════════════════
//
// IMPORTANT: This file is a TEMPLATE. Do NOT rename it to env-config.js
// Instead, create your own env-config.js in the same directory (it's gitignored)
//
// HOW TO USE:
// 1. Copy this file and name it: env-config.js (no .example)
// 2. Add your actual keys below (only for LOCAL DEVELOPMENT)
// 3. Never commit env-config.js to Git
// 4. On Vercel: set environment variables in Project Settings → Environment Variables
//
// On Vercel, these globals will be injected server-side or via build-time variables
// ═════════════════════════════════════════════════════════════════

// Supabase Configuration (leave as-is, supabase-config.js has a fallback)
window.__SUPABASE_URL = 'https://hdrnnvvrtbwjsxtrxzfj.supabase.co';
window.__SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhkcm5udnZydGJ3anN4dHJ4emZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY1MjQ3MTgsImV4cCI6MjA5MjEwMDcxOH0.rEHkz3HOoXArRkasGSaxK6JQZrQHI2LAJ7c6Dj8DaQI';

// Secret Code (change this for production)
window.__GERAMA_CODE = 'GERAMA2026';

// AI API Keys (OPTIONAL — only for local testing)
// NOTE: These are PUBLIC keys and will be exposed to clients.
// For production: Use backend API endpoints instead of direct API calls
// Leave these empty if not needed
window.__GEMINI_KEY__ = '';
window.__GROQ_KEY__ = '';

// Example with actual keys (LOCAL DEV ONLY):
// window.__GEMINI_KEY__ = 'AIzaSy...xxxx';
// window.__GROQ_KEY__ = 'gsk_...xxxx';
