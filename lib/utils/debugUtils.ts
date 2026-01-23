/**
 * Debug utilities to prevent duplicate console logs
 */

// Track last logged messages to prevent duplicates
const loggedMessages = new Map<string, number>();
const LOG_DEBOUNCE_TIME = 1000; // 1 second

/**
 * Debug log that prevents duplicate messages within a debounce period
 */
export function debugLog(message: string, data?: any, forceLog = false) {
  if (process.env.NODE_ENV !== "development" && !forceLog) {
    return;
  }

  const messageKey = `${message}:${JSON.stringify(data || {})}`;
  const now = Date.now();
  const lastLogged = loggedMessages.get(messageKey) || 0;

  if (now - lastLogged > LOG_DEBOUNCE_TIME) {
    console.log(message, data);
    loggedMessages.set(messageKey, now);
    
    // Clean up old entries periodically
    if (loggedMessages.size > 100) {
      const cutoff = now - (LOG_DEBOUNCE_TIME * 10);
      for (const [key, timestamp] of loggedMessages.entries()) {
        if (timestamp < cutoff) {
          loggedMessages.delete(key);
        }
      }
    }
  }
}

/**
 * Clear logged messages cache
 */
export function clearDebugLogCache() {
  loggedMessages.clear();
}
