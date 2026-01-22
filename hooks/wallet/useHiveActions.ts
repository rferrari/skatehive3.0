import { useAioha } from "@aioha/react-ui";
import { KeyTypes } from "@aioha/aioha";
import { getProfile } from "@/lib/hive/client-functions";
import { TransactionResult } from "@/components/wallet/modals/types";

/**
 * Hook for HIVE-specific wallet operations
 * Provides type-safe methods for sending, staking, and delegating HIVE
 */
export function useHiveActions() {
    const { user, aioha } = useAioha();

    /**
     * Send HIVE to another account
     * @param to - Recipient username
     * @param amount - Amount of HIVE to send
     * @param memo - Optional memo (prefix with # for encryption)
     * @returns Transaction result
     */
    const sendHive = async (
        to: string,
        amount: number,
        memo?: string
    ): Promise<TransactionResult> => {
        try {
            // Validate recipient account exists
            await getProfile(to);

            const result = await aioha.transfer(to, amount, 'HIVE', memo);
            if (result && typeof result === 'object' && 'success' in result && !result.success) {
                return {
                    success: false,
                    error: result.message || result.msg || result.error || "Failed to send HIVE",
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
                error: err.message || "Failed to send HIVE",
                errorCode: err.code || 4001,
            };
        }
    };

    /**
     * Power up HIVE (convert to Hive Power)
     * @param amount - Amount of HIVE to power up
     * @returns Transaction result
     */
    const powerUp = async (amount: number): Promise<TransactionResult> => {
        try {
            const result = await aioha.stakeHive(amount);
            if (result && typeof result === 'object' && 'success' in result && !result.success) {
                return {
                    success: false,
                    error: result.message || result.msg || result.error || "Failed to power up HIVE",
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
                error: err.message || "Failed to power up HIVE",
                errorCode: err.code || 4001,
            };
        }
    };

    /**
     * Power down HIVE (unstake Hive Power)
     * @param amount - Amount of Hive Power to power down
     * @returns Transaction result
     */
    const powerDown = async (amount: number): Promise<TransactionResult> => {
        try {
            const result = await aioha.unstakeHive(amount);
            if (result && typeof result === 'object' && 'success' in result && !result.success) {
                return {
                    success: false,
                    error: result.message || result.msg || result.error || "Failed to power down HIVE",
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
                error: err.message || "Failed to power down HIVE",
                errorCode: err.code || 4001,
            };
        }
    };

    /**
     * Delegate Hive Power to another account
     * @param to - Recipient username
     * @param amount - Amount of Hive Power to delegate
     * @returns Transaction result
     */
    const delegate = async (
        to: string,
        amount: number
    ): Promise<TransactionResult> => {
        try {
            // Validate recipient account exists
            await getProfile(to);

            const result = await aioha.delegateStakedHive(to, amount);
            if (result && typeof result === 'object' && 'success' in result && !result.success) {
                return {
                    success: false,
                    error: result.message || result.msg || result.error || "Failed to delegate HIVE",
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
                error: err.message || "Failed to delegate HIVE",
                errorCode: err.code || 4001,
            };
        }
    };

    /**
     * Transfer HIVE to savings
     * @param amount - Amount of HIVE to transfer to savings
     * @param memo - Optional memo
     * @returns Transaction result
     */
    const transferToSavings = async (
        amount: number,
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
                            amount: amount.toFixed(3) + " HIVE",
                            memo: memo || "",
                        },
                    ],
                ],
                KeyTypes.Active
            );

            if (result && typeof result === 'object' && 'success' in result && !result.success) {
                return {
                    success: false,
                    error: result.message || result.msg || result.error || "Failed to transfer HIVE to savings",
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
                error: err.message || "Failed to transfer HIVE to savings",
                errorCode: err.code || 4001,
            };
        }
    };

    /**
     * Withdraw HIVE from savings
     * @param amount - Amount of HIVE to withdraw from savings
     * @param memo - Optional memo
     * @returns Transaction result
     */
    const withdrawFromSavings = async (
        amount: number,
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
                            amount: amount.toFixed(3) + " HIVE",
                            memo: memo || "",
                        },
                    ],
                ],
                KeyTypes.Active
            );

            if (result && typeof result === 'object' && 'success' in result && !result.success) {
                return {
                    success: false,
                    error: result.message || result.msg || result.error || "Failed to withdraw HIVE from savings",
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
                error: err.message || "Failed to withdraw HIVE from savings",
                errorCode: err.code || 4001,
            };
        }
    };

    return {
        sendHive,
        powerUp,
        powerDown,
        delegate,
        transferToSavings,
        withdrawFromSavings,
    };
}
