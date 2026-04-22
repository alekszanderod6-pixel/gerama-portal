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
            
            // Try with the provided key first
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
            
            // Test connection
            testSupabaseConnection();
            
        } catch (error) {
            console.error('Error initializing Supabase:', error);
            // Fallback to mock authentication if Supabase fails
            setupFallbackAuth();
        }
    }
    
    function testSupabaseConnection() {
        // Test if Supabase is working
        window.geramaSupabase.auth.getSession().then(({ data, error }) => {
            if (error) {
                console.warn('Supabase connection test failed:', error.message);
                setupFallbackAuth();
            } else {
                console.log('Supabase connection successful');
            }
        });
    }
    
    function setupFallbackAuth() {
        console.log('Setting up fallback authentication');
        // Fallback authentication using localStorage
        window.geramaSupabase = {
            auth: {
                signUp: async ({ email, password, options }) => {
                    // Store user in localStorage
                    const user = {
                        id: 'fallback_' + Date.now(),
                        email: email,
                        user_metadata: options?.data || {},
                        created_at: new Date().toISOString()
                    };
                    localStorage.setItem('fallback_user_' + email, JSON.stringify(user));
                    return { data: { user }, error: null };
                },
                signInWithPassword: async ({ email, password }) => {
                    // Check if user exists in localStorage
                    const storedUser = localStorage.getItem('fallback_user_' + email);
                    if (storedUser) {
                        const user = JSON.parse(storedUser);
                        return { data: { user }, error: null };
                    }
                    return { data: null, error: { message: 'Invalid login credentials' } };
                },
                signOut: async () => {
                    return { error: null };
                },
                getSession: async () => {
                    return { data: { session: null }, error: null };
                }
            }
        };
        console.log('Fallback authentication ready');
    }
    
    // Start the initialization process
    waitForSupabase();
})();
