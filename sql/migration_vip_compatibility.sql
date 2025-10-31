-- Migration Script: Fix VIP Code Schema Compatibility
-- This migrates our current schema to be compatible with signup-admin

-- First, add the missing columns to vip_codes table
ALTER TABLE vip_codes 
ADD COLUMN IF NOT EXISTS code_id TEXT,
ADD COLUMN IF NOT EXISTS secret_hash TEXT,
ADD COLUMN IF NOT EXISTS reserved_username TEXT;

-- Add indexes for new columns
CREATE INDEX IF NOT EXISTS idx_vip_codes_code_id ON vip_codes(code_id);

-- Function to extract code_id from existing full codes
-- Assumes format "XXXXXX-XXXXXXXX" where first part is code_id
CREATE OR REPLACE FUNCTION extract_code_id(full_code TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN split_part(full_code, '-', 1);
END;
$$ LANGUAGE plpgsql;

-- Function to extract secret from existing full codes  
CREATE OR REPLACE FUNCTION extract_secret(full_code TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN split_part(full_code, '-', 2);
END;
$$ LANGUAGE plpgsql;

-- Update existing records to populate new columns
UPDATE vip_codes 
SET 
    code_id = extract_code_id(code)
WHERE code_id IS NULL AND code IS NOT NULL;

-- For secret_hash, we need to hash the secret part with VIP_PEPPER
-- This should be done via the application since we need access to VIP_PEPPER
-- The update will be handled by a separate API endpoint

-- Add NOT NULL constraints after populating data
-- (Run this after all data is migrated)
-- ALTER TABLE vip_codes ALTER COLUMN code_id SET NOT NULL;
-- ALTER TABLE vip_codes ALTER COLUMN secret_hash SET NOT NULL;

-- Update signup_sessions table to include signup_token column if missing
ALTER TABLE signup_sessions 
ADD COLUMN IF NOT EXISTS signup_token UUID;

-- Update signup_sessions to use id as signup_token if not set
UPDATE signup_sessions 
SET signup_token = id 
WHERE signup_token IS NULL;

-- Update vip_code_uses table to include completed_at column if missing  
ALTER TABLE vip_code_uses 
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

-- Add completed_at to signup_sessions if missing
ALTER TABLE signup_sessions 
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

-- Create enum type for vip_code_uses.status if it doesn't exist
DO $$ BEGIN
    CREATE TYPE use_status AS ENUM ('INIT', 'SUCCESS', 'FAILED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Update vip_code_uses status column to use enum (if not already)
-- ALTER TABLE vip_code_uses ALTER COLUMN status TYPE use_status USING status::use_status;

COMMENT ON TABLE vip_codes IS 'VIP codes compatible with signup-admin dashboard';
COMMENT ON COLUMN vip_codes.code_id IS '6-character display code (first part of full code)';
COMMENT ON COLUMN vip_codes.secret_hash IS 'Argon2id hash of secret + VIP_PEPPER'; 
COMMENT ON COLUMN vip_codes.reserved_username IS 'Optional username reservation for this code';
COMMENT ON COLUMN vip_codes.code IS 'Legacy full code field (keep for compatibility)';