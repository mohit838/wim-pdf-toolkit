import crypto from "node:crypto";

function bufferToBase64Url(buffer: Buffer): string {
  return buffer.toString("base64url");
}

function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) {
    return false;
  }

  return crypto.timingSafeEqual(left, right);
}

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16);
  const derived = crypto.scryptSync(password, salt, 64);
  return `${bufferToBase64Url(salt)}.${bufferToBase64Url(derived)}`;
}

export function verifyPassword(password: string, hash: string): boolean {
  const [encodedSalt, encodedHash] = hash.split(".");
  if (!encodedSalt || !encodedHash) {
    return false;
  }

  const salt = Buffer.from(encodedSalt, "base64url");
  const expected = Buffer.from(encodedHash, "base64url");
  const actual = crypto.scryptSync(password, salt, expected.length);
  return safeEqual(actual.toString("base64url"), expected.toString("base64url"));
}
