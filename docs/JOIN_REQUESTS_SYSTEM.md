# Join Requests System

This document describes the new join requests system that allows non-logged-in users to request to join Skatehive, and logged-in users to process those requests.

## Overview

The join requests system consists of:
1. **Join Page** (`/join`) - For non-logged-in users to submit requests
2. **Admin Page** (`/join-admin`) - For logged-in users to process requests
3. **Database** - Stores join requests and their status
4. **API Endpoints** - Handle request submission and processing

## Database Schema

The system uses a `join_requests` table with the following structure:

```sql
CREATE TABLE join_requests (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    username_1 VARCHAR(16) NOT NULL,
    username_2 VARCHAR(16),
    username_3 VARCHAR(16),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
    created_by VARCHAR(255), -- Hive username of who created the account
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes TEXT
);
```

## Username Validation Rules

The system enforces strict Hive username validation:

- **Allowed characters**: only lowercase letters (a-z), digits (0-9), hyphens (-), and periods (.)
- **Length**: must be between 3 and 16 characters, inclusive
- **Start/End**: must start with a lowercase letter; must end with either a lowercase letter or a digit
- **Segments**: If the username includes periods, each dot-separated segment must be at least 3 characters long
- **Adjacency**: Hyphens and periods cannot be adjacent to each other or to themselves

## API Endpoints

### Submit Join Request
- **POST** `/api/join-requests`
- **Body**: `{ email, username_1, username_2?, username_3? }`
- **Response**: `{ success, requestId?, message?, error? }`

### Get Join Requests (Admin)
- **GET** `/api/join-requests?status=pending&limit=50&offset=0`
- **Response**: `{ success, requests[], error? }`

### Process Join Request (Admin)
- **POST** `/api/join-requests/[id]/process`
- **Body**: `{ action: 'approve'|'reject', username?, createdBy?, useAccountToken?, language? }`
- **Response**: `{ success, message?, accountCreated?, emailSent?, operation?, error? }`

## User Flow

### For Non-Logged-In Users:
1. Visit `/join`
2. Fill in email and up to 3 username preferences
3. Check availability of primary username
4. Submit join request
5. Receive confirmation message

### For Logged-In Users (Admin):
1. Visit `/join-admin`
2. View pending join requests
3. For each request:
   - Choose to reject (simple rejection)
   - Choose to approve (opens approval modal)
4. In approval modal:
   - Select which username to create
   - Choose ACT or paid account creation
   - Select email language
   - Create account and send invite email

## Database Initialization

To initialize the join requests table, call:
- **POST** `/api/database/init-join-requests`

To check if the table exists:
- **GET** `/api/database/init-join-requests`

## Integration with Existing Systems

The join requests system integrates seamlessly with:
- **Invite System**: Uses existing account creation logic and email templates
- **Keychain SDK**: Uses existing Hive Keychain integration
- **Database**: Uses same Vercel Postgres connection as Farcaster system
- **Theme System**: Follows existing Chakra UI theme patterns

## Security Considerations

- Email validation prevents invalid submissions
- Username format validation enforces Hive rules
- Duplicate request prevention by email
- Admin-only access to processing interface
- Audit trail of who processed what requests

## Files Created/Modified

### New Files:
- `sql/join_requests.sql` - Database schema
- `app/api/join-requests/route.ts` - Main API endpoint
- `app/api/join-requests/[id]/process/route.ts` - Processing endpoint
- `app/join-admin/page.tsx` - Admin interface
- `app/api/database/init-join-requests/route.ts` - Database initialization
- `docs/JOIN_REQUESTS_SYSTEM.md` - This documentation

### Modified Files:
- `app/join/page.tsx` - Updated to support 3 usernames and request submission
- `lib/utils/hiveAccountUtils.ts` - Updated username validation rules

## Testing

To test the system:

1. **Initialize Database**: Call `/api/database/init-join-requests` POST
2. **Submit Request**: Visit `/join` and submit a test request
3. **Process Request**: Visit `/join-admin` and process the request
4. **Verify Email**: Check that invite email was sent

## Future Enhancements

Potential improvements:
- Rate limiting on request submissions
- Email notifications for admins when new requests arrive
- Bulk processing of requests
- Request analytics and reporting
- Integration with community moderation tools
