/**
 * GERAMA Admin Role-Based Access Control
 * Uses admin-gate.js session (localStorage) — NOT Supabase Auth.
 * Admins authenticate via admin-gate.js custom password system.
 */

(function() {
    'use strict';

    // ── Skip this check entirely on the admin dashboard ──
    // The admin gate (admin-gate.js) already handles access control there.
    // This file only needs to run on pages OTHER than admin-dashboard.html
    // that want to check if the current browser has an active admin session.
    var currentPage = window.location.pathname.split('/').pop() || 'index.html';
    if (currentPage === 'admin-dashboard.html') {
        // Let admin-gate.js handle everything — don't interfere
        return;
    }

    // For any other page, expose a helper so scripts can check admin status
    window.getAdminRoleSession = function() {
        try {
            var s = localStorage.getItem('gerama_admin_session');
            return s ? JSON.parse(s) : null;
        } catch(e) { return null; }
    };

    window.isAdminLoggedIn = function() {
        return !!window.getAdminRoleSession();
    };

})();
