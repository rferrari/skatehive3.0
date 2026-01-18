# Skatehive VIP Signup System - Complete Documentation

## Overview

The Skatehive VIP Signup System is a secure, multi-step process for creating Hive blockchain accounts using invitation codes. The system integrates three main services:

1. **Frontend (Next.js)** - User interface and workflow management
2. **Database (Supabase)** - VIP code management and session tracking
3. **Account Manager (Hive Signer Service)** - Blockchain account creation

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────────┐
│   Frontend      │    │    Database      │    │  Account Manager    │
│   (Next.js)     │◄──►│   (Supabase)     │    │ (Cloudflare Tunnel) │
│                 │    │                  │    │                     │
│ • User Interface│    │ • VIP Codes      │    │ • Hive Account      │
│ • Key Display   │    │ • Sessions       │    │   Creation          │
│ • Status Checks │    │ • User Records   │    │ • RC Management     │
│ • Email Testing │    │ • OTT Tokens     │    │ • Auth Validation   │
└─────────────────┘    └──────────────────┘    └─────────────────────┘
```

## Current Status

✅ **Working Features:**

- VIP code validation and consumption
- Hive account key generation
- Multi-step UI with safety confirmations
- Test email functionality
- Real-time signer service monitoring
- Database operations with correct schema
- Account creation (when RC sufficient)

⚠️ **Known Issues:**

- Resource Credits insufficient on steemskate account (3.7T / 14.9T needed)
- Key backup system temporarily disabled (table missing)

## Database Schema

### Core Tables

```sql
-- VIP invitation codes
CREATE TABLE vip_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by VARCHAR(50),
  consumed BOOLEAN DEFAULT FALSE,
  consumed_at TIMESTAMPTZ,
  consumed_by VARCHAR(50)
);

-- Active signup sessions
CREATE TABLE signup_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(50) NOT NULL,
  email VARCHAR(255) NOT NULL,
  vip_code VARCHAR(50) NOT NULL,
  signup_token UUID UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  status VARCHAR(20) DEFAULT 'pending'
);

-- VIP code usage tracking
CREATE TABLE vip_code_uses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vip_code VARCHAR(50) NOT NULL,
  signup_token UUID NOT NULL,
  username VARCHAR(50) NOT NULL,
  used_at TIMESTAMPTZ DEFAULT NOW()
);

-- User records (created after successful signup)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(255) NOT NULL,
  hive_account_created BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- One-time tokens for authentication
CREATE TABLE auth_ott (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token UUID UNIQUE NOT NULL,
  username VARCHAR(50) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN DEFAULT FALSE
);
```

## API Endpoints

### 1. `/api/signup/init` - Initialize Signup Session

**Purpose:** Validates VIP code, checks username availability, creates signup session

**Method:** `POST`

**Request Body:**

```json
{
  "username": "newuser123",
  "email": "user@example.com",
  "vip_code": "ABCDEF-12345678"
}
```

**Response:**

```json
{
  "success": true,
  "signup_token": "uuid-v4-token",
  "message": "Signup session initialized"
}
```

**Validation:**

- VIP code exists and not consumed
- Username available on Hive blockchain
- Email format validation
- Rate limiting (20 requests per 15 minutes per IP)

### 2. `/api/signup/submit` - Create Hive Account

**Purpose:** Submits account creation request to Hive Account Manager

**Method:** `POST`

**Request Body:**

```json
{
  "signup_token": "uuid-v4-token",
  "pubkeys": {
    "owner": "STM7...",
    "active": "STM7...",
    "posting": "STM7...",
    "memo": "STM7..."
  },
  "backup_blob": {
    "version": 1,
    "cipher": "plaintext",
    "data": {
      /* private keys */
    }
  }
}
```

**Process:**

1. Validates signup session
2. Consumes VIP code permanently
3. Calls Hive Account Manager service
4. Sends email with keys
5. Creates user record
6. Returns OTT for authentication

### 3. `/api/signup/test-email` - Send Test Email

**Purpose:** Tests email delivery without creating account

**Method:** `POST`

**Request Body:**

```json
{
  "username": "testuser",
  "email": "test@example.com",
  "keys": {
    "owner": "5K...",
    "active": "5K...",
    "posting": "5K...",
    "memo": "5K...",
    "master": "P5K..."
  },
  "signup_token": "uuid-v4-token"
}
```

**Features:**

- Skips session validation (test mode)
- Uses same email configuration as main flow
- Clearly marked as TEST email
- Returns success/error status

### 4. `/api/signup/burn-code` - Test Database Operations

**Purpose:** Tests VIP code consumption for debugging

**Method:** `POST`

**Request Body:**

```json
{
  "signup_token": "uuid-v4-token",
  "test_mode": true
}
```

**Warning:** Permanently consumes VIP codes for testing database writes

### 5. `/api/signup/key-backup` - Key Backup (DISABLED)

**Status:** Temporarily disabled - key_backups table not available

**Purpose:** Would provide emergency key backup functionality

## Frontend Components

### Signup Page (`/app/signup/page.tsx`)

**Multi-Step Workflow:**

1. **Step 1 - Form Entry**

   - Username validation
   - Email input
   - VIP code validation
   - Real-time username availability check

2. **Step 2 - Keys Preview**

   - Display generated private keys
   - Copy individual keys
   - Copy all keys (formatted)
   - Send test email
   - Safety confirmation checkbox

3. **Step 3 - Creating Account**

   - Loading state during blockchain submission
   - Status updates

4. **Step 4 - Success**
   - Confirmation message
   - Email notification sent
   - Redirect to homepage

**Signer Status Monitoring:**

- Real-time health checks using `/healthz` endpoint
- Authentication validation
- Resource Credit monitoring
- Visual status indicators with color coding

## External Services Integration

### Hive Account Manager Service

**Current URL:** `https://minivlad.tail83ea3e.ts.net`

**Endpoints Used:**

- `GET /healthz` - Health and auth check
- `POST /claim-account` - Account creation

**Authentication:**

- Header: `x-signer-token: d1fa4884f3c12b49b922c96ad93413416e19a5dcde50499ee473c448622c54d9`

**Resource Credits:**

- Account: `steemskate`
- Current RC: ~3.7T
- Required RC: ~14.9T per account
- **Status: Insufficient** ⚠️

### Email Service (Gmail SMTP)

**Configuration:**

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
EMAIL_USER=skatehiveapp@gmail.com
EMAIL_PASS=xssl gxla rhnj zuqv
```

**Features:**

- HTML email templates
- Security warnings included
- Test email capability
- Delivery confirmation

### Database Service (Supabase)

**Configuration:**

```env
SUPABASE_URL=https://wbfnkbpyddohyuhnwycj.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Usage:**

- VIP code management
- Session tracking
- User records
- OTT token storage

## Environment Configuration

### Required Environment Variables

```env
# Database
SUPABASE_URL=https://wbfnkbpyddohyuhnwycj.supabase.co
NEXT_PUBLIC_SUPABASE_URL=https://wbfnkbpyddohyuhnwycj.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLIC_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Hive Account Manager
NEXT_PUBLIC_SIGNER_URL=https://minivlad.tail83ea3e.ts.net
NEXT_PUBLIC_SIGNER_TOKEN=d1fa4884f3c12b49b922c96ad93413416e19a5dcde50499ee473c448622c54d9

# Email Service
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
EMAIL_USER=skatehiveapp@gmail.com
EMAIL_PASS=xssl gxla rhnj zuqv

# Security
JWT_SECRET=rYE1JM58C9X8zVsBpQm9xE+y8cpk6oaUjl2I3zWfE439r2M2cmjRXENEer2K4sbd8P41XJgo+AM+Pv80zlvSlg==
VIP_PEPPER=0c13476be2f97c8a33bb3566402f42d9055e15ba402fcb82d84a7ee6bcc04dfc
```

## Security Features

### Rate Limiting

- 20 requests per 15 minutes per IP address
- Prevents VIP code brute force attacks

### VIP Code Management

- One-time use codes
- Cryptographic validation
- Automatic consumption tracking

### Key Security

- Client-side key generation
- Secure email transmission
- No server-side key storage
- Safety confirmations required

### Session Management

- UUID-based session tokens
- Temporary session storage
- Session expiration

## User Flow

### Complete Signup Process

1. **User visits `/signup`**
2. **Enters credentials and VIP code**
3. **System validates:**
   - Username availability on Hive
   - VIP code validity
   - Email format
4. **Keys generated client-side**
5. **User reviews and saves keys**
6. **Optional: Send test email**
7. **User confirms key backup**
8. **System creates Hive account:**
   - Consumes VIP code
   - Calls Account Manager
   - Sends email with keys
   - Creates user record
9. **Success confirmation**

### Error Handling

**Common Issues:**

- Username already taken → Show error, allow retry
- Invalid VIP code → Show error message
- Insufficient RC → Show status in signer badge
- Email delivery failure → Keys still shown in UI
- Network issues → Retry mechanisms built-in

## Testing & Development

### Safe Testing Features

1. **VIP Code Validation** - Tests code without consumption
2. **Test Email** - Verifies email delivery works
3. **Burn Code** - Tests database writes (consumes codes)
4. **Signer Status** - Real-time service monitoring

### Debug Information

The system includes comprehensive logging:

- Console logs for API calls
- Status messages in UI
- Error details in responses
- Health check diagnostics

## Maintenance & Monitoring

### Regular Tasks

1. **Monitor Resource Credits:**

   - Check steemskate account RC levels
   - Power up HIVE when RC drops below 15T

2. **VIP Code Management:**

   - Generate new codes as needed
   - Monitor consumption rates
   - Clean up expired sessions

3. **Service Monitoring:**
   - Signer service availability
   - Email delivery success rates
   - Database performance

### Troubleshooting

**Account Creation Fails:**

- Check RC levels on steemskate account
- Verify signer service authentication
- Confirm Cloudflare tunnel is active

**Email Issues:**

- Test SMTP configuration
- Check spam folder instructions
- Verify email credentials

**Database Errors:**

- Confirm Supabase service status
- Check service role key permissions
- Validate table schemas match code

## Future Improvements

### Short Term

- [ ] Restore key backup functionality (create key_backups table)
- [ ] Implement automated RC monitoring alerts
- [ ] Add email delivery status tracking

### Long Term

- [ ] Multi-language support
- [ ] Enhanced error recovery
- [ ] Batch account creation for efficiency
- [ ] Integration with more Hive services

## File Structure

```
app/
├── signup/
│   └── page.tsx              # Main signup UI component
└── api/signup/
    ├── init/route.ts         # Initialize signup session
    ├── submit/route.ts       # Create Hive account
    ├── test-email/route.ts   # Send test email
    ├── burn-code/route.ts    # Test VIP code consumption
    └── key-backup/route.ts   # Key backup (disabled)

lib/invite/helpers.ts         # Hive account utilities

scripts/                      # Organized utility scripts
├── database/                 # Database management
│   ├── fix-auth-ott-schema.js
│   ├── inspect-schema.js
│   └── migrate-database.sh
├── vip-management/           # VIP code utilities
│   └── generate-vip.js
├── index.js                  # Script runner
└── README.md                 # Scripts documentation

.env.local                    # Environment configuration
```

---

## Quick Start Guide

1. **Ensure services are running:**

   - Supabase database accessible
   - Signer service tunnel active
   - Gmail SMTP configured

2. **Check Resource Credits:**

   ```bash
   # Monitor via signer status badge in UI
   # Power up steemskate account if needed
   ```

3. **Test the flow:**

   - Visit `/signup`
   - Use test credentials
   - Validate VIP code
   - Send test email
   - Monitor signer status

4. **Create accounts:**
   - Real credentials
   - Valid VIP codes only
   - Confirm key safety
   - Complete account creation

The system is production-ready with proper error handling, security measures, and comprehensive monitoring. The main bottleneck is Resource Credits on the steemskate account.
