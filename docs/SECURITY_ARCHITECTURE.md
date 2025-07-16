# Security Architecture - Admin System

## ⚠️ Important Security Notice

This application uses a **server-side security model** where all admin privileges are enforced server-side. Client-side checks are ONLY for UI convenience and can be bypassed by attackers.

## 🔒 How Admin Security Works

### 1. Environment-Based Admin List
- Admin users are defined in `ADMIN_USERS` environment variable
- Format: `ADMIN_USERS=user1,user2,user3`
- Never hardcoded in source code

### 2. Server-Side Enforcement
- All admin operations require server-side verification
- APIs check admin status independently of client
- Security logging tracks all attempts

### 3. Protected Endpoints
- `/api/farcaster/notify` - Admin checks for broadcast and custom notifications only
- `/api/admin/check` - Admin status verification
- Automatic notifications (vote, comment, follow, etc.) work without admin privileges

## 🛡️ Security Features

### Zero-Trust Architecture
- Client-side admin checks are for UX only
- All security decisions made server-side
- Admin list never exposed to client

### Security Logging
- All admin operations logged with timestamps
- Failed attempts tracked with IP addresses
- Comprehensive audit trail

### Open Source Safety
- Forks cannot bypass security by modifying client code
- Admin privileges controlled by deployment environment
- Each deployment has independent admin list

## 🚀 Deployment Security

### Environment Variables Required
```bash
ADMIN_USERS=user1,user2,user3
```

### Security Best Practices
1. Keep admin list minimal
2. Use strong usernames
3. Monitor security logs
4. Rotate admin access regularly

## 🔧 For Developers

### Client-Side Admin Checks
- Used ONLY for hiding UI elements
- NEVER for security enforcement
- Can be safely bypassed without security risk

### Server-Side Security
- Located in `/lib/server/adminUtils.ts`
- Used by all admin-sensitive APIs
- Provides logging and security utilities

## 📝 Notification Types & Security

### 🔓 **Public Notifications** (No Admin Required)
- `vote` - User received an upvote
- `comment` - New comment on user's post
- `reply_comment` - Reply to user's comment
- `follow` - New follower
- `mention` - User was mentioned
- `reblog` - Post was reblogged
- `transfer` - Hive transfer received

These notifications are triggered automatically by blockchain events and don't require admin privileges.

### 🔒 **Admin-Only Notifications**
- `custom` - Custom admin broadcast messages
- `test` - Test notifications for debugging
- Any notification with `broadcast: true` flag

These require valid admin credentials and are logged for security auditing.

## ⚡ Key Security Principles

1. **Never trust the client** - All security server-side
2. **Environment-driven** - Admin list in env variables
3. **Audit everything** - Log all admin operations
4. **Fail secure** - Default to deny access
5. **Open source safe** - Forks cannot gain admin access

This architecture ensures that even if someone forks the repository and removes all client-side admin checks, they cannot gain unauthorized access to admin functions.
