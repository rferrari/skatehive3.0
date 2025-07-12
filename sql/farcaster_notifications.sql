-- Farcaster notification tokens table
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

-- Index for faster lookups
CREATE INDEX idx_farcaster_tokens_fid ON farcaster_tokens(fid);
CREATE INDEX idx_farcaster_tokens_hive_username ON farcaster_tokens(hive_username);
CREATE INDEX idx_farcaster_tokens_active ON farcaster_tokens(is_active);

-- Notification logs for analytics and debugging
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
