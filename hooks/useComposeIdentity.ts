import { useMemo } from "react";
import { useAioha } from "@aioha/react-ui";
import { useLinkedIdentities } from "@/contexts/LinkedIdentityContext";
import { useUserbaseAuth } from "@/contexts/UserbaseAuthContext";

export type ComposeIdentity = {
  // Handle the post is authored as: wallet/Keychain user first, then the
  // primary linked Hive identity, then a userbase-only handle.
  handle: string | null;
  // Namespace compose drafts are stored under. The userbase id is preferred
  // because it survives handle changes (sponsorship, linking a Hive account);
  // Keychain-only sessions fall back to their Hive handle.
  draftKey: string | null;
  // Older namespaces whose drafts belong to this user and get folded into
  // `draftKey` (e.g. drafts written while logged in with Keychain only).
  draftAliasKeys: string[];
  // False while the session is still resolving, so callers don't load the
  // guest bucket first and then swap to the real user's drafts.
  isReady: boolean;
};

export function useComposeIdentity(): ComposeIdentity {
  const { user } = useAioha();
  const { hiveIdentity } = useLinkedIdentities();
  const { user: userbaseUser, isLoading } = useUserbaseAuth();

  const hiveHandle = user || hiveIdentity?.handle || null;
  const handle = hiveHandle || userbaseUser?.handle || null;
  const userbaseId = userbaseUser?.id ?? null;

  return useMemo(() => {
    const hiveKey = hiveHandle ? `hive:${hiveHandle}` : null;
    const draftKey = userbaseId ? `ub:${userbaseId}` : hiveKey;
    const draftAliasKeys = userbaseId && hiveKey ? [hiveKey] : [];

    return { handle, draftKey, draftAliasKeys, isReady: !isLoading };
  }, [handle, hiveHandle, isLoading, userbaseId]);
}
