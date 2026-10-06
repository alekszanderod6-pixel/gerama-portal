/**
 * GERAMA ADMIN PORTAL VERIFICATION SCRIPT
 * 
 * Run this in the browser console on admin-dashboard.html
 * Tests all admin portal functionality
 * 
 * HOW TO USE:
 * 1. Open admin-dashboard.html
 * 2. Press F12 (open console)
 * 3. Copy and paste this entire script
 * 4. Press Enter
 * 5. Review the test results
 */

(async function() {
    console.log('═══════════════════════════════════════════════════════════');
    console.log('🔍 GERAMA ADMIN PORTAL VERIFICATION');
    console.log('═══════════════════════════════════════════════════════════\n');

    const results = {
        passed: 0,
        failed: 0,
        warnings: 0,
        tests: []
    };

    function test(name, passed, details = '') {
        const status = passed ? '✅ PASS' : '❌ FAIL';
        const result = { name, passed, details };
        results.tests.push(result);
        
        if (passed) {
            results.passed++;
            console.log(`${status}: ${name}`);
        } else {
            results.failed++;
            console.error(`${status}: ${name}`);
        }
        
        if (details) {
            console.log(`   ${details}`);
        }
    }

    function warn(name, message) {
        results.warnings++;
        console.warn(`⚠️  WARNING: ${name}`);
        console.log(`   ${message}`);
    }

    // ─────────────────────────────────────────────────────────────────
    // TEST 1: Supabase Connection
    // ─────────────────────────────────────────────────────────────────
    console.log('\n1️⃣  Testing Supabase Connection...');
    
    test(
        'Supabase client loaded',
        typeof window.geramaSupabase !== 'undefined',
        window.geramaSupabase ? 'Client is initialized' : 'Client not found'
    );

    // ─────────────────────────────────────────────────────────────────
    // TEST 2: Admin Authentication
    // ─────────────────────────────────────────────────────────────────
    console.log('\n2️⃣  Testing Admin Authentication...');
    
    try {
        const { data: { session } } = await window.geramaSupabase.auth.getSession();
        test(
            'User session active',
            !!session,
            session ? `Logged in as: ${session.user.email}` : 'No active session'
        );

        if (session) {
            test(
                'Session email exists',
                !!session.user.email,
                session.user.email
            );
        }
    } catch (error) {
        test('User session check', false, `Error: ${error.message}`);
    }

    // ─────────────────────────────────────────────────────────────────
    // TEST 3: Admin Role Check
    // ─────────────────────────────────────────────────────────────────
    console.log('\n3️⃣  Testing Admin Role System...');
    
    test(
        'Admin role check script loaded',
        typeof window.getAdminRole === 'function',
        'admin-role-check.js is loaded'
    );

    test(
        'Section access check function exists',
        typeof window.canAccessSection === 'function',
        'Access control functions available'
    );

    const currentRole = window.GERAMA_ADMIN_ROLE;
    test(
        'Admin role is set',
        !!currentRole,
        currentRole ? `Current role: ${currentRole}` : 'Role not set'
    );

    if (currentRole) {
        console.log(`   📋 Your role: ${currentRole}`);
        if (currentRole === 'materials_admin') {
            console.log('   🔒 Limited access to: Upload Materials, Upload Software, Materials History, Review Submissions, Announcements');
        } else {
            console.log('   🔓 Full admin access');
        }
    }

    // ─────────────────────────────────────────────────────────────────
    // TEST 4: Navigation Elements
    // ─────────────────────────────────────────────────────────────────
    console.log('\n4️⃣  Testing Navigation Elements...');
    
    const navItems = document.querySelectorAll('.nav-item');
    test(
        'Sidebar navigation exists',
        navItems.length > 0,
        `Found ${navItems.length} navigation items`
    );

    const visibleNavItems = Array.from(navItems).filter(item => 
        item.style.display !== 'none' && 
        window.getComputedStyle(item).display !== 'none'
    );
    
    console.log(`   Visible nav items: ${visibleNavItems.length}`);
    visibleNavItems.forEach(item => {
        const panel = item.getAttribute('data-panel');
        console.log(`     - ${panel}`);
    });

    // ─────────────────────────────────────────────────────────────────
    // TEST 5: Dashboard Panels
    // ─────────────────────────────────────────────────────────────────
    console.log('\n5️⃣  Testing Dashboard Panels...');
    
    const panels = document.querySelectorAll('.panel');
    test(
        'Dashboard panels exist',
        panels.length > 0,
        `Found ${panels.length} panels`
    );

    const activePanel = document.querySelector('.panel.active');
    test(
        'Active panel exists',
        !!activePanel,
        activePanel ? `Active: ${activePanel.id}` : 'No active panel'
    );

    // ─────────────────────────────────────────────────────────────────
    // TEST 6: Database Access Tests
    // ─────────────────────────────────────────────────────────────────
    console.log('\n6️⃣  Testing Database Access...');
    
    // Test users table access
    try {
        const { count, error } = await window.geramaSupabase
            .from('users')
            .select('id', { count: 'exact', head: true });
        
        test(
            'Users table accessible',
            !error,
            error ? `Error: ${error.message}` : `Found ${count} users`
        );
    } catch (error) {
        test('Users table access', false, `Error: ${error.message}`);
    }

    // Test announcements table access
    try {
        const { count, error } = await window.geramaSupabase
            .from('announcements')
            .select('id', { count: 'exact', head: true });
        
        test(
            'Announcements table accessible',
            !error,
            error ? `Error: ${error.message}` : `Found ${count} announcements`
        );
    } catch (error) {
        test('Announcements table access', false, `Error: ${error.message}`);
    }

    // Test materials table access
    try {
        const { count, error } = await window.geramaSupabase
            .from('materials')
            .select('id', { count: 'exact', head: true });
        
        test(
            'Materials table accessible',
            !error,
            error ? `Error: ${error.message}` : `Found ${count} materials`
        );
    } catch (error) {
        test('Materials table access', false, `Error: ${error.message}`);
    }

    // Test page_views table access
    try {
        const { count, error } = await window.geramaSupabase
            .from('page_views')
            .select('id', { count: 'exact', head: true });
        
        test(
            'Page views table accessible',
            !error,
            error ? `Error: ${error.message}` : `Found ${count} page views`
        );
    } catch (error) {
        test('Page views table access', false, `Error: ${error.message}`);
    }

    // Test admin_users table access
    try {
        const { count, error } = await window.geramaSupabase
            .from('admin_users')
            .select('id', { count: 'exact', head: true });
        
        test(
            'Admin users table accessible',
            !error,
            error ? `Error: ${error.message}` : `Found ${count} admin users`
        );
    } catch (error) {
        test('Admin users table access', false, `Error: ${error.message}`);
    }

    // ─────────────────────────────────────────────────────────────────
    // TEST 7: Critical Functions
    // ─────────────────────────────────────────────────────────────────
    console.log('\n7️⃣  Testing Critical Functions...');
    
    test(
        'Panel switching function exists',
        typeof window.switchPanel === 'function',
        'switchPanel() is available'
    );

    test(
        'Refresh stats function exists',
        typeof window.refreshDashStats === 'function',
        'refreshDashStats() is available'
    );

    // ─────────────────────────────────────────────────────────────────
    // TEST 8: Portal Traffic Stats
    // ─────────────────────────────────────────────────────────────────
    console.log('\n8️⃣  Testing Portal Traffic Statistics...');
    
    const todayEl = document.getElementById('statVisitsToday');
    const weekEl = document.getElementById('statVisitsWeek');
    const totalEl = document.getElementById('statVisitsTotal');
    
    test(
        'Traffic stat elements exist',
        !!(todayEl && weekEl && totalEl),
        'All stat display elements found'
    );

    if (totalEl) {
        const totalValue = totalEl.textContent.trim();
        test(
            'Total visits value set',
            totalValue && totalValue !== '–' && totalValue !== '0',
            `Current value: ${totalValue}`
        );

        if (totalValue === '20104') {
            warn(
                'Traffic stats may be stuck',
                'Total visits is exactly 20104 - run fix-portal-traffic-stats.sql'
            );
        }
    }

    // ─────────────────────────────────────────────────────────────────
    // TEST 9: Dashboard Stats Cards
    // ─────────────────────────────────────────────────────────────────
    console.log('\n9️⃣  Testing Dashboard Stats Cards...');
    
    const dashCards = document.querySelectorAll('.dash-card');
    test(
        'Dashboard stat cards exist',
        dashCards.length > 0,
        `Found ${dashCards.length} stat cards`
    );

    // ─────────────────────────────────────────────────────────────────
    // TEST 10: Materials Admin Specific
    // ─────────────────────────────────────────────────────────────────
    if (currentRole === 'materials_admin') {
        console.log('\n🔟 Testing Materials Admin Restrictions...');
        
        const restrictedPanels = [
            'overview', 'members', 'assignments', 'grades', 
            'quizzes', 'requests', 'classes', 'activities', 'gallery', 'help'
        ];
        
        restrictedPanels.forEach(panelName => {
            const navItem = document.querySelector(`[data-panel="${panelName}"]`);
            if (navItem) {
                const isHidden = navItem.style.display === 'none' || 
                               window.getComputedStyle(navItem).display === 'none';
                test(
                    `${panelName} panel is hidden`,
                    isHidden,
                    isHidden ? 'Properly restricted' : '⚠️ Should be hidden'
                );
            }
        });

        const allowedPanels = ['upload', 'software', 'history', 'review', 'announcements'];
        allowedPanels.forEach(panelName => {
            const navItem = document.querySelector(`[data-panel="${panelName}"]`);
            if (navItem) {
                const isVisible = navItem.style.display !== 'none' && 
                                window.getComputedStyle(navItem).display !== 'none';
                test(
                    `${panelName} panel is visible`,
                    isVisible,
                    isVisible ? 'Properly accessible' : '❌ Should be visible'
                );
            }
        });
    }

    // ─────────────────────────────────────────────────────────────────
    // FINAL SUMMARY
    // ─────────────────────────────────────────────────────────────────
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('📊 TEST SUMMARY');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`✅ Passed: ${results.passed}`);
    console.log(`❌ Failed: ${results.failed}`);
    console.log(`⚠️  Warnings: ${results.warnings}`);
    console.log(`📊 Total Tests: ${results.tests.length}`);
    
    const passRate = (results.passed / results.tests.length * 100).toFixed(1);
    console.log(`📈 Pass Rate: ${passRate}%`);
    
    console.log('\n═══════════════════════════════════════════════════════════');
    
    if (results.failed === 0 && results.warnings === 0) {
        console.log('🎉 ALL SYSTEMS OPERATIONAL!');
        console.log('✅ Admin portal is working perfectly!');
    } else if (results.failed === 0) {
        console.log('✅ All tests passed!');
        console.log(`⚠️  ${results.warnings} warning(s) to review`);
    } else {
        console.log('❌ Some tests failed. Review the details above.');
        console.log('\nFailed tests:');
        results.tests
            .filter(t => !t.passed)
            .forEach(t => console.log(`  - ${t.name}: ${t.details}`));
    }
    
    console.log('═══════════════════════════════════════════════════════════\n');
    
    // Return results for programmatic access
    return results;
})();
