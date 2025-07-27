import HiveClient from "@/lib/hive/hiveclient"
import { useEffect, useState } from "react"
import { ExtendedAccount } from "@hiveio/dhive";

interface HiveAccountMetadataProps {
  [key: string]: any
}
export interface HiveAccount extends ExtendedAccount {
  metadata?: HiveAccountMetadataProps
  pending_claimed_accounts?: string | number;
}

export default function useHiveAccount(username: string) {
    const [hiveAccount, setHiveAccount] = useState<HiveAccount | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const handleGetHiveAccount = async () => {
            console.log("🔄 useHiveAccount: Starting to fetch account for:", username);
            setIsLoading(true)
            setError(null)
            try {
                const userData = await HiveClient.database.getAccounts([username])
                console.log("📊 useHiveAccount: Received user data:", {
                    hasData: !!userData[0],
                    hasJsonMetadata: !!userData[0]?.json_metadata,
                    hasPostingJsonMetadata: !!userData[0]?.posting_json_metadata
                });
                
                const userAccount: HiveAccount = {
                    ...userData[0],
                }
                if (userAccount.posting_json_metadata) {
                    userAccount.metadata = JSON.parse(userAccount.posting_json_metadata)
                } else if (userAccount.json_metadata) {
                    userAccount.metadata = JSON.parse(userAccount.json_metadata)
                } else {
                    userAccount.metadata = {} 
                }
                console.log("✅ useHiveAccount: Setting hive account with metadata:", {
                    hasMetadata: !!userAccount.metadata,
                    metadataKeys: userAccount.metadata ? Object.keys(userAccount.metadata) : []
                });
                setHiveAccount(userAccount)
            } catch (error) {
                console.error("❌ useHiveAccount: Error loading account:", error);
                setError("Loading account error!")
            } finally {
                console.log("🏁 useHiveAccount: Finished loading, setting isLoading to false");
                setIsLoading(false)
            }
        }
        if (username) {
            handleGetHiveAccount()
        } else {
            console.log("🔄 useHiveAccount: No username provided, skipping fetch");
        }
    }, [username]);
    return { hiveAccount, isLoading, error }
}
