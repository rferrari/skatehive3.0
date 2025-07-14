-- Farcaster notification preferences and tokens table
CREATE TABLE farcaster_notifications (
    id SERIAL PRIMARY KEY,
    fid VARCHAR(50) NOT NULL UNIQUE,
    farcaster_username VARCHAR(255),
    hive_username VARCHAR(255),
    token TEXT NOT NULL,
    notification_url TEXT NOT NULL,
    notifications_enabled BOOLEAN DEFAULT TRUE,
    token_active BOOLEAN DEFAULT TRUE,
    max_notifications_per_batch INTEGER DEFAULT 5,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Legacy farcaster_tokens table for backward compatibility
CREATE TABLE farcaster_tokens (
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

-- Notification log table for tracking sent notifications and preventing duplicates
CREATE TABLE farcaster_notification_log (
    id SERIAL PRIMARY KEY,
    hive_username VARCHAR(255) NOT NULL,
    fid VARCHAR(50) NOT NULL,
    notification_id VARCHAR(500) NOT NULL,
    hive_notification_data JSONB,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(hive_username, notification_id)
);

-- Indexes for faster lookups
CREATE INDEX idx_farcaster_notifications_fid ON farcaster_notifications(fid);
CREATE INDEX idx_farcaster_notifications_hive_username ON farcaster_notifications(hive_username);
CREATE INDEX idx_farcaster_notifications_active ON farcaster_notifications(token_active);
CREATE INDEX idx_farcaster_notifications_enabled ON farcaster_notifications(notifications_enabled);

CREATE INDEX idx_farcaster_tokens_fid ON farcaster_tokens(fid);
CREATE INDEX idx_farcaster_tokens_hive_username ON farcaster_tokens(hive_username);
CREATE INDEX idx_farcaster_tokens_active ON farcaster_tokens(is_active);

CREATE INDEX idx_notification_log_hive_username ON farcaster_notification_log(hive_username);
CREATE INDEX idx_notification_log_fid ON farcaster_notification_log(fid);
CREATE INDEX idx_notification_log_sent_at ON farcaster_notification_log(sent_at);

-- Notification logs for analytics and debugging (legacy)
CREATE TABLE farcaster_notification_logs (
    id SERIAL PRIMARY KEY,
    fid VARCHAR(50) NOT NULL,
    notification_type VARCHAR(50),
    title VARCHAR(32),
    body VARCHAR(128),
    target_url TEXT,
    success BOOLEAN,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for analytics
CREATE INDEX idx_notification_logs_fid ON farcaster_notification_logs(fid);
CREATE INDEX idx_notification_logs_created_at ON farcaster_notification_logs(created_at);
CREATE INDEX idx_notification_logs_success ON farcaster_notification_logs(success);
