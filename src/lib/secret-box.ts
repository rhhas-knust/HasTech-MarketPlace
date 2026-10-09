import "server-only";
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

// Encrypts sellers' Paystack secret keys before they reach the database, so
// a database export, backup or SQL editor session shows only ciphertext. The
// key lives in the PAYMENT_CREDENTIALS_KEY environment variable (32 random
// bytes, base64), never in the database.
//
// Stored format: "enc:v1:<iv>:<auth tag>:<ciphertext>", each part base64.
// Values written before encryption existed have no prefix and are read as
// they are; getPaymentProviderForStore re-saves them encrypted. Until the
// environment variable is set, new values are stored as before, so
// payments keep working while the key is being configured.

const PREFIX = "enc:v1:";

function key(): Buffer {
  const raw = process.env.PAYMENT_CREDENTIALS_KEY;
  if (!raw) throw new Error("Missing PAYMENT_CREDENTIALS_KEY environment variable");
  const buf = Buffer.from(raw, "base64");
  if (buf.length !== 32) throw new Error("PAYMENT_CREDENTIALS_KEY must be 32 bytes, base64-encoded");
  return buf;
}

export function encryptionEnabled(): boolean {
  return Boolean(process.env.PAYMENT_CREDENTIALS_KEY);
}

export function isEncrypted(value: string): boolean {
  return value.startsWith(PREFIX);
}

export function encryptSecret(plain: string): string {
  if (!encryptionEnabled()) {
    console.warn("[secret-box] PAYMENT_CREDENTIALS_KEY is not set; storing the secret unencrypted");
    return plain;
  }
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const data = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  return PREFIX + [iv, cipher.getAuthTag(), data].map((b) => b.toString("base64")).join(":");
}

export function decryptSecret(stored: string): string {
  if (!isEncrypted(stored)) return stored;
  const [iv, tag, data] = stored.slice(PREFIX.length).split(":").map((p) => Buffer.from(p, "base64"));
  const decipher = createDecipheriv("aes-256-gcm", key(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
}
