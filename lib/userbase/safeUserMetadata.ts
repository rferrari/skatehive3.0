import { parseJsonMetadata } from "@/lib/hive/metadata-utils";

export function extractSafeUser(metadata: any): string | null {
  const parsed = parseJsonMetadata(metadata);
  if (parsed && typeof parsed === "object") {
    if (typeof (parsed as any).skatehive_user === "string") {
      return (parsed as any).skatehive_user;
    }
    if (typeof (parsed as any).safe_user === "string") {
      return (parsed as any).safe_user;
    }
    const onchain = (parsed as any).onchain;
    if (onchain && typeof onchain === "object") {
      if (typeof onchain.skatehive_user === "string") {
        return onchain.skatehive_user;
      }
      if (typeof onchain.safe_user === "string") {
        return onchain.safe_user;
      }
    }
  }
  return null;
}
