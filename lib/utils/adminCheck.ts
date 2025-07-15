// Client-side admin utility - FOR DISPLAY PURPOSES ONLY
// ⚠️  SECURITY WARNING: This is NOT used for security enforcement
// All real security happens server-side in /lib/server/adminUtils.ts

/**
 * Check if user should see admin UI elements (cosmetic only)
 * Note: This can be bypassed by attackers - never use for security
 */
export const isAdminUser = async (username: string): Promise<boolean> => {
    try {
        const response = await fetch('/api/admin/check', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username })
        });
        const result = await response.json();
        return result.isAdmin || false;
    } catch {
        return false;
    }
};
