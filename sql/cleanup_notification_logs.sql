-- Database cleanup and maintenance for Farcaster notifications
-- This script should be run periodically to prevent database bloat

-- 1. Clean up old notification logs (keep last 30 days for deduplication)
DELETE FROM farcaster_notification_log 
WHERE sent_at < NOW() - INTERVAL '30 days';

-- 2. Clean up old analytics logs (keep last 90 days for debugging)
DELETE FROM farcaster_notification_logs 
WHERE created_at < NOW() - INTERVAL '90 days';

-- 3. Archive old logs instead of deleting (optional)
-- CREATE TABLE farcaster_notification_log_archive AS 
-- SELECT * FROM farcaster_notification_log 
-- WHERE sent_at < NOW() - INTERVAL '30 days';

-- 4. Vacuum tables to reclaim space
VACUUM ANALYZE farcaster_notification_log;
VACUUM ANALYZE farcaster_notification_logs;

-- 5. Update table statistics
ANALYZE farcaster_notification_log;
ANALYZE farcaster_notification_logs;

-- 6. Check table sizes (for monitoring)
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables 
WHERE tablename LIKE 'farcaster_%'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
