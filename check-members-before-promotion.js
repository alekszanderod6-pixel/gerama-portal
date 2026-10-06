// Quick check: See current member levels before promotion
// Run: node check-members-before-promotion.js

const SUPABASE_URL = 'https://obfhmyeghurqfxingwtu.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9iZmhteWVnaHVycWZ4aW5nd3R1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU3OTIxODMsImV4cCI6MjEwMTM2ODE4M30.mAgIHzhodRXTya-BfhA_ZLD2eoeshle79Zx6isKbXj4';

async function checkMembers() {
  console.log('🔍 Checking current member levels...\n');
  
  try {
    // Fetch all user profiles
    const response = await fetch(`${SUPABASE_URL}/rest/v1/user_profiles?select=email,full_name,level,program&order=level`, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      }
    });
    
    if (!response.ok) {
      console.error('❌ Error:', response.status, response.statusText);
      return;
    }
    
    const members = await response.json();
    
    if (!members || members.length === 0) {
      console.log('⚠️  No members found in database');
      return;
    }
    
    console.log(`✅ Found ${members.length} members total\n`);
    
    // Count by level
    const levelCounts = {};
    members.forEach(m => {
      const level = m.level || 'Unknown';
      levelCounts[level] = (levelCounts[level] || 0) + 1;
    });
    
    console.log('📊 Current Distribution:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const order = ['L100', 'L200', 'L300', 'L400', 'Graduate', 'Alumni'];
    order.forEach(level => {
      if (levelCounts[level]) {
        const nextLevel = level === 'L100' ? 'L200' : 
                         level === 'L200' ? 'L300' :
                         level === 'L300' ? 'L400' :
                         level === 'L400' ? 'Graduate' : 
                         level;
        const arrow = nextLevel !== level ? ` → ${nextLevel}` : ' (no change)';
        console.log(`${level.padEnd(10)} : ${String(levelCounts[level]).padStart(3)} students ${arrow}`);
      }
    });
    
    // Show other levels if any
    Object.keys(levelCounts).forEach(level => {
      if (!order.includes(level)) {
        console.log(`${level.padEnd(10)} : ${String(levelCounts[level]).padStart(3)} students (no change)`);
      }
    });
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    // Show summary of what will change
    const willPromote = ['L100', 'L200', 'L300', 'L400'];
    const totalToPromote = willPromote.reduce((sum, level) => sum + (levelCounts[level] || 0), 0);
    
    console.log('📋 Promotion Summary:');
    console.log(`   ${totalToPromote} students will be promoted`);
    console.log(`   ${levelCounts['Graduate'] || 0} graduates (no change)`);
    console.log(`   ${levelCounts['Alumni'] || 0} alumni (no change)\n`);
    
    // Show some sample students per level
    console.log('👥 Sample Students by Level:\n');
    
    willPromote.forEach(level => {
      const studentsInLevel = members.filter(m => m.level === level);
      if (studentsInLevel.length > 0) {
        const nextLevel = level === 'L100' ? 'L200' : 
                         level === 'L200' ? 'L300' :
                         level === 'L300' ? 'L400' : 'Graduate';
        console.log(`${level} → ${nextLevel} (${studentsInLevel.length} students):`);
        studentsInLevel.slice(0, 3).forEach(s => {
          console.log(`   • ${s.full_name || s.email} (${s.program || 'No program'})`);
        });
        if (studentsInLevel.length > 3) {
          console.log(`   ... and ${studentsInLevel.length - 3} more\n`);
        } else {
          console.log('');
        }
      }
    });
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Ready to promote!');
    console.log('\n📝 Next steps:');
    console.log('   1. Review the distribution above');
    console.log('   2. Open Supabase Dashboard → SQL Editor');
    console.log('   3. Run: promote-members-levels.sql');
    console.log('   4. First run PREVIEW queries to double-check');
    console.log('   5. Then run EXECUTE section to promote all\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkMembers();
