// Quick test script to check Supabase announcements
// Run with: node test-db-connection.js

const SUPABASE_URL = 'https://obfhmyeghurqfxingwtu.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9iZmhteWVnaHVycWZ4aW5nd3R1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU3OTIxODMsImV4cCI6MjEwMTM2ODE4M30.mAgIHzhodRXTya-BfhA_ZLD2eoeshle79Zx6isKbXj4';

// Simple fetch test (no dependencies needed)
async function testAnnouncements() {
  console.log('🔍 Testing GERAMA Announcements...\n');
  
  try {
    console.log('📡 Connecting to Supabase...');
    console.log(`   URL: ${SUPABASE_URL}`);
    
    const response = await fetch(`${SUPABASE_URL}/rest/v1/announcements?select=*&order=created_at.desc&limit=50`, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      }
    });
    
    console.log(`   Status: ${response.status} ${response.statusText}\n`);
    
    if (!response.ok) {
      const error = await response.text();
      console.error('❌ Error:', error);
      
      if (response.status === 404) {
        console.log('\n💡 Solution: The announcements table may not exist.');
        console.log('   Run fix-announcements-rls.sql in your Supabase SQL Editor.\n');
      } else if (response.status === 401 || response.status === 403) {
        console.log('\n💡 Solution: Row Level Security (RLS) may be blocking access.');
        console.log('   Run fix-announcements-rls.sql to add the correct policies.\n');
      }
      return;
    }
    
    const data = await response.json();
    
    if (!data || data.length === 0) {
      console.log('⚠️  No announcements found in database\n');
      console.log('💡 Solution: Create a test announcement');
      console.log('   1. Open admin-dashboard.html');
      console.log('   2. Go to Announcements section');
      console.log('   3. Create and publish a test announcement\n');
      return;
    }
    
    console.log(`✅ Success! Found ${data.length} announcement${data.length !== 1 ? 's' : ''}\n`);
    console.log('📢 Announcements:\n');
    
    data.forEach((ann, idx) => {
      const date = ann.created_at ? new Date(ann.created_at).toLocaleDateString('en-GB') : 'No date';
      console.log(`   ${idx + 1}. ${ann.title || 'Untitled'}`);
      console.log(`      Priority: ${ann.priority || 'normal'} | Date: ${date}`);
      if (ann.message) {
        const preview = ann.message.length > 60 ? ann.message.substring(0, 60) + '...' : ann.message;
        console.log(`      Message: ${preview}`);
      }
      console.log('');
    });
    
    console.log('🎉 Announcements are accessible! If not showing on homepage:');
    console.log('   - Open index.html in browser');
    console.log('   - Press F12 to open Developer Tools');
    console.log('   - Check Console tab for JavaScript errors');
    console.log('   - Try clearing browser cache (Ctrl+Shift+Delete)\n');
    
  } catch (error) {
    console.error('❌ Exception:', error.message);
    
    if (error.code === 'ENOTFOUND' || error.cause?.code === 'ENOTFOUND') {
      console.log('\n💡 Solution: Check your internet connection');
      console.log('   The script needs internet access to reach Supabase.\n');
    }
  }
}

testAnnouncements();
