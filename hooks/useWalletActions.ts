import { useAioha } from "@aioha/react-ui";
import { KeyTypes } from "@aioha/aioha";
import { KeychainSDK, KeychainKeyTypes } from "keychain-sdk";
import { Operation } from "@hiveio/dhive";
import { getProfile } from "@/lib/hive/client-functions";

interface HiveRPCError extends Error {
  name: "RPCError";
  jse_info?: unknown;
}

function isHiveRPCError(err: unknown): err is HiveRPCError {
  return (
    typeof err === "object" &&
    err !== null &&
    "name" in err &&
    (err as any).name === "RPCError"
  );
}

function extractHiveRPCMessage(err: unknown): string {
  if (isHiveRPCError(err)) {
    if (err.jse_info && typeof err.jse_info === "object") {
      const chars = Object.values(err.jse_info)
        .filter((v): v is string => typeof v === "string")
        .join("");
      if (chars) return chars;
    }
    return err.message || "Unknown RPC error";
  }
  if (err instanceof Error) {
    return err.message;
  }
  return "Unknown error";
}

export function useWalletActions() {
  const { user, aioha } = useAioha();

  const handleConfirm = async (
    amount: number,
    direction?: "HIVE_TO_HBD" | "HBD_TO_HIVE",
    username?: string,
    memo?: string,
    actionType?: string
  ) => {
    let result: any;
    if (!actionType) return;

    // check if hive account exist
    if (username) {
      try {
        const transferTo = await getProfile(username);
      } catch (err: unknown) {
        return {
          error: extractHiveRPCMessage(err),
          errorCode: 4001,
          success: false
        };
      }
    }

    switch (actionType) {
      case "Send HIVE":
        if (username) {
          result = await aioha.transfer(username, amount, 'HIVE', memo);
        }
        break;
      case "Power Up":
        result = await aioha.stakeHive(amount);
        break;
      case "Convert HIVE":
        const nai = direction === "HIVE_TO_HBD" ? "@@000000013" : "@@000000014";
        result = await aioha.signAndBroadcastTx(
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
        result = await aioha.signAndBroadcastTx(
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
        result = await aioha.unstakeHive(amount);
        break;
      case "Delegate":
        if (username) {
          await aioha.delegateStakedHive(username, amount);
        }
        break;
      case "Send HBD":
        if (username) {
          result = await aioha.transfer(username, amount, 'HBD', memo);
        }
        break;
      case "HBD Savings":
        result = await aioha.signAndBroadcastTx(
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
        result = await aioha.signAndBroadcastTx(
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

    return result;
  };

  const handleClaimHbdInterest = async () => {
    if (!user) {
      console.error("User is not available.");
      return;
    }

    const op: Operation = [
      "transfer_to_savings",
      {
        from: user,
        to: user,
        amount: "0.001 HBD",
        memo: "Trigger HBD interest payment",
      },
    ];

    try {
      const keychain = new KeychainSDK(window);
      const response = await keychain.broadcast({
        username: user,
        operations: [op],
        method: KeychainKeyTypes.active,
      });
    } catch (error) {
      console.error("Error claiming HBD interest:", error);
    }
  };

  return { handleConfirm, handleClaimHbdInterest };
}
