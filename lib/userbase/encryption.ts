import crypto from "crypto";

const SECRET_ENV = "USERBASE_KEY_ENCRYPTION_SECRET";

function getKey() {
  const secret = process.env[SECRET_ENV];
  if (!secret) {
    throw new Error(`${SECRET_ENV} is not set`);
  }
  return crypto.scryptSync(secret, "skatehive-userbase", 32);
}

export function encryptSecret(plaintext: string) {
  const key = getKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  return JSON.stringify({
    v: 1,
    iv: iv.toString("base64"),
    tag: tag.toString("base64"),
    data: encrypted.toString("base64"),
  });
}

export function decryptSecret(payload: string) {
  let parsed: { iv: string; tag: string; data: string };
  try {
    parsed = JSON.parse(payload);
  } catch (error) {
    throw new Error("Invalid encrypted payload");
  }

  if (!parsed?.iv || !parsed?.tag || !parsed?.data) {
    throw new Error("Invalid encrypted payload");
  }

  const key = getKey();
  const iv = Buffer.from(parsed.iv, "base64");
  const tag = Buffer.from(parsed.tag, "base64");
  const data = Buffer.from(parsed.data, "base64");
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);

  const decrypted = Buffer.concat([
    decipher.update(data),
    decipher.final(),
  ]);

  return decrypted.toString("utf8");
}
