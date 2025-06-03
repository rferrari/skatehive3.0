import { useAioha } from "@aioha/react-ui";
import { KeyTypes } from "@aioha/aioha";
import { KeychainSDK } from "keychain-sdk";

export function useWalletActions() {
  const { user, aioha } = useAioha();

  const handleConfirm = async (
    amount: number,
    direction?: "HIVE_TO_HBD" | "HBD_TO_HIVE",
    username?: string,
    memo?: string,
    actionType?: string
  ) => {
    if (!actionType) return;

    switch (actionType) {
      case "Send HIVE":
        if (username) {
          await aioha.transfer(username, amount, 'HIVE', memo);
        }
        break;
      case "Power Up":
        await aioha.stakeHive(amount);
        break;
      case "Convert HIVE":
        const nai = direction === "HIVE_TO_HBD" ? "@@000000013" : "@@000000014";
        await aioha.signAndBroadcastTx(
          [
            [
              "convert",
              {
                owner: user,
                requestid: Math.floor(1000000000 + Math.random() * 9000000000),
                amount: {
                  amount: amount.toFixed(3),
                  precision: 3,
                  nai,
                },
              },
            ],
          ],
          KeyTypes.Active
        );
        break;
      case "HIVE Savings":
        await aioha.signAndBroadcastTx(
          [
            [
              "transfer_to_savings",
              {
                from: user,
                to: user,
                amount: amount.toFixed(3) + " HIVE",
                memo: memo || "",
              },
            ],
          ],
          KeyTypes.Active
        );
        break;
      case "Power Down":
        await aioha.unstakeHive(amount);
        break;
      case "Delegate":
        if (username) {
          await aioha.delegateStakedHive(username, amount);
        }
        break;
      case "Send HBD":
        if (username) {
          await aioha.transfer(username, amount, 'HBD', memo);
        }
        break;
      case "HBD Savings":
        await aioha.signAndBroadcastTx(
          [
            [
              "transfer_to_savings",
              {
                from: user,
                to: user,
                amount: amount.toFixed(3) + " HBD",
                memo: memo || "",
              },
            ],
          ],
          KeyTypes.Active
        );
        break;
      case "Withdraw HBD Savings":
      case "Withdraw HIVE Savings":
        const currency = actionType.includes("HBD") ? "HBD" : "HIVE";
        await aioha.signAndBroadcastTx(
          [
            [
              "transfer_from_savings",
              {
                from: user,
                to: user,
                request_id: Math.floor(1000000000 + Math.random() * 9000000000),
                amount: amount.toFixed(3) + ` ${currency}`,
                memo: memo || "",
              },
            ],
          ],
          KeyTypes.Active
        );
        break;
    }
  };

  const handleClaimInterest = async () => {
    if (!user) return;
    try {
      const keychain = new KeychainSDK(window);
      await keychain.transfer({
        username: String(user),
        to: String(user),
        amount: "0.001",
        memo: "Claim HBD interest",
        enforce: false,
        currency: "HBD",
      });
    } catch (e) {
      console.error(e);
    }
  };

  return { handleConfirm, handleClaimInterest };
}
