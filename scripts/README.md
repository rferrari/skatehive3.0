# Skatehive Scripts

This directory contains utility scripts for managing the Skatehive database operations.

## Directory Structure

```
scripts/
├── database/           # Database management scripts
│   ├── fix-auth-ott-schema.js    # Fix auth_ott table schema issues
│   ├── inspect-schema.js         # Inspect database table schemas
│   ├── smoke-userbase.js         # Userbase smoke test
│   ├── snapshot-userbase.js      # Snapshot userbase tables
│   └── migrate-database.sh       # Database migration script
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

**Purpose:** Fixes schema issues with the `auth_ott` table, which stores one-time tokens for user authentication.

**Usage:**

```bash
node scripts/database/fix-auth-ott-schema.js
```

**What it does:**

- Checks current `auth_ott` table schema
- Creates missing table/columns if needed
- Tests insert operations
- Provides manual SQL if automatic fix fails

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

2. **Testing:**

   ```bash
   # Verify database schema after changes
   pnpm db:inspect

   # Show all available scripts
   node scripts/index.js help
   ```

## Security Notes

- **Service role keys** have full database access - keep secure
- **Test thoroughly** in development before production changes

## Adding New Scripts

When adding new utility scripts:

1. **Choose appropriate directory:**

   - `database/` - Database operations and schema management
   - Create new folders for different domains

2. **Follow naming convention:**

   - Use kebab-case: `my-new-script.js`
   - Descriptive names: `backup-data.js`
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

**Last Updated:** January 27, 2026
**Maintainer:** Skatehive Development Team
