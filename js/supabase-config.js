// Supabase Configuration for GERAMA Portal
// Keys are loaded from js/env-config.js (gitignored, for local dev)
// On Vercel: set SUPABASE_URL and SUPABASE_KEY as Environment Variables
// then add a _headers or inline script — or just use the window globals below.
(function() {
    'use strict';

    function waitForSupabase() {
        if (typeof window.supabase !== 'undefined') {
            initializeSupabase();
        } else {
            setTimeout(waitForSupabase, 100);
        }
    }

    function initializeSupabase() {
        try {
            const { createClient } = window.supabase;

            // Priority: env-config.js globals → hardcoded fallback (safe anon key)
            // Supabase anon key is public by design — security is enforced via Row Level Security (RLS) in database
            var url = window.__SUPABASE_URL  || 'YOUR_SUPABASE_PROJECT_URL';
            var key = window.__SUPABASE_KEY  || 'YOUR_SUPABASE_ANON_KEY';

            const geramaSupabaseClient = createClient(url, key);
            window.geramaSupabase    = geramaSupabaseClient;
            window.GERAMA_SECRET_CODE = window.__GERAMA_CODE || 'GERAMA2026';
            console.log('[GERAMA] Supabase initialized');
        } catch (error) {
            console.error('[GERAMA] Supabase init error:', error);
        }
    }

    waitForSupabase();
})();
