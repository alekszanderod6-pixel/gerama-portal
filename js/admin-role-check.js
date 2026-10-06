/**
 * GERAMA Admin Role-Based Access Control
 * This script checks user roles and restricts dashboard access accordingly
 * 
 * Roles:
 * - super_admin: Full access to everything
 * - general_admin: Access to all sections
 * - materials_admin: Only access to materials upload/management sections
 */

(function() {
    'use strict';
    
    let currentUserRole = null;
    let currentUserEmail = null;
    
    // Role permissions mapping
    const rolePermissions = {
        super_admin: ['all'], // Full access
        general_admin: ['all'], // Full access
        materials_admin: ['upload', 'history', 'review', 'software'] // Limited access
    };
    
    // Sections that materials_admin CAN access
    const materialsAdminAllowedSections = ['upload', 'software', 'history', 'review'];
    
    /**
     * Check if user has admin access and get their role
     */
    async function checkAdminAccess() {
        try {
            // Check if user is logged in
            const { data: { session } } = await window.geramaSupabase.auth.getSession();
            
            if (!session || !session.user) {
                console.warn('[Admin Access] No active session');
                redirectToLogin();
                return null;
            }
            
            currentUserEmail = session.user.email;
            console.log('[Admin Access] Checking access for:', currentUserEmail);
            
            // Query admin_users table to get role
            const { data, error } = await window.geramaSupabase
                .from('admin_users')
                .select('role, is_active, full_name')
                .eq('email', currentUserEmail)
                .single();
            
            if (error) {
                console.error('[Admin Access] Database query error:', error);
                showAccessDenied('Database error. Please contact administrator.');
                return null;
            }
            
            if (!data) {
                console.warn('[Admin Access] User not found in admin_users table');
                showAccessDenied('You do not have admin access. Please contact administrator.');
                return null;
            }
            
            if (!data.is_active) {
                console.warn('[Admin Access] User account is inactive');
                showAccessDenied('Your admin account has been deactivated. Please contact administrator.');
                return null;
            }
            
            currentUserRole = data.role;
            console.log('[Admin Access] User role:', currentUserRole);
            
            // Update last login
            updateLastLogin(currentUserEmail);
            
            return {
                role: data.role,
                email: currentUserEmail,
                name: data.full_name
            };
            
        } catch (err) {
            console.error('[Admin Access] Error checking access:', err);
            showAccessDenied('An error occurred. Please try again.');
            return null;
        }
    }
    
    /**
     * Update user's last login timestamp
     */
    async function updateLastLogin(email) {
        try {
            await window.geramaSupabase
                .from('admin_users')
                .update({ last_login: new Date().toISOString() })
                .eq('email', email);
        } catch (err) {
            console.error('[Admin Access] Failed to update last login:', err);
        }
    }
    
    /**
     * Apply role-based restrictions to the UI
     */
    function applyRoleRestrictions(role) {
        console.log('[Admin Access] Applying restrictions for role:', role);
        
        if (role === 'super_admin' || role === 'general_admin') {
            // Full access - no restrictions
            console.log('[Admin Access] Full access granted');
            return;
        }
        
        if (role === 'materials_admin') {
            console.log('[Admin Access] Materials admin - applying restrictions');
            
            // Hide all nav items except allowed ones
            const navItems = document.querySelectorAll('.nav-item');
            navItems.forEach(item => {
                const panel = item.getAttribute('data-panel');
                if (panel && !materialsAdminAllowedSections.includes(panel)) {
                    item.style.display = 'none';
                }
            });
            
            // Hide corresponding mobile nav items
            const mobileNavItems = document.querySelectorAll('.bnav-item');
            mobileNavItems.forEach(item => {
                const panel = item.getAttribute('data-panel');
                if (panel && !materialsAdminAllowedSections.includes(panel)) {
                    item.style.display = 'none';
                }
            });
            
            // Redirect to upload panel if currently on restricted panel
            const currentPanel = document.querySelector('.panel.active');
            if (currentPanel) {
                const panelId = currentPanel.id.replace('panel-', '');
                if (!materialsAdminAllowedSections.includes(panelId)) {
                    // Switch to upload panel
                    if (typeof window.switchPanel === 'function') {
                        window.switchPanel('upload');
                    }
                }
            }
            
            // Add visual indicator of limited access
            addLimitedAccessBanner();
        }
    }
    
    /**
     * Add banner showing user has limited access
     */
    function addLimitedAccessBanner() {
        const mainContent = document.querySelector('.main-content');
        if (!mainContent) return;
        
        const banner = document.createElement('div');
        banner.style.cssText = `
            background: linear-gradient(135deg, #fef3c7, #fde68a);
            border-left: 4px solid #f59e0b;
            padding: 1rem 1.5rem;
            margin-bottom: 1.5rem;
            border-radius: 12px;
            display: flex;
            align-items: center;
            gap: 1rem;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        `;
        
        banner.innerHTML = `
            <i class="fas fa-info-circle" style="color: #d97706; font-size: 1.5rem;"></i>
            <div>
                <strong style="color: #92400e; display: block; margin-bottom: 0.2rem;">Materials Admin Access</strong>
                <span style="color: #78350f; font-size: 0.9rem;">
                    You have access to: Upload Materials, Materials History, and Review Submissions only.
                </span>
            </div>
        `;
        
        mainContent.insertBefore(banner, mainContent.firstChild);
    }
    
    /**
     * Show access denied message and redirect to login
     */
    function showAccessDenied(message) {
        document.body.innerHTML = `
            <div style="
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
                background: linear-gradient(135deg, #0a2f1f 0%, #1B5E20 100%);
                font-family: 'Inter', sans-serif;
                padding: 2rem;
            ">
                <div style="
                    background: white;
                    border-radius: 32px;
                    padding: 3rem 2rem;
                    max-width: 500px;
                    text-align: center;
                    box-shadow: 0 25px 50px -12px rgba(0,0,0,0.3);
                ">
                    <div style="
                        width: 80px;
                        height: 80px;
                        background: #fee2e2;
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        margin: 0 auto 1.5rem;
                    ">
                        <i class="fas fa-lock" style="font-size: 2rem; color: #dc2626;"></i>
                    </div>
                    <h1 style="
                        font-size: 1.8rem;
                        font-weight: 800;
                        color: #1e2a3e;
                        margin-bottom: 0.8rem;
                    ">Access Denied</h1>
                    <p style="
                        color: #6b7280;
                        font-size: 1rem;
                        margin-bottom: 2rem;
                        line-height: 1.6;
                    ">${message}</p>
                    <a href="login.html" style="
                        display: inline-block;
                        background: linear-gradient(135deg, #1B5E20, #2E7D32);
                        color: white;
                        padding: 0.9rem 2rem;
                        border-radius: 40px;
                        text-decoration: none;
                        font-weight: 700;
                        transition: all 0.3s;
                    ">Go to Login</a>
                </div>
            </div>
        `;
        
        // Redirect after 3 seconds
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 3000);
    }
    
    /**
     * Redirect to login page
     */
    function redirectToLogin() {
        window.location.href = 'login.html?redirect=' + encodeURIComponent(window.location.pathname);
    }
    
    /**
     * Initialize admin access check
     */
    async function initAdminAccessCheck() {
        console.log('[Admin Access] Initializing...');
        
        // Wait for Supabase to be ready
        let attempts = 0;
        const maxAttempts = 20;
        
        while (!window.geramaSupabase && attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 200));
            attempts++;
        }
        
        if (!window.geramaSupabase) {
            console.error('[Admin Access] Supabase not loaded');
            showAccessDenied('Authentication service not available. Please refresh the page.');
            return;
        }
        
        // Check access and get role
        const adminData = await checkAdminAccess();
        
        if (!adminData) {
            // Access denied - checkAdminAccess already handles UI
            return;
        }
        
        // Apply role-based restrictions
        applyRoleRestrictions(adminData.role);
        
        // Store role for other scripts to use
        window.GERAMA_ADMIN_ROLE = adminData.role;
        window.GERAMA_ADMIN_EMAIL = adminData.email;
        window.GERAMA_ADMIN_NAME = adminData.name;
        
        console.log('[Admin Access] Access granted - Role:', adminData.role);
    }
    
    /**
     * Check if current user can access a specific section
     */
    window.canAccessSection = function(section) {
        if (!currentUserRole) return false;
        
        if (currentUserRole === 'super_admin' || currentUserRole === 'general_admin') {
            return true;
        }
        
        if (currentUserRole === 'materials_admin') {
            return materialsAdminAllowedSections.includes(section);
        }
        
        return false;
    };
    
    /**
     * Get current user's role
     */
    window.getAdminRole = function() {
        return currentUserRole;
    };
    
    // Auto-initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAdminAccessCheck);
    } else {
        initAdminAccessCheck();
    }
    
})();
