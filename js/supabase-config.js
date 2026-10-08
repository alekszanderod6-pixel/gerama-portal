// Supabase Configuration for GERAMA Portal
// Keys are loaded from js/env-config.js (gitignored, for local dev)
// On Vercel: set SUPABASE_URL and SUPABASE_KEY as Environment Variables
// then add a _headers or inline script – or just use the window globals below.
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

            // Priority: env-config.js globals – hardcoded fallback (safe anon key)
            // Supabase anon key is public by design – security is enforced via Row Level Security (RLS) in database
            var url = window.__SUPABASE_URL  || 'https://ykffelsvpopmpeagyhse.supabase.co';
            var key = window.__SUPABASE_KEY  || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlrZmZlbHN2cG9wbXBlYWd5aHNlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE0NjE0NTgsImV4cCI6MjEwNzAzNzQ1OH0.zAtMslRU12VFDD93p8oJCao-HoAnDdCaQD3UFFNuwo8';

            // Normalize globals so inline page scripts read the same config.
            window.__SUPABASE_URL = url;
            window.__SUPABASE_KEY = key;

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
