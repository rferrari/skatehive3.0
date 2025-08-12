/**
 * Utility functions for formatting numbers, currency, and dates in the coin interface
 */

/**
 * Format large numbers with K, M, B suffixes
 */
export const formatNumber = (value: string | number | undefined): string => {
  if (!value) return "Unknown";
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
  if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
  if (num >= 1e3) return `${(num / 1e3).toFixed(2)}K`;
  return num.toLocaleString();
};

/**
 * Format currency values
 */
export const formatCurrency = (value: string | undefined): string => {
  if (!value) return "Unknown";
  const num = parseFloat(value);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(num);
};

/**
 * Format date strings
 */
export const formatDate = (dateString: string | undefined): string => {
  if (!dateString) return "Unknown";
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};
