#!/usr/bin/env node

// Script to inspect the actual auth_ott table schema
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../../.env.local' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function inspectSchema() {
  console.log('🔍 Inspecting auth_ott table schema...\n');

  try {
    // Get table information using information_schema
    const { data, error } = await supabase
      .rpc('exec_sql', {
        sql: `
          SELECT 
            column_name,
            data_type,
            is_nullable,
            column_default
          FROM information_schema.columns 
          WHERE table_name = 'auth_ott' 
          AND table_schema = 'public'
          ORDER BY ordinal_position;
        `
      });

    if (error) {
      console.error('❌ Failed to get schema info:', error);
      
      // Try alternative method - describe table
      const { data: describeData, error: describeError } = await supabase
        .rpc('exec_sql', {
          sql: `SELECT * FROM auth_ott LIMIT 0;`
        });
        
      if (describeError) {
        console.error('❌ Failed to describe table:', describeError);
        console.log('\n💡 You may need to create the auth_ott table manually in Supabase dashboard');
      } else {
        console.log('✅ Table exists but schema query failed');
      }
      
      return;
    }

    if (!data || data.length === 0) {
      console.log('⚠️  No columns found for auth_ott table');
      console.log('📋 Required columns for the signup system:');
      console.log('```sql');
      console.log(`CREATE TABLE auth_ott (
  id SERIAL PRIMARY KEY,
  token TEXT NOT NULL UNIQUE,
  username TEXT NOT NULL, 
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  used_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
);`);
      console.log('```');
      return;
    }

    console.log('📋 Current auth_ott table schema:');
    console.log('+-----------------+------------------+----------+---------+');
    console.log('| Column Name     | Data Type        | Nullable | Default |');
    console.log('+-----------------+------------------+----------+---------+');
    
    data.forEach(col => {
      const name = (col.column_name || '').padEnd(15);
      const type = (col.data_type || '').padEnd(16);
      const nullable = (col.is_nullable || '').padEnd(8);
      const defaultVal = (col.column_default || 'NULL').padEnd(7);
      console.log(`| ${name} | ${type} | ${nullable} | ${defaultVal} |`);
    });
    console.log('+-----------------+------------------+----------+---------+');

    // Compare with expected schema
    const expectedColumns = ['id', 'token', 'username', 'expires_at', 'created_at', 'used_at'];
    const actualColumns = data.map(col => col.column_name);
    
    console.log('\n🔍 Schema Analysis:');
    expectedColumns.forEach(expectedCol => {
      if (actualColumns.includes(expectedCol)) {
        console.log(`✅ ${expectedCol} - Found`);
      } else {
        console.log(`❌ ${expectedCol} - Missing`);
      }
    });

    const extraColumns = actualColumns.filter(col => !expectedColumns.includes(col));
    if (extraColumns.length > 0) {
      console.log(`\n🔄 Extra columns found: ${extraColumns.join(', ')}`);
    }

  } catch (error) {
    console.error('💥 Schema inspection failed:', error);
  }
}

inspectSchema().then(() => {
  console.log('\n🏁 Schema inspection complete!');
  process.exit(0);
});