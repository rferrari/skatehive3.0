# Production Database Migration Guide

## 🚀 Migrating Production to Match Local Development Schema

This guide helps you migrate your production database to include all the latest scheduled notification features from your local development environment.

Based on your production data, it appears your database already has the scheduled notification columns, but this guide ensures everything is properly migrated.

---

## ✅ Pre-Migration Checklist

### 1. **Backup Your Production Database**
```bash
# Create a backup before any changes
pg_dump $POSTGRES_URL > skatehive_backup_$(date +%Y%m%d_%H%M%S).sql
```

### 2. **Check Current Production Schema**
```sql
-- Check if scheduled notification columns exist
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'skatehive_farcaster_preferences' 
AND column_name IN (
  'scheduled_notifications_enabled',
  'scheduled_time_hour', 
  'scheduled_time_minute',
  'timezone',
  'max_notifications_per_batch',
  'last_scheduled_check',
  'last_scheduled_notification_id'
);
```

---

## � Migration Scripts

### **Option A: Quick Migration Check (Recommended)**

Run this API endpoint to automatically check and update your production database:

```bash
# This will check your production schema and add missing columns
curl -X POST https://skatehive.app/api/farcaster/init-db \
  -H "Content-Type: application/json" \
  -d '{"password": "your_production_password"}'
```

### **Option B: Manual SQL Migration**

If you prefer manual control, connect to your production database and run:

```sql
-- Add scheduled notification columns if they don't exist
DO $$ 
BEGIN
    -- Check if columns exist before adding them
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'skatehive_farcaster_preferences' 
                   AND column_name = 'scheduled_notifications_enabled') THEN
        ALTER TABLE skatehive_farcaster_preferences 
        ADD COLUMN scheduled_notifications_enabled BOOLEAN DEFAULT FALSE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'skatehive_farcaster_preferences' 
                   AND column_name = 'scheduled_time_hour') THEN
        ALTER TABLE skatehive_farcaster_preferences 
        ADD COLUMN scheduled_time_hour INTEGER DEFAULT 9 
        CHECK (scheduled_time_hour >= 0 AND scheduled_time_hour <= 23);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'skatehive_farcaster_preferences' 
                   AND column_name = 'scheduled_time_minute') THEN
        ALTER TABLE skatehive_farcaster_preferences 
        ADD COLUMN scheduled_time_minute INTEGER DEFAULT 0 
        CHECK (scheduled_time_minute >= 0 AND scheduled_time_minute <= 59);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'skatehive_farcaster_preferences' 
                   AND column_name = 'timezone') THEN
        ALTER TABLE skatehive_farcaster_preferences 
        ADD COLUMN timezone VARCHAR(50) DEFAULT 'UTC';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'skatehive_farcaster_preferences' 
                   AND column_name = 'max_notifications_per_batch') THEN
        ALTER TABLE skatehive_farcaster_preferences 
        ADD COLUMN max_notifications_per_batch INTEGER DEFAULT 5 
        CHECK (max_notifications_per_batch > 0 AND max_notifications_per_batch <= 20);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'skatehive_farcaster_preferences' 
                   AND column_name = 'last_scheduled_check') THEN
        ALTER TABLE skatehive_farcaster_preferences 
        ADD COLUMN last_scheduled_check TIMESTAMP;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'skatehive_farcaster_preferences' 
                   AND column_name = 'last_scheduled_notification_id') THEN
        ALTER TABLE skatehive_farcaster_preferences 
        ADD COLUMN last_scheduled_notification_id BIGINT DEFAULT 0;
    END IF;
END $$;

-- Add indexes for scheduled notification queries (if they don't exist)
CREATE INDEX IF NOT EXISTS idx_skatehive_scheduled_enabled 
ON skatehive_farcaster_preferences(scheduled_notifications_enabled);

CREATE INDEX IF NOT EXISTS idx_skatehive_scheduled_time 
ON skatehive_farcaster_preferences(scheduled_time_hour, scheduled_time_minute);

CREATE INDEX IF NOT EXISTS idx_skatehive_last_scheduled_check 
ON skatehive_farcaster_preferences(last_scheduled_check);
```

### New Tables Required

#### 1. **farcaster_tokens** - Core token storage
```sql
CREATE TABLE IF NOT EXISTS farcaster_tokens (
  id SERIAL PRIMARY KEY,
  fid VARCHAR(50) NOT NULL UNIQUE,
  username VARCHAR(255),
  hive_username VARCHAR(255),
  token TEXT NOT NULL,
  notification_url TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 2. **skatehive_farcaster_preferences** - User preferences and scheduling
```sql
CREATE TABLE IF NOT EXISTS skatehive_farcaster_preferences (
  id SERIAL PRIMARY KEY,
  hive_username VARCHAR(255) NOT NULL UNIQUE,
  fid VARCHAR(50),
  farcaster_username VARCHAR(255),
  notifications_enabled BOOLEAN DEFAULT TRUE,
  notify_votes BOOLEAN DEFAULT TRUE,
  notify_comments BOOLEAN DEFAULT TRUE,
  notify_follows BOOLEAN DEFAULT TRUE,
  notify_mentions BOOLEAN DEFAULT TRUE,
  notify_posts BOOLEAN DEFAULT FALSE,
  notification_frequency VARCHAR(20) DEFAULT 'instant',
  -- Scheduled notification preferences
  scheduled_notifications_enabled BOOLEAN DEFAULT FALSE,
  scheduled_time_hour INTEGER DEFAULT 9 CHECK (scheduled_time_hour >= 0 AND scheduled_time_hour <= 23),
  scheduled_time_minute INTEGER DEFAULT 0 CHECK (scheduled_time_minute >= 0 AND scheduled_time_minute <= 59),
  timezone VARCHAR(50) DEFAULT 'UTC',
  max_notifications_per_batch INTEGER DEFAULT 5 CHECK (max_notifications_per_batch > 0 AND max_notifications_per_batch <= 20),
  last_scheduled_check TIMESTAMP,
  last_scheduled_notification_id BIGINT DEFAULT 0,
  -- Existing fields
  linked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_notification_at TIMESTAMP,
  hive_profile_updated BOOLEAN DEFAULT FALSE,
  FOREIGN KEY (fid) REFERENCES farcaster_tokens(fid) ON DELETE SET NULL
);
```

#### 3. **farcaster_notification_logs** - Analytics and debugging
```sql
CREATE TABLE IF NOT EXISTS farcaster_notification_logs (
  id SERIAL PRIMARY KEY,
  hive_username VARCHAR(255) NOT NULL,
  fid VARCHAR(50),
  notification_type VARCHAR(50) NOT NULL,
  title VARCHAR(32) NOT NULL,
  body VARCHAR(128) NOT NULL,
  target_url TEXT,
  success BOOLEAN NOT NULL,
  error_message TEXT,
  sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Required Indexes
```sql
-- farcaster_tokens indexes
CREATE INDEX IF NOT EXISTS idx_farcaster_tokens_fid ON farcaster_tokens(fid);
CREATE INDEX IF NOT EXISTS idx_farcaster_tokens_hive_username ON farcaster_tokens(hive_username);
CREATE INDEX IF NOT EXISTS idx_farcaster_tokens_active ON farcaster_tokens(is_active);

-- skatehive_farcaster_preferences indexes
CREATE INDEX IF NOT EXISTS idx_skatehive_preferences_hive_username ON skatehive_farcaster_preferences(hive_username);
CREATE INDEX IF NOT EXISTS idx_skatehive_preferences_fid ON skatehive_farcaster_preferences(fid);
CREATE INDEX IF NOT EXISTS idx_skatehive_preferences_enabled ON skatehive_farcaster_preferences(notifications_enabled);

-- farcaster_notification_logs indexes
CREATE INDEX IF NOT EXISTS idx_notification_logs_hive_username ON farcaster_notification_logs(hive_username);
CREATE INDEX IF NOT EXISTS idx_notification_logs_type ON farcaster_notification_logs(notification_type);
CREATE INDEX IF NOT EXISTS idx_notification_logs_sent_at ON farcaster_notification_logs(sent_at);
```

---

## 🚀 Migration Strategies

### Strategy 1: **Automated API Migration** (Recommended)

Use the built-in database initialization endpoint that handles both new installations and existing database updates.

#### Step 1: Update Environment Variables
```bash
# In your production environment (.env.production or Vercel dashboard)
STORAGE_POSTGRES_URL="your_production_postgres_url"
STORAGE_POSTGRES_PRISMA_URL="your_production_postgres_prisma_url"
STORAGE_POSTGRES_URL_NO_SSL="your_production_postgres_url_no_ssl"
STORAGE_POSTGRES_URL_NON_POOLING="your_production_postgres_url_non_pooling"
STORAGE_POSTGRES_USER="your_postgres_user"
STORAGE_POSTGRES_HOST="your_postgres_host"
STORAGE_POSTGRES_PASSWORD="your_postgres_password"
STORAGE_POSTGRES_DATABASE="your_postgres_database"

# Set a secure password for migration
FARCASTER_INIT_PASSWORD="your_secure_migration_password"
```

#### Step 2: Deploy Your Application
```bash
# Deploy to production with new code
vercel deploy --prod
```

#### Step 3: Run Migration
```bash
# Run the migration via API endpoint
curl -X POST https://your-production-domain.vercel.app/api/farcaster/init-db \
  -H "Content-Type: application/json" \
  -d '{"password": "your_secure_migration_password"}'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Database initialized successfully",
  "timestamp": "2025-07-12T15:30:00.000Z"
}
```

#### Step 4: Verify Migration
```bash
# Check database status
curl https://your-production-domain.vercel.app/api/farcaster/init-db

# Expected response:
{
  "status": "connected",
  "totalTokens": 0,
  "activeTokens": 0,
  "lastUpdated": null
}
```

---

### Strategy 2: **Direct Database Migration**

For advanced users who prefer direct database access.

#### Step 1: Connect to Production Database
```bash
# Using psql (replace with your connection details)
psql "postgresql://username:password@hostname:port/database?sslmode=require"
```

#### Step 2: Run Migration SQL
```sql
-- 1. Create main tables
CREATE TABLE IF NOT EXISTS farcaster_tokens (
  id SERIAL PRIMARY KEY,
  fid VARCHAR(50) NOT NULL UNIQUE,
  username VARCHAR(255),
  hive_username VARCHAR(255),
  token TEXT NOT NULL,
  notification_url TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS skatehive_farcaster_preferences (
  id SERIAL PRIMARY KEY,
  hive_username VARCHAR(255) NOT NULL UNIQUE,
  fid VARCHAR(50),
  farcaster_username VARCHAR(255),
  notifications_enabled BOOLEAN DEFAULT TRUE,
  notify_votes BOOLEAN DEFAULT TRUE,
  notify_comments BOOLEAN DEFAULT TRUE,
  notify_follows BOOLEAN DEFAULT TRUE,
  notify_mentions BOOLEAN DEFAULT TRUE,
  notify_posts BOOLEAN DEFAULT FALSE,
  notification_frequency VARCHAR(20) DEFAULT 'instant',
  scheduled_notifications_enabled BOOLEAN DEFAULT FALSE,
  scheduled_time_hour INTEGER DEFAULT 9 CHECK (scheduled_time_hour >= 0 AND scheduled_time_hour <= 23),
  scheduled_time_minute INTEGER DEFAULT 0 CHECK (scheduled_time_minute >= 0 AND scheduled_time_minute <= 59),
  timezone VARCHAR(50) DEFAULT 'UTC',
  max_notifications_per_batch INTEGER DEFAULT 5 CHECK (max_notifications_per_batch > 0 AND max_notifications_per_batch <= 20),
  last_scheduled_check TIMESTAMP,
  last_scheduled_notification_id BIGINT DEFAULT 0,
  linked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_notification_at TIMESTAMP,
  hive_profile_updated BOOLEAN DEFAULT FALSE,
  FOREIGN KEY (fid) REFERENCES farcaster_tokens(fid) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS farcaster_notification_logs (
  id SERIAL PRIMARY KEY,
  hive_username VARCHAR(255) NOT NULL,
  fid VARCHAR(50),
  notification_type VARCHAR(50) NOT NULL,
  title VARCHAR(32) NOT NULL,
  body VARCHAR(128) NOT NULL,
  target_url TEXT,
  success BOOLEAN NOT NULL,
  error_message TEXT,
  sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Create indexes
CREATE INDEX IF NOT EXISTS idx_farcaster_tokens_fid ON farcaster_tokens(fid);
CREATE INDEX IF NOT EXISTS idx_farcaster_tokens_hive_username ON farcaster_tokens(hive_username);
CREATE INDEX IF NOT EXISTS idx_farcaster_tokens_active ON farcaster_tokens(is_active);

CREATE INDEX IF NOT EXISTS idx_skatehive_preferences_hive_username ON skatehive_farcaster_preferences(hive_username);
CREATE INDEX IF NOT EXISTS idx_skatehive_preferences_fid ON skatehive_farcaster_preferences(fid);
CREATE INDEX IF NOT EXISTS idx_skatehive_preferences_enabled ON skatehive_farcaster_preferences(notifications_enabled);

CREATE INDEX IF NOT EXISTS idx_notification_logs_hive_username ON farcaster_notification_logs(hive_username);
CREATE INDEX IF NOT EXISTS idx_notification_logs_type ON farcaster_notification_logs(notification_type);
CREATE INDEX IF NOT EXISTS idx_notification_logs_sent_at ON farcaster_notification_logs(sent_at);

-- 3. If you have existing skatehive_farcaster_preferences table, add new columns
ALTER TABLE skatehive_farcaster_preferences 
ADD COLUMN IF NOT EXISTS scheduled_notifications_enabled BOOLEAN DEFAULT FALSE;

ALTER TABLE skatehive_farcaster_preferences 
ADD COLUMN IF NOT EXISTS scheduled_time_hour INTEGER DEFAULT 9;

ALTER TABLE skatehive_farcaster_preferences 
ADD COLUMN IF NOT EXISTS scheduled_time_minute INTEGER DEFAULT 0;

ALTER TABLE skatehive_farcaster_preferences 
ADD COLUMN IF NOT EXISTS timezone VARCHAR(50) DEFAULT 'UTC';

ALTER TABLE skatehive_farcaster_preferences 
ADD COLUMN IF NOT EXISTS max_notifications_per_batch INTEGER DEFAULT 5;

ALTER TABLE skatehive_farcaster_preferences 
ADD COLUMN IF NOT EXISTS last_scheduled_check TIMESTAMP;

ALTER TABLE skatehive_farcaster_preferences 
ADD COLUMN IF NOT EXISTS last_scheduled_notification_id BIGINT DEFAULT 0;

-- 4. Add constraints if they don't exist
ALTER TABLE skatehive_farcaster_preferences 
ADD CONSTRAINT IF NOT EXISTS chk_scheduled_time_hour 
CHECK (scheduled_time_hour >= 0 AND scheduled_time_hour <= 23);

ALTER TABLE skatehive_farcaster_preferences 
ADD CONSTRAINT IF NOT EXISTS chk_scheduled_time_minute 
CHECK (scheduled_time_minute >= 0 AND scheduled_time_minute <= 59);

ALTER TABLE skatehive_farcaster_preferences 
ADD CONSTRAINT IF NOT EXISTS chk_max_notifications_per_batch 
CHECK (max_notifications_per_batch > 0 AND max_notifications_per_batch <= 20);
```

#### Step 3: Verify Migration
```sql
-- Check table structures
\d farcaster_tokens
\d skatehive_farcaster_preferences
\d farcaster_notification_logs

-- Check indexes
\di

-- Verify constraints
SELECT conname, contype FROM pg_constraint WHERE conrelid = 'skatehive_farcaster_preferences'::regclass;
```

---

## 🔍 Pre-Migration Checklist

### Before Starting Migration:

- [ ] **Backup Production Database**
  ```bash
  pg_dump "your_production_connection_string" > skatehive_backup_$(date +%Y%m%d_%H%M%S).sql
  ```

- [ ] **Test on Staging Environment**
  - Run migration on a copy of production data
  - Verify all endpoints work correctly
  - Test scheduled notification functionality

- [ ] **Environment Variables Ready**
  - All `STORAGE_` prefixed variables configured
  - `FARCASTER_INIT_PASSWORD` set securely
  - Database connection tested

- [ ] **Downtime Planning**
  - Plan for brief downtime during migration
  - Notify users if necessary
  - Have rollback plan ready

---

## 📋 Post-Migration Verification

### 1. **Database Structure Check**
```bash
curl https://your-domain.vercel.app/api/farcaster/init-db
```

### 2. **Test API Endpoints**
```bash
# Test user linking
curl -X POST https://your-domain.vercel.app/api/farcaster/link \
  -H "Content-Type: application/json" \
  -d '{"fid": "test123", "hiveUsername": "testuser"}'

# Test preference management
curl -X POST https://your-domain.vercel.app/api/farcaster/scheduled-notifications \
  -H "Content-Type: application/json" \
  -d '{
    "preferences": {
      "scheduledNotificationsEnabled": true,
      "scheduledTimeHour": 9,
      "scheduledTimeMinute": 0,
      "timezone": "UTC",
      "maxNotificationsPerBatch": 5
    }
  }'
```

### 3. **Monitor Performance**
```sql
-- Check index usage
SELECT schemaname, tablename, attname, n_distinct, correlation 
FROM pg_stats 
WHERE tablename IN ('farcaster_tokens', 'skatehive_farcaster_preferences', 'farcaster_notification_logs');

-- Check table sizes
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables 
WHERE tablename IN ('farcaster_tokens', 'skatehive_farcaster_preferences', 'farcaster_notification_logs');
```

---

## 🚨 Troubleshooting

### Common Issues:

#### **1. Foreign Key Constraint Errors**
```sql
-- If foreign key fails, create tables in correct order:
-- 1. farcaster_tokens (parent)
-- 2. skatehive_farcaster_preferences (child)
-- 3. farcaster_notification_logs (independent)
```

#### **2. Permission Errors**
```bash
# Ensure database user has sufficient privileges
GRANT CREATE, ALTER, SELECT, INSERT, UPDATE, DELETE ON DATABASE your_db TO your_user;
GRANT USAGE, CREATE ON SCHEMA public TO your_user;
```

#### **3. Connection Issues**
```bash
# Test connection with psql
psql "$STORAGE_POSTGRES_URL" -c "SELECT version();"
```

#### **4. Environment Variable Issues**
```bash
# In Vercel dashboard, ensure all STORAGE_ variables are set
# Test locally with environment variables loaded
```

---

## 🔄 Rollback Plan

### If Migration Fails:

#### **Option 1: Database Rollback**
```sql
-- Drop new tables if needed
DROP TABLE IF EXISTS farcaster_notification_logs;
DROP TABLE IF EXISTS skatehive_farcaster_preferences;
DROP TABLE IF EXISTS farcaster_tokens;

-- Restore from backup
psql "your_connection_string" < skatehive_backup_YYYYMMDD_HHMMSS.sql
```

#### **Option 2: Code Rollback**
```bash
# Revert to previous deployment
vercel rollback
```

---

## 🎯 Success Criteria

Your migration is successful when:

- [ ] All three tables created successfully
- [ ] All indexes created and performing well
- [ ] API endpoints respond correctly
- [ ] Test user linking works
- [ ] Scheduled notification preferences can be set
- [ ] No performance degradation on existing queries
- [ ] Application deploys and runs without errors

---

## 📞 Support

If you encounter issues during migration:

1. **Check the application logs** in Vercel dashboard
2. **Verify database connection** with status endpoint
3. **Test individual API endpoints** to isolate problems
4. **Review database query performance** with `EXPLAIN ANALYZE`
5. **Ensure all environment variables** are correctly set

Remember: The migration is designed to be safe with `IF NOT EXISTS` clauses, so running it multiple times won't cause issues.

---

## 🏆 Next Steps After Migration

Once migration is complete:

1. **Deploy Cron Jobs** for automated scheduled notifications
2. **Set up Monitoring** for notification delivery rates
3. **Configure Analytics** to track user engagement
4. **Test User Experience** with real Farcaster miniapp integration
5. **Monitor Performance** and optimize queries as needed

Your production database is now ready for the full SkateHive ↔ Farcaster notification system! 🚀
