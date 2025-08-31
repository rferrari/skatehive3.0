// Shared utility functions for Zora token components

export const formatNumber = (value: string | number | undefined) => {
  if (!value || value === "0" || value === 0) return "0";
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (num >= 1e9) return `${(num / 1e9).toFixed(1)}B`;
  if (num >= 1e6) return `${(num / 1e6).toFixed(1)}M`;
  if (num >= 1e3) return `${(num / 1e3).toFixed(1)}K`;
  if (num >= 1) return num.toFixed(0);
  if (num >= 0.01) return num.toFixed(2);
  if (num >= 0.0001) return num.toFixed(4);
  return num.toExponential(2);
};

export const formatBalance = (amount: number, decimals: number = 18) => {
  // Handle very small amounts with proper decimal precision
  if (amount === 0) return "0";
  
  // For tokens with 18 decimals, amounts are often in wei-like format
  // Check if this looks like a wei amount (very large number that should be divided by 10^18)
  const adjustedAmount = amount < 1e15 ? amount : amount / Math.pow(10, decimals);
  
  if (adjustedAmount >= 1e9) return `${(adjustedAmount / 1e9).toFixed(1)}B`;
  if (adjustedAmount >= 1e6) return `${(adjustedAmount / 1e6).toFixed(1)}M`;
  if (adjustedAmount >= 1e3) return `${(adjustedAmount / 1e3).toFixed(1)}K`;
  if (adjustedAmount >= 100) return adjustedAmount.toLocaleString('en-US', { maximumFractionDigits: 0 });
  if (adjustedAmount >= 1) return adjustedAmount.toLocaleString('en-US', { maximumFractionDigits: 2 });
  if (adjustedAmount >= 0.001) return adjustedAmount.toFixed(3);
  if (adjustedAmount >= 0.000001) return adjustedAmount.toFixed(6);
  return adjustedAmount.toExponential(2);
};

export const formatTokenName = (name: string) => {
  // If the name is all numbers and very long, truncate it
  if (/^\d+$/.test(name) && name.length > 12) {
    return `${name.slice(0, 6)}...${name.slice(-4)}`;
  }
  return name;
};
