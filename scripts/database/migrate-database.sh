#!/bin/bash

# Skatehive VIP Signup System - Database Migration Script
# This script migrates the database to be compatible with all 3 repositories

set -e  # Exit on any error

echo "🚀 Starting Skatehive VIP Signup Database Migration"

# Check if required environment variables are set
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo "❌ Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables must be set"
    exit 1
fi

if [ -z "$VIP_PEPPER" ]; then
    echo "❌ Error: VIP_PEPPER environment variable must be set"
    exit 1
fi

echo "✅ Environment variables validated"

# 1. Run SQL migration to add missing columns
echo "📊 Step 1: Running database schema migration..."
echo "Please run the following SQL commands in your Supabase dashboard SQL editor:"
echo ""
echo "-- Add missing columns to vip_codes"
echo "ALTER TABLE vip_codes ADD COLUMN IF NOT EXISTS code_id TEXT;"
echo "ALTER TABLE vip_codes ADD COLUMN IF NOT EXISTS secret_hash TEXT;"
echo "ALTER TABLE vip_codes ADD COLUMN IF NOT EXISTS reserved_username TEXT;"
echo ""
echo "-- Add missing columns to other tables"
echo "ALTER TABLE signup_sessions ADD COLUMN IF NOT EXISTS signup_token UUID;"
echo "ALTER TABLE signup_sessions ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;"
echo "ALTER TABLE vip_code_uses ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;"
echo ""
echo "-- Update signup_token to use id if not set"
echo "UPDATE signup_sessions SET signup_token = id WHERE signup_token IS NULL;"
echo ""
echo "-- Extract code_id from existing codes"
echo "UPDATE vip_codes SET code_id = split_part(code, '-', 1) WHERE code_id IS NULL AND code IS NOT NULL;"
echo ""
echo "Press Enter after running these SQL commands to continue..."
read -p ""

# 2. Check migration API status
echo "📊 Step 2: Checking migration status..."
MIGRATION_STATUS=$(curl -s -X GET "${NEXT_PUBLIC_APP_URL:-http://localhost:3000}/api/signup/migrate-vip-codes" || echo "")

if [[ $MIGRATION_STATUS == *"migration_complete\":true"* ]]; then
    echo "✅ VIP codes already migrated"
else
    echo "🔄 Running VIP code secret hash migration..."
    
    # 3. Run VIP code migration via API
    MIGRATION_RESULT=$(curl -s -X POST "${NEXT_PUBLIC_APP_URL:-http://localhost:3000}/api/signup/migrate-vip-codes" || echo "")
    
    if [[ $MIGRATION_RESULT == *"migrated"* ]]; then
        echo "✅ VIP code migration completed successfully"
        echo "$MIGRATION_RESULT"
    else
        echo "❌ VIP code migration failed:"
        echo "$MIGRATION_RESULT"
        exit 1
    fi
fi

# 4. Test the signup system
echo "🧪 Step 3: Testing signup system..."
TEST_RESULT=$(curl -s -X GET "${NEXT_PUBLIC_APP_URL:-http://localhost:3000}/api/signup/test" || echo "")

if [[ $TEST_RESULT == *"healthy"* ]]; then
    echo "✅ Signup system test passed"
else
    echo "⚠️  Signup system test warnings (check signer service):"
    echo "$TEST_RESULT"
fi

echo ""
echo "🎉 Migration completed successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Ensure your account-manager signer service is running"
echo "2. Deploy the signup-admin dashboard with these environment variables:"
echo "   - SUPABASE_URL=${SUPABASE_URL}"
echo "   - SUPABASE_SERVICE_ROLE_KEY=***"
echo "   - VIP_PEPPER=***" 
echo "   - ADMIN_USER=admin"
echo "   - ADMIN_PASS=your-strong-password"
echo ""
echo "3. Test the complete flow:"
echo "   - Generate VIP codes in admin dashboard"
echo "   - Use codes in main webapp signup"
echo "   - Verify accounts created on Hive"
echo ""
echo "✅ All systems should now be compatible!"