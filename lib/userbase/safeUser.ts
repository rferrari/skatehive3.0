import crypto from "crypto";

export function getSafeUserIdentifier(userId: string) {
  const secret =
    process.env.USERBASE_INTERNAL_TOKEN ||
    process.env.USERBASE_KEY_ENCRYPTION_SECRET;
  if (!secret) return null;
  return crypto
    .createHmac("sha256", secret)
    .update(userId)
    .digest("hex")
    .slice(0, 16);
}
