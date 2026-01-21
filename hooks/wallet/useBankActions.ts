import { useAioha } from "@aioha/react-ui";
import { KeyTypes } from "@aioha/aioha";
import { KeychainSDK, KeychainKeyTypes } from "keychain-sdk";
import { Operation } from "@hiveio/dhive";
import { TransactionResult, WalletCurrency } from "@/components/wallet/modals/types";

/**
 * Hook for SkateBank operations (savings and interest)
 * Provides type-safe methods for managing HBD and HIVE savings
 */
export function useBankActions() {
    const { user, aioha } = useAioha();

    /**
     * Deposit funds to savings account
     * @param amount - Amount to deposit
     * @param currency - Currency type (HIVE or HBD)
     * @param memo - Optional memo
     * @returns Transaction result
     */
    const depositToSavings = async (
        amount: number,
        currency: WalletCurrency,
        memo?: string
    ): Promise<TransactionResult> => {
        try {
            const result = await aioha.signAndBroadcastTx(
                [
                    [
                        "transfer_to_savings",
                        {
                            from: user,
                            to: user,
                            amount: amount.toFixed(3) + ` ${currency}`,
                            memo: memo || "",
                        },
                    ],
                ],
                KeyTypes.Active
            );

            if (result && typeof result === 'object' && 'success' in result && !result.success) {
                return {
                    success: false,
                    error: result.message || result.msg || result.error || `Failed to deposit ${currency} to savings`,
                    errorCode: result.code || 4001,
                };
            }

            return {
                success: true,
                result: typeof result === 'string' ? result : (result.id || result.tx_id || result.transaction_id || JSON.stringify(result)),
            };
        } catch (err: any) {
            return {
                success: false,
                error: err.message || `Failed to deposit ${currency} to savings`,
                errorCode: err.code || 4001,
            };
        }
    };

    /**
     * Withdraw funds from savings account
     * @param amount - Amount to withdraw
     * @param currency - Currency type (HIVE or HBD)
     * @param memo - Optional memo
     * @returns Transaction result
     */
    const withdrawFromSavings = async (
        amount: number,
        currency: WalletCurrency,
        memo?: string
    ): Promise<TransactionResult> => {
        try {
            const result = await aioha.signAndBroadcastTx(
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

            if (result && typeof result === 'object' && 'success' in result && !result.success) {
                return {
                    success: false,
                    error: result.message || result.msg || result.error || `Failed to withdraw ${currency} from savings`,
                    errorCode: result.code || 4001,
                };
            }

            return {
                success: true,
                result: typeof result === 'string' ? result : (result.id || result.tx_id || result.transaction_id || JSON.stringify(result)),
            };
        } catch (err: any) {
            return {
                success: false,
                error: err.message || `Failed to withdraw ${currency} from savings`,
                errorCode: err.code || 4001,
            };
        }
    };

    /**
     * Claim HBD interest by triggering a small savings transaction
     * This is a workaround to claim accumulated interest
     * @returns Transaction result
     */
    const claimInterest = async (): Promise<TransactionResult> => {
        if (!user) {
            return {
                success: false,
                error: "User is not connected",
                errorCode: 4001,
            };
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

            if (response && !response.success) {
                return {
                    success: false,
                    error: (response as any).message || (response as any).msg || (response as any).error || "Failed to claim HBD interest",
                    errorCode: (response as any).code || 4001,
                };
            }

            return {
                success: true,
                result: typeof response === 'string' ? response : ((response as any).result?.id || (response as any).id || (response as any).tx_id || JSON.stringify(response)),
            };
        } catch (err: any) {
            return {
                success: false,
                error: err.message || "Failed to claim HBD interest",
                errorCode: err.code || 4001,
            };
        }
    };

    return {
        depositToSavings,
        withdrawFromSavings,
        claimInterest,
    };
}
