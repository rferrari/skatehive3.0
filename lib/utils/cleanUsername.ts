// Helper function to clean username from @ symbol
export const cleanUsername = (slug: string): string => {
    const decoded = decodeURIComponent(slug);
    return decoded.startsWith("@") ? decoded.slice(1) : decoded;
  };