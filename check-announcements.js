/**
 * Quick script to check announcements in Supabase
 * Run this in browser console on any page of the site
 */

(async function() {
    console.log('🔍 Checking announcements...\n');
    
    // Wait for Supabase to load
    let attempts = 0;
    while (!window.geramaSupabase && attempts < 20) {
        await new Promise(resolve => setTimeout(resolve, 200));
        attempts++;
    }
    
    if (!window.geramaSupabase) {
        console.error('❌ Supabase not loaded');
        return;
    }
    
    console.log('✅ Supabase loaded\n');
    
    // Check announcements table
    const { data, error, count } = await window.geramaSupabase
        .from('announcements')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });
    
    if (error) {
        console.error('❌ Error fetching announcements:', error);
        return;
    }
    
    console.log(`📊 Total announcements in database: ${count}`);
    
    if (data && data.length > 0) {
        console.log('\n📢 Latest 5 announcements:');
        data.slice(0, 5).forEach((ann, idx) => {
            console.log(`\n${idx + 1}. ${ann.title}`);
            console.log(`   ID: ${ann.id}`);
            console.log(`   Date: ${new Date(ann.created_at).toLocaleDateString()}`);
            console.log(`   Message: ${ann.message ? ann.message.substring(0, 80) + '...' : 'No message'}`);
        });
    } else {
        console.log('\n⚠️ No announcements found in database');
        console.log('Solution: Add some announcements via the admin dashboard');
    }
    
    console.log('\n✅ Check complete!');
})();
