import { useEffect, useState, useCallback } from "react";
import HiveClient from "@/lib/hive/hiveclient";
import { ExtendedAccount } from "@hiveio/dhive";

/**
 * useHivePower - React hook to fetch a user's Hive Power (HP) and estimate vote value
 * @param username Hive username
 * @returns { hivePower, isLoading, error, estimateVoteValue }
 */
export default function useHivePower(username: string) {
  const [hivePower, setHivePower] = useState<number | null>(null);
  const [account, setAccount] = useState<ExtendedAccount | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAccountAndHP() {
      setIsLoading(true);
      setError(null);
      try {
        // Fetch account
        const accounts = await HiveClient.database.getAccounts([username]);
        if (!accounts || !accounts[0]) throw new Error("Account not found");
        const acc = accounts[0];
        setAccount(acc);
        // Fetch global properties
        const globalProps = await HiveClient.call(
          "condenser_api",
          "get_dynamic_global_properties",
          []
        );
        const totalVestingFund = parseFloat(String(globalProps.total_vesting_fund_hive).split(" ")[0]);
        const totalVestingShares = parseFloat(String(globalProps.total_vesting_shares).split(" ")[0]);
        // Calculate user's HP
        const vestingShares = parseFloat(String(acc.vesting_shares).split(" ")[0]);
        const receivedVestingShares = parseFloat(String(acc.received_vesting_shares).split(" ")[0]);
        const delegatedVestingShares = parseFloat(String(acc.delegated_vesting_shares).split(" ")[0]);
        const userVests = vestingShares + receivedVestingShares - delegatedVestingShares;
        const hp = (totalVestingFund * userVests) / totalVestingShares;
        setHivePower(hp);
      } catch (e: any) {
        setError(e.message || "Error fetching Hive Power");
        setHivePower(null);
      } finally {
        setIsLoading(false);
      }
    }
    if (username) fetchAccountAndHP();
  }, [username]);

  /**
   * Estimate the value of a vote for this user at a given voting power percentage (0-100)
   * @param votingPowerPercent number (0-100)
   * @returns estimated value in HBD
   */
  const estimateVoteValue = useCallback(
    async (votingPowerPercent: number) => {
      if (!account) return 0;
      // Fetch reward fund and feed history for accurate calculation
      const [rewardFund, feedHistory] = await Promise.all([
        HiveClient.database.call("get_reward_fund", ["post"]),
        HiveClient.database.call("get_feed_history", []),
      ]);
      const { reward_balance, recent_claims } = rewardFund;
      const { base, quote } = feedHistory.current_median_history;
      const baseNumeric = parseFloat(String(base).split(" ")[0]);
      const quoteNumeric = parseFloat(String(quote).split(" ")[0]);
      const hbdMedianPrice = baseNumeric / quoteNumeric;
      const rewardBalanceNumeric = parseFloat(String(reward_balance).split(" ")[0]);
      const recentClaimsNumeric = parseFloat(String(recent_claims));
      const vestingSharesNumeric = parseFloat(String(account.vesting_shares).split(" ")[0]);
      const receivedVestingSharesNumeric = parseFloat(String(account.received_vesting_shares).split(" ")[0]);
      const delegatedVestingSharesNumeric = parseFloat(String(account.delegated_vesting_shares).split(" ")[0]);
      const total_vests = vestingSharesNumeric + receivedVestingSharesNumeric - delegatedVestingSharesNumeric;
      const final_vest = total_vests * 1e6;
      // Voting power is from 0-100, but blockchain expects 0-10000
      const voting_power = account.voting_power || 0;
      // Use the provided votingPowerPercent (slider value)
      const used_power = Math.floor((voting_power * votingPowerPercent) / 100);
      const rshares = (used_power * final_vest) / 10000 / 50;
      const estimate = (rshares / recentClaimsNumeric) * rewardBalanceNumeric * hbdMedianPrice;
      return estimate;
    },
    [account]
  );

  return { hivePower, isLoading, error, estimateVoteValue };
} 