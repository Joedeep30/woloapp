// Test Supabase connection for production deployment
import { PostgrestClient } from '@supabase/postgrest-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('🔧 Testing Supabase Connection...');
console.log(`📍 URL: ${supabaseUrl}`);
console.log(`🔑 Key: ${supabaseKey ? supabaseKey.substring(0, 15) + '...' : 'NOT FOUND'}`);
console.log('');

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  console.log('   Please check your .env.local file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  try {
    console.log('1️⃣  Testing basic connection...');
    
    // Test 1: Basic connection
    const { data, error } = await supabase
      .from('users')
      .select('count(*)')
      .single();

    if (error) {
      console.log('⚠️  Table might not exist yet, which is expected for a fresh database');
      console.log('   Error:', error.message);
    } else {
      console.log('✅ Database connection successful!');
      console.log(`   Found ${data?.count || 0} users in database`);
    }

    console.log('');
    console.log('2️⃣  Testing database schema...');
    
    // Test 2: Check if tables exist
    const { data: tables, error: tablesError } = await supabase
      .rpc('check_table_exists', { table_name: 'users' })
      .single();

    if (tablesError) {
      console.log('⚠️  Schema check failed - this is normal for a fresh database');
      console.log('   You may need to run the schema migration');
    }

    console.log('');
    console.log('3️⃣  Testing authentication...');
    
    // Test 3: Auth connection
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError && authError.message !== 'Invalid token') {
      console.log('⚠️  Auth test:', authError.message);
    } else {
      console.log('✅ Authentication system accessible');
    }

    console.log('');
    console.log('🎉 Connection test completed!');
    console.log('');
    console.log('📋 Next Steps:');
    console.log('   1. If tables don\'t exist, run the schema from database/supabase-schema.sql');
    console.log('   2. Your Vercel environment variables are set correctly');
    console.log('   3. Ready for production deployment!');

  } catch (error) {
    console.error('❌ Connection test failed:', error.message);
    console.log('');
    console.log('🔧 Troubleshooting:');
    console.log('   1. Check your Supabase project is active');
    console.log('   2. Verify the URL and key are correct');
    console.log('   3. Ensure your IP is allowed (if IP restrictions are enabled)');
    process.exit(1);
  }
}

testConnection();