# SkateHive ↔ Farcaster Notification System

## 🎯 Project Overview

This document outlines the complete implementation of a **scheduled notification system** that bridges SkateHive's Hive blockchain notifications with Farcaster miniapp users. The system avoids costly real-time streaming by implementing user-configurable scheduled notification delivery.

### Core Problem Solved
- **Expensive Real-time Streaming**: Instead of streaming all Hive notifications in real-time, users can schedule when they want to receive batched notifications
- **Cross-platform Integration**: Bridge Web3 (Hive) notifications to Web2 (Farcaster) social platform
- **User Control**: Full UI for users to configure notification preferences and timing

---

## 🏗️ System Architecture

### High-Level Flow
1. **User Setup**: Farcaster users add SkateHive miniapp and link their Hive account
2. **Preference Configuration**: Users set preferred notification times through SkateHive UI
3. **Scheduled Processing**: System runs batch jobs at user-preferred times
4. **Notification Delivery**: Last 5 unread Hive notifications sent to Farcaster clients

### Components

#### 1. **Database Layer** (Postgres)
- **farcaster_tokens**: Stores Farcaster notification tokens and user links
- **Enhanced Schema**: Added scheduled notification preferences (time, timezone, max notifications)
- **Indexes**: Optimized for fast lookups by FID, Hive username, and scheduling queries

#### 2. **API Endpoints**
- **Webhook Handler**: `/api/farcaster/webhook` - Receives miniapp events from Farcaster
- **Account Linking**: `/api/farcaster/link` - Links Farcaster FID to Hive username
- **Scheduled Preferences**: `/api/farcaster/scheduled-notifications` - Manage user notification schedules
- **Manual Trigger**: `/api/farcaster/trigger-scheduled` - Test individual user notifications
- **Cron Endpoint**: `/api/farcaster/cron/scheduled-notifications` - Batch process all scheduled users

#### 3. **Notification Services**
- **ScheduledNotificationService**: Core service for batch processing notifications
- **Server-side Hive Client**: Fetches notifications from Hive API without client-side constraints
- **Farcaster Notification Service**: Handles delivery to Farcaster clients with rate limiting

#### 4. **Frontend Integration**
- **Settings UI**: User interface for configuring notification preferences
- **Authentication**: Integration with Hive account authentication
- **Real-time Feedback**: Status updates and preference management

---

## 📊 Database Schema

Your production database uses a **two-table architecture** for comprehensive user management:

### 1. **`farcaster_tokens`** Table - Basic Token Storage
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

### 2. **`skatehive_farcaster_preferences`** Table - Advanced User Preferences
```sql
CREATE TABLE IF NOT EXISTS skatehive_farcaster_preferences (
  id SERIAL PRIMARY KEY,
  hive_username VARCHAR(255) NOT NULL UNIQUE,
  fid VARCHAR(50),
  farcaster_username VARCHAR(255),
  
  -- Notification Type Preferences
  notifications_enabled BOOLEAN DEFAULT TRUE,
  notify_votes BOOLEAN DEFAULT TRUE,
  notify_comments BOOLEAN DEFAULT TRUE,
  notify_follows BOOLEAN DEFAULT TRUE,
  notify_mentions BOOLEAN DEFAULT TRUE,
  notify_posts BOOLEAN DEFAULT FALSE,
  notification_frequency VARCHAR(20) DEFAULT 'instant',
  
  -- Scheduled Notification Preferences
  scheduled_notifications_enabled BOOLEAN DEFAULT FALSE,
  scheduled_time_hour INTEGER DEFAULT 9 CHECK (scheduled_time_hour >= 0 AND scheduled_time_hour <= 23),
  scheduled_time_minute INTEGER DEFAULT 0 CHECK (scheduled_time_minute >= 0 AND scheduled_time_minute <= 59),
  timezone VARCHAR(50) DEFAULT 'UTC',
  max_notifications_per_batch INTEGER DEFAULT 5 CHECK (max_notifications_per_batch > 0 AND max_notifications_per_batch <= 20),
  last_scheduled_check TIMESTAMP,
  last_scheduled_notification_id BIGINT DEFAULT 0,
  
  -- Tracking Fields
  linked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_notification_at TIMESTAMP,
  hive_profile_updated BOOLEAN DEFAULT FALSE,
  
  FOREIGN KEY (fid) REFERENCES farcaster_tokens(fid) ON DELETE SET NULL
);
```

### 3. **`farcaster_notification_logs`** Table - Analytics & Monitoring
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

### **Production Database Indexes**
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

## 🔧 Implementation Details

### Key Files Structure

#### **Core Services**
- `lib/farcaster/scheduled-notifications.ts` - Main scheduled notification processing
- `lib/hive/server-client.ts` - Server-side Hive API client (no 'use client' conflicts)
- `lib/farcaster/database-token-store.ts` - Enhanced database operations with scheduling support

#### **API Routes**
- `app/api/farcaster/scheduled-notifications/route.ts` - Preference management
- `app/api/farcaster/trigger-scheduled/route.ts` - Manual notification triggers
- `app/api/farcaster/cron/scheduled-notifications/route.ts` - Automated batch processing

#### **Frontend**
- `app/settings/farcaster/page.tsx` - User preference configuration UI
- Integration with `useAioha` for Hive account authentication

### Key Implementation Features

#### **1. Scheduled Notification Processing**
```typescript
class ScheduledNotificationService {
  // Find users ready for notifications based on current time
  async getUsersReadyForScheduledNotifications(targetTime?: Date): Promise<ScheduledUser[]>
  
  // Process notifications for a specific user
  async processUserScheduledNotifications(user: ScheduledUser): Promise<boolean>
  
  // Batch process all scheduled users
  async processScheduledNotifications(targetTime?: Date): Promise<ProcessingResult>
}
```

#### **2. Server-side Hive Integration**
```typescript
// Separate server-side client to avoid 'use client' conflicts
export const serverHiveClient = {
  async fetchNotifications(username: string, limit: number = 100): Promise<HiveNotification[]>
  async getLastReadNotificationDate(username: string): Promise<Date | null>
}
```

#### **3. User Preference Management**
- Time selection (hour/minute in user's timezone)
- Maximum notifications per batch (default: 5)
- Enable/disable scheduled notifications
- Timezone support for accurate scheduling

---

## 🚀 Setup & Configuration

### Environment Variables
```bash
# Database (using STORAGE_ prefix for Vercel compatibility)
STORAGE_POSTGRES_URL="postgres://default:..."
STORAGE_POSTGRES_PRISMA_URL="postgres://default:..."
STORAGE_POSTGRES_URL_NO_SSL="postgres://default:..."
STORAGE_POSTGRES_URL_NON_POOLING="postgres://default:..."
STORAGE_POSTGRES_USER="default"
STORAGE_POSTGRES_HOST="..."
STORAGE_POSTGRES_PASSWORD="..."
STORAGE_POSTGRES_DATABASE="verceldb"

# Security
FARCASTER_INIT_PASSWORD="your_secure_password_here"
```

### Database Initialization
```bash
# Initialize database with scheduled notification schema
curl -X POST http://localhost:3000/api/farcaster/init-db \
  -H "Content-Type: application/json" \
  -d '{"password": "your_secure_password_here"}'
```

---

## 📱 User Experience Flow

### 1. **Account Setup**
1. User adds SkateHive as Farcaster miniapp
2. System receives `miniapp_added` webhook event
3. User links their Hive username through SkateHive settings

### 2. **Preference Configuration**
1. User navigates to Farcaster settings in SkateHive
2. Enables scheduled notifications
3. Sets preferred notification time (e.g., 9:00 AM)
4. Configures timezone and max notifications per batch

### 3. **Scheduled Delivery**
1. System runs batch job at user's preferred time
2. Fetches last 5 unread Hive notifications for user
3. Converts to Farcaster notification format
4. Delivers to user's Farcaster client
5. Updates last run timestamp

---

## 🧪 Testing & Validation

### Current Test Status ✅

#### **Database Connection**
- Successfully connected to Postgres with STORAGE_ environment variables
- Tables created with scheduled notification fields
- Indexes optimized for scheduling queries

#### **Account Linking**
- xvlad account successfully linked between Farcaster FID and Hive username
- Preference storage and retrieval working correctly

#### **Individual User Processing**
- Manual trigger successfully processes user notifications
- Server-side Hive client fetches notifications correctly
- Notification conversion and delivery functional

#### **API Endpoints**
- All preference management endpoints operational
- Manual trigger endpoint working for testing
- Database initialization and status checks functional

### Test Commands
```bash
# Link user account
curl -X POST http://localhost:3001/api/farcaster/link \
  -H "Content-Type: application/json" \
  -d '{"fid": "123", "hiveUsername": "xvlad"}'

# Set scheduled preferences
curl -X POST http://localhost:3001/api/farcaster/scheduled-notifications \
  -H "Content-Type: application/json" \
  -d '{
    "preferences": {
      "scheduledNotificationsEnabled": true,
      "scheduledTimeHour": 15,
      "scheduledTimeMinute": 30,
      "timezone": "UTC",
      "maxNotificationsPerBatch": 5
    }
  }'

# Test individual user
curl -X POST http://localhost:3001/api/farcaster/trigger-scheduled \
  -H "Content-Type: application/json" \
  -d '{"hiveUsername": "xvlad"}'
```

---

## 🎯 Current Status vs Final Goal

### ✅ **Completed Features**
- [x] Database schema with scheduled notification support
- [x] Server-side Hive API integration (avoiding streaming costs)
- [x] User preference management system
- [x] Manual notification triggering
- [x] Account linking between Farcaster and Hive
- [x] API endpoints for all operations
- [x] Settings UI for user configuration
- [x] Batch notification processing logic

### 🔄 **Pending for Production**
- [ ] **Production Database Migration**: Use `docs/PRODUCTION_DATABASE_MIGRATION.md` guide to prepare your production database
- [ ] **Automated Cron Jobs**: Deploy scheduled batch processing (Vercel Cron or external scheduler)
- [ ] **Monitoring & Analytics**: Track notification delivery rates and user engagement
- [ ] **Error Handling**: Enhanced error recovery and user feedback systems
- [ ] **Rate Limiting**: Production-grade rate limiting for API endpoints

### 🎯 **Final Goal Achievement**
The system successfully addresses the original requirements:

1. **✅ Cost-Effective**: Batch processing instead of expensive real-time streaming
2. **✅ User Control**: Full UI for notification time preferences
3. **✅ Efficient**: Fetches only last 5 notifications per user
4. **✅ Scalable**: Database-driven architecture supports multiple users
5. **✅ Cross-Platform**: Bridges Hive blockchain to Farcaster social platform

---

## 🛠️ Technical Considerations

### **Server vs Client Separation**
- Created separate server-side Hive client to avoid 'use client' import conflicts
- Scheduled processing runs server-side for reliability
- Frontend UI uses client-side hooks for user interaction

### **Timezone Handling**
- User preferences stored in their local timezone
- Processing logic converts to UTC for accurate scheduling
- Database queries use UTC time for consistency

### **Error Recovery**
- Failed notification attempts logged with user context
- Retry logic for temporary network failures
- Graceful degradation when Hive API is unavailable

### **Performance Optimization**
- Database indexes for fast scheduling queries
- Batch processing reduces API calls
- Connection pooling for database efficiency

---

## 🔮 Future Enhancements

### **Phase 1: Production Deployment**
1. Set up automated cron jobs (hourly batch processing)
2. Implement monitoring dashboard
3. Add user analytics and delivery metrics

### **Phase 2: Enhanced Features**
1. Multiple notification times per user
2. Notification type filtering (votes, comments, follows)
3. Custom notification templates
4. Advanced timezone support

### **Phase 3: Scaling**
1. Redis caching for frequently accessed data
2. Message queue for reliable notification delivery
3. Multi-region deployment for global users

---

## 📞 Support & Troubleshooting

### **Common Issues**
1. **UTC Time Confusion**: Ensure user preferences match UTC conversion logic
2. **Database Connection**: Verify STORAGE_ environment variables are set correctly
3. **Authentication**: Check Hive account linking is properly authenticated

### **Debugging Commands**
```bash
# Check user preferences
curl "http://localhost:3001/api/farcaster/scheduled-notifications?action=getUsersForTime&hour=15&minute=30"

# Test manual trigger
curl -X POST http://localhost:3001/api/farcaster/trigger-scheduled \
  -H "Content-Type: application/json" \
  -d '{"hiveUsername": "xvlad"}'

# Database status
curl http://localhost:3001/api/farcaster/init-db
```

---

## 🏆 Success Metrics

The implementation successfully delivers:

- **Cost Reduction**: Eliminated need for 24/7 streaming infrastructure
- **User Experience**: Configurable notification timing with simple UI
- **Scalability**: Database-driven architecture supports unlimited users
- **Reliability**: Server-side processing with error recovery
- **Integration**: Seamless bridge between Hive blockchain and Farcaster platform

This system provides SkateHive users with efficient, customizable notifications while maintaining cost-effectiveness and technical scalability.
