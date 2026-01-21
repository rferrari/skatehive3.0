import { useAioha } from "@aioha/react-ui";
import { KeyTypes } from "@aioha/aioha";
import { getProfile } from "@/lib/hive/client-functions";
import { TransactionResult, ConversionDirection } from "@/components/wallet/modals/types";

/**
 * Hook for HBD-specific wallet operations
 * Provides type-safe methods for sending and converting HBD
 */
export function useHBDActions() {
    const { user, aioha } = useAioha();

    /**
     * Send HBD to another account
     * @param to - Recipient username
     * @param amount - Amount of HBD to send
     * @param memo - Optional memo (prefix with # for encryption)
     * @returns Transaction result
     */
    const sendHBD = async (
        to: string,
        amount: number,
        memo?: string
    ): Promise<TransactionResult> => {
        try {
            // Validate recipient account exists
            await getProfile(to);

            const result = await aioha.transfer(to, amount, 'HBD', memo);
            return {
                success: true,
                result,
            };
        } catch (err: any) {
            return {
                success: false,
                error: err.message || "Failed to send HBD",
                errorCode: err.code || 4001,
            };
        }
    };

    /**
     * Convert between HIVE and HBD
     * @param amount - Amount to convert
     * @param direction - Conversion direction (HIVE_TO_HBD or HBD_TO_HIVE)
     * @returns Transaction result
     */
    const convertHive = async (
        amount: number,
        direction: ConversionDirection
    ): Promise<TransactionResult> => {
        try {
            const nai = direction === "HIVE_TO_HBD" ? "@@000000013" : "@@000000014";

            const result = await aioha.signAndBroadcastTx(
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

            return {
                success: true,
                result,
            };
        } catch (err: any) {
            return {
                success: false,
                error: err.message || "Failed to convert",
                errorCode: err.code || 4001,
            };
        }
    };

    return {
        sendHBD,
        convertHive,
    };
}
