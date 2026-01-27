// Helper function to clean username from @ symbol and whitespace
export const cleanUsername = (slug: string): string => {
    const decoded = decodeURIComponent(slug).trim();
    const withoutAt = decoded.startsWith("@") ? decoded.slice(1) : decoded;
    // Remove any remaining whitespace, newlines, or control characters
    return withoutAt.replace(/[\s\r\n]+/g, '').toLowerCase();
  };