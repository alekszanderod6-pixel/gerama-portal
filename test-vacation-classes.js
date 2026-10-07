// ══════════════════════════════════════════════════════════════════
// GERAMA VACATION CLASSES - AUTOMATED TEST SCRIPT
// Run in browser console after setting up database
// ══════════════════════════════════════════════════════════════════

console.log('🎓 GERAMA Vacation Classes - Test Suite');
console.log('═══════════════════════════════════════════════════════════');

// Wait for Supabase to be available
async function waitForSupabase() {
    return new Promise((resolve) => {
        const checkInterval = setInterval(() => {
            if (window.supabase && window.ENV_CONFIG) {
                clearInterval(checkInterval);
                resolve();
            }
        }, 100);
        
        // Timeout after 10 seconds
        setTimeout(() => {
            clearInterval(checkInterval);
            console.error('❌ Timeout: Supabase not available');
            resolve();
        }, 10000);
    });
}

// Test functions
async function runTests() {
    await waitForSupabase();
    
    if (!window.supabase || !window.ENV_CONFIG) {
        console.error('❌ Supabase not initialized');
        return;
    }
    
    const supabase = window.supabase.createClient(
        window.ENV_CONFIG.SUPABASE_URL,
        window.ENV_CONFIG.SUPABASE_ANON_KEY
    );
    
    console.log('\n📋 Test 1: Check vacation_classes table exists');
    try {
        const { data, error } = await supabase
            .from('vacation_classes')
            .select('count')
            .limit(1);
        
        if (error) throw error;
        console.log('✅ vacation_classes table exists');
    } catch (error) {
        console.error('❌ vacation_classes table missing:', error.message);
        console.log('💡 Run vacation-classes-schedule.sql in Supabase');
    }
    
    console.log('\n📋 Test 2: Check vacation_schedule_settings table exists');
    try {
        const { data, error } = await supabase
            .from('vacation_schedule_settings')
            .select('count')
            .limit(1);
        
        if (error) throw error;
        console.log('✅ vacation_schedule_settings table exists');
    } catch (error) {
        console.error('❌ vacation_schedule_settings table missing:', error.message);
        console.log('💡 Run vacation-classes-schedule.sql in Supabase');
    }
    
    console.log('\n📋 Test 3: Check for sample data');
    try {
        const { data, error } = await supabase
            .from('vacation_classes')
            .select('*')
            .limit(5);
        
        if (error) throw error;
        
        if (data && data.length > 0) {
            console.log(`✅ Found ${data.length} classes`);
            console.log('📝 Sample classes:');
            data.forEach(cls => {
                console.log(`   - ${cls.course_name} (${cls.class_date} at ${cls.start_time})`);
            });
        } else {
            console.log('⚠️  No classes found (but table exists)');
            console.log('💡 Sample data will be added by vacation-classes-schedule.sql');
        }
    } catch (error) {
        console.error('❌ Error loading classes:', error.message);
    }
    
    console.log('\n📋 Test 4: Check todays_classes view');
    try {
        const { data, error } = await supabase
            .from('todays_classes')
            .select('*');
        
        if (error) throw error;
        
        if (data && data.length > 0) {
            console.log(`✅ Today's classes: ${data.length} class(es)`);
            data.forEach(cls => {
                console.log(`   - ${cls.course_name} at ${cls.time_range}`);
            });
        } else {
            console.log('ℹ️  No classes scheduled for today');
        }
    } catch (error) {
        console.error('❌ todays_classes view error:', error.message);
        console.log('💡 Run vacation-classes-schedule.sql to create view');
    }
    
    console.log('\n📋 Test 5: Check storage bucket exists');
    try {
        const { data, error } = await supabase.storage
            .from('timetables')
            .list('', { limit: 1 });
        
        if (error && error.statusCode === '404') {
            console.log('⚠️  Storage bucket "timetables" not found');
            console.log('💡 Run setup-vacation-storage.sql to create it');
        } else if (error) {
            console.error('❌ Storage error:', error.message);
        } else {
            console.log('✅ Storage bucket "timetables" exists');
        }
    } catch (error) {
        console.error('❌ Storage test failed:', error.message);
    }
    
    console.log('\n📋 Test 6: Check widget loaded on page');
    const widget = document.getElementById('vacationClassesWidget');
    if (widget) {
        console.log('✅ Vacation classes widget loaded on page');
    } else {
        console.log('⚠️  Widget not found on this page');
        console.log('💡 Widget only loads on homepage (index.html)');
    }
    
    console.log('\n📋 Test 7: Check navigation links');
    const navLinks = document.querySelectorAll('a[href*="vacation-classes"]');
    if (navLinks.length > 0) {
        console.log(`✅ Found ${navLinks.length} vacation classes link(s) in navigation`);
    } else {
        console.log('⚠️  No vacation classes links found in navigation');
    }
    
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('🎉 Test suite completed!');
    console.log('\n📖 Next steps:');
    console.log('1. If any tests failed, run the SQL scripts in Supabase:');
    console.log('   - vacation-classes-schedule.sql (creates tables & sample data)');
    console.log('   - setup-vacation-storage.sql (creates storage bucket)');
    console.log('2. Visit /vacation-classes.html to see the public page');
    console.log('3. Visit /admin-vacation-classes.html to manage classes');
    console.log('═══════════════════════════════════════════════════════════');
}

// Auto-run tests
runTests();
