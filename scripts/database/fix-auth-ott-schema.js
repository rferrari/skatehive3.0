#!/usr/bin/env node

// Script to fix auth_ott table schema
// Run with: node fix-auth-ott-schema.js

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../../.env.local' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

async function fixAuthOttSchema() {
  console.log('🔧 Fixing auth_ott table schema...\n');

  try {
    // First, let's check the current schema
    console.log('1️⃣ Checking current auth_ott table schema...');
    
    const { data: currentData, error: selectError } = await supabase
      .from('auth_ott')
      .select('*')
      .limit(1);
    
    if (selectError && selectError.code !== 'PGRST116') { // PGRST116 = table empty
      console.error('❌ Error querying auth_ott:', selectError);
      
      // The table might not exist or have issues
      console.log('\n2️⃣ Attempting to create/fix auth_ott table...');
      
      // Use raw SQL to ensure the table exists with correct schema
      const createTableSQL = `
        CREATE TABLE IF NOT EXISTS auth_ott (
          id SERIAL PRIMARY KEY,
          token TEXT NOT NULL UNIQUE,
          username TEXT NOT NULL,
          expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          used_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
          created_by TEXT DEFAULT 'system'
        );
        
        -- Create index for faster token lookups
        CREATE INDEX IF NOT EXISTS idx_auth_ott_token ON auth_ott(token);
        CREATE INDEX IF NOT EXISTS idx_auth_ott_username ON auth_ott(username);
        CREATE INDEX IF NOT EXISTS idx_auth_ott_expires ON auth_ott(expires_at);
      `;
      
      const { error: createError } = await supabase.rpc('exec_sql', { 
        sql: createTableSQL 
      });
      
      if (createError) {
        console.error('❌ Failed to create table with RPC:', createError);
        
        // Try alternative approach - direct table operations
        console.log('\n3️⃣ Trying alternative schema fix...');
        
        // Try to add the missing column if table exists
        const { error: alterError } = await supabase.rpc('exec_sql', {
          sql: `ALTER TABLE auth_ott ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();`
        });
        
        if (alterError) {
          console.error('❌ Failed to alter table:', alterError);
          console.log('\n📋 Manual SQL to run in Supabase dashboard:');
          console.log('```sql');
          console.log(createTableSQL);
          console.log('```');
          return;
        }
      }
      
      console.log('✅ Table schema fixed!');
      
    } else {
      console.log('✅ auth_ott table exists and is accessible');
    }
    
    // Now test inserting a record
    console.log('\n4️⃣ Testing auth_ott table operations...');
    
    const testToken = `test-${Date.now()}`;
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    
    const { data: insertData, error: insertError } = await supabase
      .from('auth_ott')
      .insert({
        token: testToken,
        username: 'test-user',
        expires_at: expiresAt.toISOString(),
      })
      .select();
    
    if (insertError) {
      console.error('❌ Insert test failed:', insertError);
      console.log('\n📋 The table might need these columns:');
      console.log('- id (SERIAL PRIMARY KEY)');
      console.log('- token (TEXT NOT NULL UNIQUE)');
      console.log('- username (TEXT NOT NULL)');
      console.log('- expires_at (TIMESTAMP WITH TIME ZONE NOT NULL)');
      console.log('- created_at (TIMESTAMP WITH TIME ZONE DEFAULT NOW())');
      console.log('- used_at (TIMESTAMP WITH TIME ZONE DEFAULT NULL)');
      
    } else {
      console.log('✅ Insert test successful:', insertData);
      
      // Clean up test data
      await supabase
        .from('auth_ott')
        .delete()
        .eq('token', testToken);
      
      console.log('✅ Test data cleaned up');
    }
    
    // Test the specific query that was failing
    console.log('\n5️⃣ Testing OTT creation query...');
    
    const testOttToken = `ott-${Date.now()}`;
    const ottExpiry = new Date(Date.now() + 10 * 60 * 1000);
    
    const { error: ottError } = await supabase
      .from('auth_ott')
      .insert({
        token: testOttToken,
        username: 'test-signup-user',
        expires_at: ottExpiry.toISOString(),
        created_at: new Date().toISOString(),
      });
    
    if (ottError) {
      console.error('❌ OTT creation test failed:', ottError);
    } else {
      console.log('✅ OTT creation test successful');
      
      // Clean up
      await supabase
        .from('auth_ott')
        .delete()
        .eq('token', testOttToken);
    }
    
  } catch (error) {
    console.error('💥 Schema fix failed:', error);
  }
}

// Run if called directly
if (require.main === module) {
  fixAuthOttSchema().then(() => {
    console.log('\n🏁 Schema fix complete!');
    process.exit(0);
  }).catch(error => {
    console.error('💥 Schema fix failed:', error);
    process.exit(1);
  });
}

module.exports = { fixAuthOttSchema };