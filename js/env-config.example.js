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

// Supabase Configuration
// Get these from your Supabase project: https://app.supabase.com/project/_/settings/api
window.__SUPABASE_URL = 'YOUR_SUPABASE_PROJECT_URL';
window.__SUPABASE_KEY = 'YOUR_SUPABASE_ANON_KEY';

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
