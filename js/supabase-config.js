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
            
            const geramaSupabaseClient = createClient(
                'https://hdrnnvvrtbwjsxtrxzfj.supabase.co',
                'sb_publishable_EabJTURfeOC_5XOdGA0gfA_o_Tsh1lb'
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
