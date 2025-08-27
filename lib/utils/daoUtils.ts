/**
 * DAO-related utility functions for formatting and calculations
 */

/**
 * Format a number as currency
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

/**
 * Format large numbers like PeakD (e.g., 15025.909 -> 15.026k)
 */
export const formatLargeNumber = (num: number): string => {
  if (num >= 1000) {
    return `${(num / 1000).toFixed(3)}k`;
  }
  return num.toFixed(3);
};

/**
 * Convert vesting shares to Hive Power using global properties
 */
export const convertVestToHive = (vestingShares: string, globalProps?: any): number => {
  if (!globalProps) {
    // Fallback to approximate values like in wallet components
    const totalVestingFundHive = 371873000;
    const totalVestingShares = 393500000000;
    const conversionRate = totalVestingFundHive / totalVestingShares;

    const vests = parseFloat(vestingShares.split(" ")[0]);
    return vests * conversionRate;
  }

  const totalVestingFundHive = parseFloat(
    globalProps.total_vesting_fund_hive?.split(" ")[0] || "0"
  );
  const totalVestingShares = parseFloat(
    globalProps.total_vesting_shares?.split(" ")[0] || "0"
  );
  const conversionRate = totalVestingFundHive / totalVestingShares;

  const vests = parseFloat(vestingShares.split(" ")[0]);
  return vests * conversionRate;
};

/**
 * Calculate the USD value of a Hive account
 */
export const calculateHiveAccountValue = (
  account: any,
  hivePrice: number,
  hbdPrice: number,
  globalProps?: any
): number => {
  if (!account) {
    return 0;
  }

  // Liquid HIVE
  const balance = parseFloat(
    typeof account.balance === "string"
      ? account.balance.split(" ")[0]
      : String(account.balance?.amount || "0")
  );

  // HBD balances (liquid + savings)
  const hbd = parseFloat(
    typeof account.hbd_balance === "string"
      ? account.hbd_balance.split(" ")[0]
      : String(account.hbd_balance?.amount || "0")
  );
  const hbdSavings = parseFloat(
    typeof account.savings_hbd_balance === "string"
      ? account.savings_hbd_balance.split(" ")[0]
      : String(account.savings_hbd_balance?.amount || "0")
  );

  // Hive Power calculation - only count owned HP for value
  const vestingShares = parseFloat(
    typeof account.vesting_shares === "string"
      ? account.vesting_shares.split(" ")[0]
      : String(account.vesting_shares?.amount || "0")
  );

  // Calculate owned HP (including delegated HP since it's still owned)
  const ownedHP = convertVestToHive(`${vestingShares} VESTS`, globalProps);

  const totalHive = balance + ownedHP;
  const totalHbd = hbd + hbdSavings;

  // Calculate USD value using all owned assets (including delegated HP)
  return totalHive * (hivePrice || 0.21) + totalHbd * (hbdPrice || 1.0);
};

/**
 * Parse numeric value from Hive API response
 */
export const parseHiveAmount = (amount: any): number => {
  if (typeof amount === "string") {
    return parseFloat(amount.split(" ")[0]);
  }
  return parseFloat(String(amount?.amount || "0"));
};

/**
 * Get different HP calculations for an account
 */
export const getHivePowerBreakdown = (account: any, globalProps?: any) => {
  if (!account) {
    return {
      ownedHP: 0,
      receivedHP: 0,
      delegatedHP: 0,
      effectiveHP: 0,
      totalInfluenceHP: 0,
    };
  }

  const vestingShares = parseHiveAmount(account.vesting_shares);
  const receivedVestingShares = parseHiveAmount(account.received_vesting_shares);
  const delegatedVestingShares = parseHiveAmount(account.delegated_vesting_shares);

  const ownedHP = convertVestToHive(`${vestingShares} VESTS`, globalProps);
  const receivedHP = convertVestToHive(`${receivedVestingShares} VESTS`, globalProps);
  const delegatedHP = convertVestToHive(`${delegatedVestingShares} VESTS`, globalProps);
  const effectiveHP = ownedHP - delegatedHP; // HP actually usable
  const totalInfluenceHP = ownedHP + receivedHP - delegatedHP; // Total voting power

  return {
    ownedHP,
    receivedHP,
    delegatedHP,
    effectiveHP,
    totalInfluenceHP,
  };
};
