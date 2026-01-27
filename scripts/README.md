# Skatehive Scripts

This directory contains utility scripts for managing the Skatehive VIP signup system and database operations.

## Directory Structure

```
scripts/
├── database/           # Database management scripts
│   ├── fix-auth-ott-schema.js    # Fix auth_ott table schema issues
│   ├── inspect-schema.js         # Inspect database table schemas
│   └── migrate-database.sh       # Database migration script
├── vip-management/     # VIP code management scripts
│   └── generate-vip.js           # Generate new VIP invitation codes
└── README.md          # This file
```

## Prerequisites

Before running any scripts, ensure you have:

1. **Environment configured**: `.env.local` file with database credentials
2. **Dependencies installed**: `pnpm install` (for Supabase client)
3. **Database access**: Supabase service role key permissions

## Database Scripts

### Fix Auth OTT Schema

**File:** `database/fix-auth-ott-schema.js`

**Purpose:** Fixes schema issues with the `auth_ott` table, which stores one-time tokens for user authentication after signup.

**Usage:**

```bash
node scripts/database/fix-auth-ott-schema.js
```

**What it does:**

- Checks current `auth_ott` table schema
- Creates missing table/columns if needed
- Tests insert operations
- Provides manual SQL if automatic fix fails

**Required columns:**

- `id` - Serial primary key
- `token` - Unique text token
- `username` - Associated username
- `expires_at` - Token expiration timestamp
- `created_at` - Creation timestamp
- `used_at` - Usage timestamp (nullable)

### Inspect Schema

**File:** `database/inspect-schema.js`

**Purpose:** Inspects and displays current database table schemas for debugging.

**Usage:**

```bash
node scripts/database/inspect-schema.js
```

**Output:**

- Current table structure
- Column types and constraints
- Missing/extra columns analysis
- Schema compliance report

### Userbase Smoke Test

**File:** `database/smoke-userbase.js`

**Purpose:** Performs a basic write/read/delete cycle against the userbase tables.

**Usage:**

```bash
node scripts/database/smoke-userbase.js
```

**Required:**

- `DATABASE_URL` for direct Postgres access

### Userbase Snapshot

**File:** `database/snapshot-userbase.js`

**Purpose:** Dumps the current contents of userbase tables for debugging.

**Usage:**

```bash
node scripts/database/snapshot-userbase.js
```

**Required:**

- `DATABASE_URL` for direct Postgres access

## VIP Management Scripts

### Generate VIP Codes

**File:** `vip-management/generate-vip.js`

**Purpose:** Generates new VIP invitation codes with proper hashing for secure storage.

**Usage:**

```bash
node scripts/vip-management/generate-vip.js
```

**Output:**

- Full VIP code (e.g., `ABC123-9F9YWCZS`)
- Code ID and secret components
- Argon2 hash for database storage
- Verification test results

**Code Format:**

- 6-character code ID (hex)
- 8-character secret (hex)
- Combined format: `{CODE_ID}-{SECRET}`

## Environment Variables

All scripts require these environment variables in `.env.local`:

```env
# Database
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Optional - for enhanced debugging
NODE_ENV=development
```

## Common Issues & Solutions

### Database Connection Errors

```
❌ Error: Invalid API key
```

**Solution:** Check `SUPABASE_SERVICE_ROLE_KEY` in `.env.local`

### Schema Errors

```
❌ relation "auth_ott" does not exist
```

**Solution:** Run `fix-auth-ott-schema.js` to create missing tables

### Permission Errors

```
❌ insufficient_privilege
```

**Solution:** Ensure service role key has admin permissions

## Development Workflow

1. **Database Setup:**

   ```bash
   # Check current schema
   pnpm db:inspect
   # or: node scripts/index.js db:inspect

   # Fix any issues found
   pnpm db:fix-auth
   # or: node scripts/index.js db:fix-auth
   ```

2. **VIP Code Management:**

   ```bash
   # Generate new codes
   pnpm vip:generate
   # or: node scripts/index.js vip:generate

   # Insert into database manually or via admin interface
   ```

3. **Testing:**

   ```bash
   # Verify database schema after changes
   pnpm db:inspect

   # Show all available scripts
   pnpm scripts:help
   ```

## Security Notes

- **Never commit generated VIP codes** to version control
- **Service role keys** have full database access - keep secure
- **VIP secrets** are hashed with Argon2 before storage
- **Test thoroughly** in development before production changes

## Adding New Scripts

When adding new utility scripts:

1. **Choose appropriate directory:**

   - `database/` - Database operations and schema management
   - `vip-management/` - VIP code generation and management
   - Create new folders for different domains

2. **Follow naming convention:**

   - Use kebab-case: `my-new-script.js`
   - Descriptive names: `backup-vip-codes.js`
   - Include purpose in filename

3. **Add documentation:**

   - Update this README
   - Include usage examples
   - Document environment requirements

4. **Include error handling:**
   - Proper try/catch blocks
   - Meaningful error messages
   - Graceful failure modes

## Maintenance

Scripts should be reviewed and updated when:

- Database schema changes
- New features require database modifications
- Environment configuration changes
- Security requirements evolve

---

**Last Updated:** October 31, 2025
**Maintainer:** Skatehive Development Team
