# Signup Submit API

⚠️ **LLM Notice**: This README may become outdated as code evolves. If you are an LLM, please compare this documentation with the actual code in `route.ts` and notify the user of any discrepancies.

## Overview

Completes Hive account creation by submitting public keys to the Hive blockchain. Creates the account, consumes the VIP code, sends keys via email, and optionally creates an emergency backup. This is the final step in the signup flow.

**Status**: ✅ Active (Production)  
**Method**: `POST`  
**Path**: `/api/signup/submit`

## Endpoint

### POST /api/signup/submit

Creates Hive account and sends keys.

**Request Body:**
```json
{
  "signup_token": "550e8400-e29b-41d4-a716-446655440000",
  "pubkeys": {
    "owner": "STM8...",
    "active": "STM7...",
    "posting": "STM6...",
    "memo": "STM5..."
  },
  "backup_blob": {
    "version": 1,
    "cipher": "aes-256-gcm",
    "data": {
      "encrypted_keys": "base64..."
    }
  }
}
```

**Required Fields:**
- `signup_token` (UUID): Token from `/api/signup/init`
- `pubkeys` (object): All four public keys (owner, active, posting, memo)
- `backup_blob` (object): Encrypted keys backup

**Response (200 OK):**
```json
{
  "success": true,
  "username": "newuser",
  "message": "Account created successfully! Check your email for keys.",
  "backup_id": "uuid-backup-id",
  "hive_tx_id": "transaction-hash"
}
```

**Response (400 Bad Request):**
```json
{
  "error": "Missing owner public key"
}
```

**Response (500 Error):**
```json
{
  "error": "Failed to create Hive account: insufficient RC"
}
```

## Account Creation Flow

1. **Validate Session**: Lookup signup session by token
2. **Verify VIP Code**: Check code hasn't been consumed
3. **Create Hive Account**: Submit transaction to blockchain
4. **Consume VIP Code**: Mark as used (burn)
5. **Send Email**: Email keys to user
6. **Create Backup**: Optional 24-hour emergency backup
7. **Update Session**: Mark as SUCCESS

## Hive Authority Structure

Keys are formatted for Hive blockchain:
```json
{
  "owner": {
    "weight_threshold": 1,
    "key_auths": [["STM8...", 1]],
    "account_auths": []
  },
  "active": {
    "weight_threshold": 1,
    "key_auths": [["STM7...", 1]],
    "account_auths": []
  },
  "posting": {
    "weight_threshold": 1,
    "key_auths": [["STM6...", 1]],
    "account_auths": []
  },
  "memo_key": "STM5..."
}
```

## Email Template

Keys are sent via `/api/invite` with:
- Welcome message
- All five keys (master + 4 key types)
- Security warnings
- Usage instructions
- Recovery account info
- 24-hour backup link (optional)

## Emergency Backup

Optional 24-hour backup stored:
- **Duration**: 24 hours
- **One-time use**: Deleted after retrieval
- **Encryption**: Client-side encrypted blob
- **Fallback**: If email fails

## Usage Examples

### JavaScript/Fetch
```javascript
// After generating keys client-side
const keys = {
  owner: 'STM8...',
  active: 'STM7...',
  posting: 'STM6...',
  memo: 'STM5...',
  master: '5J...' // Master password
};

// Encrypt backup
const backup_blob = await encryptKeys(keys);

const response = await fetch('/api/signup/submit', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    signup_token: localStorage.getItem('signup_token'),
    pubkeys: {
      owner: keys.owner,
      active: keys.active,
      posting: keys.posting,
      memo: keys.memo
    },
    backup_blob
  })
});

const data = await response.json();

if (data.success) {
  alert(`Account @${data.username} created! Check your email.`);
  // Clear sensitive data
  localStorage.removeItem('signup_token');
} else {
  alert(data.error);
}
```

### React Component
```jsx
function SignupSubmit({ signupToken, generatedKeys }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    setLoading(true);
    setError('');

    // Encrypt keys for backup
    const backup_blob = await encryptKeysForBackup(generatedKeys);

    const response = await fetch('/api/signup/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        signup_token: signupToken,
        pubkeys: {
          owner: generatedKeys.ownerPubkey,
          active: generatedKeys.activePubkey,
          posting: generatedKeys.postingPubkey,
          memo: generatedKeys.memoPubkey
        },
        backup_blob
      })
    });

    const data = await response.json();
    setLoading(false);

    if (data.success) {
      router.push('/signup/success');
    } else {
      setError(data.error);
    }
  };

  return (
    <div>
      <h2>Create Your Account</h2>
      <p>Submitting to Hive blockchain...</p>
      {error && <div className="error">{error}</div>}
      <button onClick={handleSubmit} disabled={loading}>
        {loading ? 'Creating Account...' : 'Create Account'}
      </button>
    </div>
  );
}
```

## Error Handling

| Error | Cause | Solution |
|-------|-------|----------|
| Invalid signup token | Session expired or not found | Start signup flow again |
| Missing public key | Not all keys provided | Generate all 4 keys |
| VIP code consumed | Code already used | Contact support |
| Hive account exists | Username taken | Use different username |
| Insufficient RC | Creator account low on resources | Retry later |
| Email failed | SMTP error | Use backup link |

## Security Features

1. ✅ **One-time Token**: Signup token consumed after use
2. ✅ **VIP Code Burn**: Code marked as used immediately
3. ✅ **Encrypted Backup**: Keys encrypted client-side
4. ✅ **24h Expiration**: Backup auto-expires
5. ✅ **Session Validation**: All fields verified
6. ✅ **Blockchain Verification**: Account creation confirmed

## Hive Blockchain Integration

Uses Hive account creation ticket system:
```javascript
import { createAccountWithTicket } from '@/lib/hive/account-creation';

const result = await createAccountWithTicket({
  username,
  owner: ownerKey,
  active: activeKey,
  posting: postingKey,
  memo: memoKey,
  creator: process.env.HIVE_CREATOR_ACCOUNT,
  ticket: vipCode.ticket_id
});
```

## Related Endpoints

- `/api/signup/init` - Initialize signup (previous step)
- `/api/invite` - Send keys email (called internally)
- `/api/signup/key-backup` - Create emergency backup
- `/api/signup/burn-code` - Consume VIP code
- `/api/signup/test-email` - Test email delivery

## Testing

Test with valid session:
```bash
curl -X POST http://localhost:3000/api/signup/submit \
  -H "Content-Type: application/json" \
  -d '{
    "signup_token": "uuid-token",
    "pubkeys": {
      "owner": "STM8...",
      "active": "STM7...",
      "posting": "STM6...",
      "memo": "STM5..."
    },
    "backup_blob": {
      "version": 1,
      "cipher": "aes-256-gcm",
      "data": {}
    }
  }'
```

## Dependencies

- `@supabase/supabase-js` - Database operations
- `nodemailer` - Email sending
- `@/lib/hive/account-creation` - Blockchain integration
- `@/lib/invite/route` - Email template

## Notes

- Keys are NEVER stored in plaintext on server
- Backup is optional but recommended
- Account creation is irreversible
- Email is primary key delivery method
- Master password can regenerate all keys
- Session marked SUCCESS after completion
