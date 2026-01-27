// Helper function to clean username from @ symbol and whitespace
export const cleanUsername = (slug: string): string => {
    let decoded: string;
    try {
      decoded = decodeURIComponent(slug).trim();
    } catch {
      decoded = slug.trim();
    }
    const withoutAt = decoded.startsWith("@") ? decoded.slice(1) : decoded;
    // Remove any remaining whitespace, newlines, or control characters
    return withoutAt.replace(/[\s\r\n]+/g, '').toLowerCase();
  };