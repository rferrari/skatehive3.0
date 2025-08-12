import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import {
  formatUnits,
  parseEther,
  parseUnits,
  formatEther,
  Address,
} from "viem";
import { useZoraTrade, TradeConfig } from "@/hooks/useZoraTrade";
import { CoinData, UserBalance } from "@/types/coin";

export const useCoinTrading = (coinData: CoinData | null) => {
  const [isBuying, setIsBuying] = useState(true);
  const [tradeAmount, setTradeAmount] = useState("");
  const [tradeComment, setTradeComment] = useState("");
  const [quoteResult, setQuoteResult] = useState<any>(null);
  const [loadingQuote, setLoadingQuote] = useState(false);
  const [formattedQuoteOutput, setFormattedQuoteOutput] = useState<string>("0");
  const [userBalance, setUserBalance] = useState<UserBalance | null>(null);

  const { isConnected } = useAccount();
  const {
    executeTrade,
    getTradeQuote,
    getFormattedBalance,
    isTrading,
    ethBalance,
  } = useZoraTrade();

  // Get quote when amount changes (optimized to prevent unnecessary requests)
  useEffect(() => {
    const getQuote = async () => {
      if (!tradeAmount || !coinData?.address || !isConnected) {
        setQuoteResult(null);
        setFormattedQuoteOutput("0");
        return;
      }

      // For sell mode, ensure we have token balance information
      if (
        !isBuying &&
        (!userBalance ||
          userBalance.decimals === undefined ||
          userBalance.decimals === null)
      ) {
        setQuoteResult(null);
        setFormattedQuoteOutput("0");
        return;
      }

      // Validate amount is a valid number
      const numericAmount = parseFloat(tradeAmount);
      if (isNaN(numericAmount) || numericAmount <= 0) {
        setQuoteResult(null);
        setFormattedQuoteOutput("0");
        return;
      }

      try {
        setLoadingQuote(true);

        let amountInWei: bigint;

        if (isBuying) {
          // When buying, input is in ETH
          amountInWei = parseEther(tradeAmount);
        } else {
          // When selling, input is in token units - use parseUnits with balance decimals
          const tokenDecimals = userBalance?.decimals || 18;
          amountInWei = parseUnits(tradeAmount, tokenDecimals);
        }

        const config: TradeConfig = {
          fromToken: isBuying
            ? { type: "eth", amount: amountInWei }
            : {
                type: "erc20",
                address: coinData.address as Address,
                amount: amountInWei,
              },
          toToken: isBuying
            ? { type: "erc20", address: coinData.address as Address }
            : { type: "eth" },
          slippage: 3,
        };

        const quote = await getTradeQuote(config);

        if (quote?.quote?.amountOut) {
          // Format the output amount with correct decimals like the modal does
          const amountOut = BigInt(quote.quote.amountOut);
          let formatted: string;

          if (isBuying) {
            // Getting tokens - get token decimals
            const tokenDecimals = userBalance?.decimals || 18;
            formatted = formatUnits(amountOut, tokenDecimals);
          } else {
            // Getting ETH - use 18 decimals
            formatted = formatEther(amountOut);
          }

          setFormattedQuoteOutput(Number(formatted).toFixed(6));
        } else {
          setFormattedQuoteOutput("0");
        }

        setQuoteResult(quote);
      } catch (error) {
        setQuoteResult(null);
        setFormattedQuoteOutput("0");
      } finally {
        setLoadingQuote(false);
      }
    };

    // Only get quote if we have a valid amount
    if (tradeAmount && parseFloat(tradeAmount) > 0) {
      const timeoutId = setTimeout(getQuote, 800); // Increased debounce
      return () => clearTimeout(timeoutId);
    } else {
      // Clear quote immediately if no valid amount
      setQuoteResult(null);
      setFormattedQuoteOutput("0");
    }
  }, [
    tradeAmount,
    isBuying,
    coinData?.address,
    userBalance?.decimals,
    isConnected,
    getTradeQuote,
  ]);

  // Trade function that executes directly
  const handleTrade = async () => {
    if (!tradeAmount || !coinData?.address || !isConnected) return;

    // For sell mode, ensure we have token balance information
    if (!isBuying && (!userBalance || !userBalance.decimals)) {
      return;
    }

    // Validate amount is a valid number
    const numericAmount = parseFloat(tradeAmount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      return;
    }

    try {
      let amountInWei: bigint;

      if (isBuying) {
        // When buying, input is in ETH
        amountInWei = parseEther(tradeAmount);
      } else {
        // When selling, input is in token units - use parseUnits with balance decimals
        const tokenDecimals = userBalance?.decimals || 18;
        amountInWei = parseUnits(tradeAmount, tokenDecimals);
      }

      const config: TradeConfig = {
        fromToken: isBuying
          ? { type: "eth", amount: amountInWei }
          : {
              type: "erc20",
              address: coinData.address as Address,
              amount: amountInWei,
            },
        toToken: isBuying
          ? { type: "erc20", address: coinData.address as Address }
          : { type: "eth" },
        slippage: 3, // 3% slippage tolerance
      };

      await executeTrade(config);

      // Clear form after successful trade
      setTradeAmount("");
      setTradeComment("");

      // Refresh user balance after trade
      setTimeout(async () => {
        if (isConnected && coinData?.address) {
          const balance = await getFormattedBalance(
            "erc20",
            coinData.address as `0x${string}`
          );
          setUserBalance(balance);
        }
      }, 2000);
    } catch (error) {
      // Error toast is already handled in useZoraTrade
    }
  };

  // Fetch user's coin balance when connected (optimized)
  useEffect(() => {
    const fetchUserBalance = async () => {
      if (!isConnected || !coinData?.address) {
        setUserBalance(null);
        return;
      }

      try {
        const balance = await getFormattedBalance(
          "erc20",
          coinData.address as `0x${string}`
        );
        setUserBalance(balance);
      } catch (err) {
        // Balance fetching failed silently
        setUserBalance(null);
      }
    };

    fetchUserBalance();
  }, [isConnected, coinData?.address, getFormattedBalance]);

  return {
    // State
    isBuying,
    setIsBuying,
    tradeAmount,
    setTradeAmount,
    tradeComment,
    setTradeComment,
    quoteResult,
    loadingQuote,
    formattedQuoteOutput,
    userBalance,
    
    // Actions
    handleTrade,
    
    // External state
    isTrading,
    ethBalance,
  };
};
