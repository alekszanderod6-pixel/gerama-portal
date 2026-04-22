// Supabase Configuration for GERAMA Portal
(function() {
    'use strict';
    
    // Wait for Supabase to be available
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
            
            // Initialize Supabase with correct configuration
            const geramaSupabaseClient = createClient(
                'https://hdrnnvvrtbwjsxtrxzfj.supabase.co',
                'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhkcm5udnZydGJ3anN0dHJ4emZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY1MjQ3MTgsImV4cCI6MjA5MjEwMDcxOH0.rEHkz3HOoXArRkasGSaxK6JQZrQHI2LAJ7c6Dj8DaQI'
            );

            // Secret code for GERAMA members verification
            const GERAMA_SECRET_CODE = 'GERAMA2026';

            // Export for use in other scripts
            window.geramaSupabase = geramaSupabaseClient;
            window.GERAMA_SECRET_CODE = GERAMA_SECRET_CODE;
            
            console.log('Supabase configured successfully');
            
        } catch (error) {
            console.error('Error initializing Supabase:', error);
        }
    }
    
    // Start the initialization process
    waitForSupabase();
})();
