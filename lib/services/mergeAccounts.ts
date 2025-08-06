import { KeychainSDK, KeychainKeyTypes } from "keychain-sdk";
import { Operation } from "@hiveio/dhive";
import fetchAccount from "@/lib/hive/fetchAccount";
import { migrateLegacyMetadata } from "@/lib/utils/metadataMigration";
import { generateProfileDiff, ProfileDiff } from "@/lib/utils/profileDiff";

export interface MergeAccountOptions {
  username: string;
  ethereumAddress?: string;
  farcasterProfile?: {
    fid: number;
    username: string;
    custody?: string;
    verifications?: string[];
  };
}

export interface MergeAccountResult {
  success: boolean;
  diff: ProfileDiff;
}

export async function generateMergePreview(options: MergeAccountOptions): Promise<ProfileDiff> {
  const { username, ethereumAddress, farcasterProfile } = options;

  if (!username) {
    throw new Error("Username is required");
  }

  try {
    const { jsonMetadata: currentMetadata } = await fetchAccount(username);
    const migrated = migrateLegacyMetadata(currentMetadata);

    return generateProfileDiff(currentMetadata, migrated, ethereumAddress, farcasterProfile);
  } catch (error) {
    console.error("Failed to generate merge preview", error);
    throw error;
  }
}

export async function mergeAccounts(options: MergeAccountOptions): Promise<MergeAccountResult> {
  const { username, ethereumAddress, farcasterProfile } = options;

  if (!username) {
    throw new Error("Username is required");
  }

  try {
    const { jsonMetadata: currentMetadata, postingMetadata } = await fetchAccount(username);

    // Generate diff for the result
    const diff = generateProfileDiff(currentMetadata, migrateLegacyMetadata(currentMetadata), ethereumAddress, farcasterProfile);

    const migrated = migrateLegacyMetadata(currentMetadata);
    migrated.extensions = migrated.extensions || {};

    // Handle Ethereum wallet connection
    if (ethereumAddress) {
      migrated.extensions.wallets = migrated.extensions.wallets || {};
      migrated.extensions.wallets.primary_wallet = ethereumAddress;
    }

    // Handle Farcaster profile connection
    if (farcasterProfile) {
      migrated.extensions.farcaster = migrated.extensions.farcaster || {};
      migrated.extensions.farcaster.username = farcasterProfile.username;
      migrated.extensions.farcaster.fid = farcasterProfile.fid;
      
      // Handle Farcaster wallets - keep them with Farcaster data
      if (farcasterProfile.custody) {
        migrated.extensions.farcaster.custody_address = farcasterProfile.custody;
      }
      if (Array.isArray(farcasterProfile.verifications) && farcasterProfile.verifications.length > 0) {
        migrated.extensions.farcaster.verified_wallets = farcasterProfile.verifications;
      }
    }

    const operation: Operation = [
      "account_update2",
      {
        account: username,
        json_metadata: JSON.stringify(migrated),
        posting_json_metadata: JSON.stringify(postingMetadata),
        extensions: [],
      },
    ];

    const keychain = new KeychainSDK(window);
    const formParams = {
      data: {
        username: username,
        operations: [operation],
        method: KeychainKeyTypes.active,
      },
    };

    const result = await keychain.broadcast(formParams.data as any);

    if (!result) {
      throw new Error("Merge failed");
    }

    return {
      success: true,
      diff
    };
  } catch (error) {
    console.error("Failed to merge accounts", error);
    throw error;
  }
}
