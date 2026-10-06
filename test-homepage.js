/**
 * GERAMA HOMEPAGE VERIFICATION SCRIPT
 * 
 * Run this in the browser console on index.html (homepage)
 * Tests all homepage functionality
 * 
 * HOW TO USE:
 * 1. Open index.html (homepage)
 * 2. Press F12 (open console)
 * 3. Copy and paste this entire script
 * 4. Press Enter
 * 5. Review the test results
 */

(async function() {
    console.log('═══════════════════════════════════════════════════════════');
    console.log('🏠 GERAMA HOMEPAGE VERIFICATION');
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
    // TEST 1: Page Structure
    // ─────────────────────────────────────────────────────────────────
    console.log('\n1️⃣  Testing Page Structure...');
    
    test(
        'Header exists',
        !!document.querySelector('.site-header'),
        'Site header is present'
    );

    test(
        'Hero section exists',
        !!document.querySelector('.hero-area'),
        'Hero area is present'
    );

    test(
        'Footer exists',
        !!document.querySelector('.site-footer'),
        'Site footer is present'
    );

    // ─────────────────────────────────────────────────────────────────
    // TEST 2: Supabase Connection
    // ─────────────────────────────────────────────────────────────────
    console.log('\n2️⃣  Testing Supabase Connection...');
    
    test(
        'Supabase client loaded',
        typeof window.geramaSupabase !== 'undefined',
        window.geramaSupabase ? 'Client is initialized' : 'Client not found'
    );

    test(
        'Supabase config loaded',
        !!window.GERAMA_SECRET_CODE,
        window.GERAMA_SECRET_CODE ? `Secret code: ${window.GERAMA_SECRET_CODE}` : 'Config not loaded'
    );

    // ─────────────────────────────────────────────────────────────────
    // TEST 3: Announcements Section
    // ─────────────────────────────────────────────────────────────────
    console.log('\n3️⃣  Testing Announcements Section...');
    
    const announcementsContainer = document.getElementById('announcementsContainer');
    test(
        'Announcements container exists',
        !!announcementsContainer,
        'Container element found'
    );

    if (announcementsContainer) {
        const announcementCards = announcementsContainer.querySelectorAll('.ann-card');
        test(
            'Announcements are loaded',
            announcementCards.length > 0,
            `Found ${announcementCards.length} announcement(s)`
        );

        if (announcementCards.length === 0) {
            warn(
                'No announcements displayed',
                'Either no announcements exist in database, or loading failed. Check console for [GERAMA Announcements] logs.'
            );
        }

        // Check for skeleton/loading state
        const hasSkeleton = announcementsContainer.innerHTML.includes('skeleton') ||
                          announcementsContainer.innerHTML.includes('pointer-events:none');
        if (hasSkeleton) {
            warn(
                'Announcements still loading',
                'Skeleton cards are still showing. Wait a few seconds and run test again.'
            );
        }
    }

    // Check localStorage cache
    const cachedAnnouncements = localStorage.getItem('gerama_announcements');
    if (cachedAnnouncements) {
        try {
            const announcements = JSON.parse(cachedAnnouncements);
            test(
                'Announcements cached',
                Array.isArray(announcements),
                `${announcements.length} announcement(s) in cache`
            );
        } catch (e) {
            test('Announcements cache valid', false, 'Cache is corrupted');
        }
    } else {
        warn('No announcements cache', 'Announcements will load from database each time');
    }

    // ─────────────────────────────────────────────────────────────────
    // TEST 4: Database Access
    // ─────────────────────────────────────────────────────────────────
    console.log('\n4️⃣  Testing Database Access...');
    
    try {
        const { data, error, count } = await window.geramaSupabase
            .from('announcements')
            .select('*', { count: 'exact' })
            .order('created_at', { ascending: false })
            .limit(5);
        
        test(
            'Announcements query successful',
            !error,
            error ? `Error: ${error.message}` : `Retrieved ${count} total announcement(s)`
        );

        if (data && data.length > 0) {
            console.log('\n   Latest announcements:');
            data.forEach((ann, idx) => {
                console.log(`   ${idx + 1}. ${ann.title} (${new Date(ann.created_at).toLocaleDateString()})`);
            });
        } else if (!error) {
            warn(
                'No announcements in database',
                'Add some announcements in the admin dashboard'
            );
        }
    } catch (error) {
        test('Announcements database query', false, `Exception: ${error.message}`);
    }

    // Test page views tracking
    try {
        const { data, error } = await window.geramaSupabase
            .from('page_views')
            .select('id', { count: 'exact', head: true })
            .limit(1);
        
        test(
            'Page views table accessible',
            !error,
            error ? `Error: ${error.message}` : 'Can read page_views table'
        );
    } catch (error) {
        test('Page views access', false, `Exception: ${error.message}`);
    }

    // ─────────────────────────────────────────────────────────────────
    // TEST 5: Navigation & Links
    // ─────────────────────────────────────────────────────────────────
    console.log('\n5️⃣  Testing Navigation & Links...');
    
    const headerNav = document.querySelector('.header-nav');
    test(
        'Header navigation exists',
        !!headerNav,
        headerNav ? `Has ${headerNav.querySelectorAll('a').length} links` : 'Nav not found'
    );

    const criticalLinks = [
        { selector: 'a[href="index.html"], a[href="/"]', name: 'Home link' },
        { selector: 'a[href="dashboard.html"]', name: 'Dashboard link' },
        { selector: 'a[href="classroom.html"]', name: 'Classroom link' },
        { selector: 'a[href="connect.html"]', name: 'Connect link' }
    ];

    criticalLinks.forEach(({ selector, name }) => {
        const link = document.querySelector(selector);
        test(
            `${name} exists`,
            !!link,
            link ? `Points to: ${link.href}` : 'Link not found'
        );
    });

    // ─────────────────────────────────────────────────────────────────
    // TEST 6: Hero Section
    // ─────────────────────────────────────────────────────────────────
    console.log('\n6️⃣  Testing Hero Section...');
    
    const heroTitle = document.querySelector('.hero-area h1');
    test(
        'Hero title exists',
        !!heroTitle,
        heroTitle ? `Title: ${heroTitle.textContent.substring(0, 50)}...` : 'Title not found'
    );

    const heroCTA = document.querySelector('.hero-area .cta-btn, .hero-area a[href*="dashboard"]');
    test(
        'Hero CTA button exists',
        !!heroCTA,
        heroCTA ? 'Call-to-action button found' : 'CTA not found'
    );

    // ─────────────────────────────────────────────────────────────────
    // TEST 7: Features/Services Section
    // ─────────────────────────────────────────────────────────────────
    console.log('\n7️⃣  Testing Features Section...');
    
    const featureCards = document.querySelectorAll('.feature-card, .service-card');
    test(
        'Feature cards exist',
        featureCards.length > 0,
        `Found ${featureCards.length} feature card(s)`
    );

    // ─────────────────────────────────────────────────────────────────
    // TEST 8: Stats/Numbers Section
    // ─────────────────────────────────────────────────────────────────
    console.log('\n8️⃣  Testing Stats Section...');
    
    const statsSection = document.querySelector('.stats-section, .numbers-section');
    if (statsSection) {
        test('Stats section exists', true, 'Statistics section found');
        const statNumbers = statsSection.querySelectorAll('.stat-number, .number');
        console.log(`   Found ${statNumbers.length} stat number(s)`);
    } else {
        test('Stats section exists', false, 'No statistics section found');
    }

    // ─────────────────────────────────────────────────────────────────
    // TEST 9: Responsive Design Elements
    // ─────────────────────────────────────────────────────────────────
    console.log('\n9️⃣  Testing Responsive Elements...');
    
    const menuToggle = document.querySelector('.menu-toggle, .menu-toggle-btn');
    test(
        'Mobile menu toggle exists',
        !!menuToggle,
        menuToggle ? 'Mobile navigation supported' : 'No mobile menu found'
    );

    const viewport = {
        width: window.innerWidth,
        height: window.innerHeight
    };
    
    console.log(`   Viewport: ${viewport.width}x${viewport.height}`);
    if (viewport.width < 768) {
        console.log('   📱 Mobile view detected');
    } else if (viewport.width < 1024) {
        console.log('   📱 Tablet view detected');
    } else {
        console.log('   🖥️  Desktop view detected');
    }

    // ─────────────────────────────────────────────────────────────────
    // TEST 10: JavaScript Functionality
    // ─────────────────────────────────────────────────────────────────
    console.log('\n🔟 Testing JavaScript Functions...');
    
    test(
        'Main.js functions loaded',
        typeof window.initGerama !== 'undefined' || typeof window.geramaApp !== 'undefined',
        'Core app functions available'
    );

    // ─────────────────────────────────────────────────────────────────
    // TEST 11: Console Logs Check
    // ─────────────────────────────────────────────────────────────────
    console.log('\n1️⃣1️⃣  Checking Console for Errors...');
    
    // Check for announcement loading logs
    const hasAnnouncementLogs = performance.getEntriesByType && 
        console.log.toString().includes('[GERAMA Announcements]');
    
    if (hasAnnouncementLogs) {
        console.log('   Look above for [GERAMA Announcements] logs');
        console.log('   These show the announcement loading process');
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
        console.log('🎉 HOMEPAGE IS PERFECT!');
        console.log('✅ All systems operational!');
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
