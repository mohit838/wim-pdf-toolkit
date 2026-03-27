import crypto from "node:crypto";
import type { Request, Response } from "express";
import { prisma } from "./prisma";
import { cmsEnv } from "./env";
import { hashPassword, verifyPassword } from "./password";
import {
  createRedisSession,
  deleteRedisSession,
  readRedisSession,
  touchRedisSession,
} from "./redis";
import { getUserById } from "./storage";
import type { SessionPayload, SessionUser, StoredUser } from "./types";

const SESSION_COOKIE_NAME = "cms_admin_session";
const TWO_FACTOR_CHALLENGE_DURATION_MS = 1000 * 60 * 10;
const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

function createSignature(value: string): string {
  return crypto.createHmac("sha256", cmsEnv.sessionSecret).update(value).digest("base64url");
}

function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) {
    return false;
  }

  return crypto.timingSafeEqual(left, right);
}

function createSignedToken<T extends object>(payload: T): string {
  const base = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  return `${base}.${createSignature(base)}`;
}

function readSignedToken<T extends object>(token: string): T | null {
  const [payloadSegment, signature] = token.split(".");
  if (!payloadSegment || !signature) {
    return null;
  }

  const expectedSignature = createSignature(payloadSegment);
  if (!safeEqual(signature, expectedSignature)) {
    return null;
  }

  try {
    return JSON.parse(Buffer.from(payloadSegment, "base64url").toString("utf8")) as T;
  } catch {
    return null;
  }
}

interface TwoFactorChallengePayload {
  userId: string;
  email: string;
  exp: number;
}

function parseCookies(header: string | undefined): Map<string, string> {
  const cookies = new Map<string, string>();
  if (!header) {
    return cookies;
  }

  for (const part of header.split(";")) {
    const [rawName, ...rawValue] = part.trim().split("=");
    if (!rawName) {
      continue;
    }

    cookies.set(rawName, rawValue.join("="));
  }

  return cookies;
}

function buildCookieAttributes(maxAgeSeconds: number): string[] {
  const attributes = [
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${maxAgeSeconds}`,
  ];

  if (cmsEnv.secureCookies) {
    attributes.push("Secure");
  }

  if (cmsEnv.cookieDomain) {
    attributes.push(`Domain=${cmsEnv.cookieDomain}`);
  }

  return attributes;
}

export async function createSessionCookie(user: SessionUser, request: Request): Promise<string> {
  const sessionId = crypto.randomUUID();
  const payload: SessionPayload = {
    ...user,
    exp: Date.now() + cmsEnv.sessionTtlSeconds * 1000,
  };

  await createRedisSession(sessionId, payload, cmsEnv.sessionTtlSeconds);
  await prisma.adminSession.create({
    data: {
      sessionId,
      userId: user.id,
      expiresAt: new Date(payload.exp),
      lastSeenAt: new Date(),
      ipAddress: request.socket.remoteAddress || null,
      userAgent: request.headers["user-agent"] || null,
    },
  });

  return [
    `${SESSION_COOKIE_NAME}=${sessionId}`,
    ...buildCookieAttributes(cmsEnv.sessionTtlSeconds),
  ].join("; ");
}

export function clearSessionCookie(): string {
  return [
    `${SESSION_COOKIE_NAME}=`,
    ...buildCookieAttributes(0),
  ].join("; ");
}

async function loadSessionPayload(request: Request): Promise<{ sessionId: string; payload: SessionPayload } | null> {
  const cookies = parseCookies(request.headers.cookie);
  const sessionId = cookies.get(SESSION_COOKIE_NAME);
  if (!sessionId) {
    return null;
  }

  const payload = await readRedisSession<SessionPayload>(sessionId);
  if (!payload || payload.exp <= Date.now()) {
    await deleteRedisSession(sessionId);
    return null;
  }

  await touchRedisSession(sessionId, cmsEnv.sessionTtlSeconds);
  await prisma.adminSession.updateMany({
    where: {
      sessionId,
      revokedAt: null,
    },
    data: {
      lastSeenAt: new Date(),
      expiresAt: new Date(Date.now() + cmsEnv.sessionTtlSeconds * 1000),
    },
  });

  return { sessionId, payload };
}

export async function destroySession(request: Request): Promise<void> {
  const cookies = parseCookies(request.headers.cookie);
  const sessionId = cookies.get(SESSION_COOKIE_NAME);
  if (!sessionId) {
    return;
  }

  await deleteRedisSession(sessionId);
  await prisma.adminSession.updateMany({
    where: {
      sessionId,
      revokedAt: null,
    },
    data: {
      revokedAt: new Date(),
    },
  });
}

export async function getSessionUser(request: Request): Promise<SessionUser | null> {
  const session = await loadSessionPayload(request);
  if (!session) {
    return null;
  }

  return {
    id: session.payload.id,
    email: session.payload.email,
    name: session.payload.name,
    role: session.payload.role,
    permissions: session.payload.permissions,
    twoFactorEnabled: session.payload.twoFactorEnabled,
  };
}

export function toSessionUser(user: StoredUser): SessionUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    permissions: user.permissions,
    twoFactorEnabled: user.twoFactorEnabled,
  };
}

export function generateTwoFactorSecret(bytes = 20): string {
  const source = crypto.randomBytes(bytes);
  let output = "";

  for (const byte of source) {
    output += BASE32_ALPHABET[byte % BASE32_ALPHABET.length];
  }

  return output;
}

function decodeBase32Secret(secret: string): Buffer {
  const cleanSecret = secret.replace(/=+$/g, "").toUpperCase().replace(/[^A-Z2-7]/g, "");
  let bits = "";

  for (const character of cleanSecret) {
    const index = BASE32_ALPHABET.indexOf(character);
    if (index < 0) {
      continue;
    }

    bits += index.toString(2).padStart(5, "0");
  }

  const bytes: number[] = [];
  for (let position = 0; position + 8 <= bits.length; position += 8) {
    bytes.push(Number.parseInt(bits.slice(position, position + 8), 2));
  }

  return Buffer.from(bytes);
}

function generateTotpCode(secret: string, timestamp = Date.now()): string {
  const counter = Math.floor(timestamp / 30_000);
  const secretBytes = decodeBase32Secret(secret);
  const counterBuffer = Buffer.alloc(8);
  counterBuffer.writeBigUInt64BE(BigInt(counter));
  const digest = crypto.createHmac("sha1", secretBytes).update(counterBuffer).digest();
  const offset = digest[digest.length - 1] & 0x0f;
  const binary = (
    ((digest[offset] & 0x7f) << 24) |
    ((digest[offset + 1] & 0xff) << 16) |
    ((digest[offset + 2] & 0xff) << 8) |
    (digest[offset + 3] & 0xff)
  );

  return String(binary % 1_000_000).padStart(6, "0");
}

export function verifyTwoFactorCode(secret: string, code: string): boolean {
  const normalizedCode = code.replace(/\s+/g, "");
  if (!/^\d{6}$/.test(normalizedCode)) {
    return false;
  }

  const offsets = [-30_000, 0, 30_000];
  return offsets.some((offset) => generateTotpCode(secret, Date.now() + offset) === normalizedCode);
}

export function buildOtpAuthUri(email: string, secret: string): string {
  const account = encodeURIComponent(email);
  const issuer = encodeURIComponent(cmsEnv.totpIssuer);
  return `otpauth://totp/${issuer}:${account}?secret=${secret}&issuer=${issuer}&algorithm=SHA1&digits=6&period=30`;
}

export function createTwoFactorChallenge(user: StoredUser): string {
  return createSignedToken<TwoFactorChallengePayload>({
    userId: user.id,
    email: user.email,
    exp: Date.now() + TWO_FACTOR_CHALLENGE_DURATION_MS,
  });
}

export function readTwoFactorChallenge(token: string): { userId: string; email: string } | null {
  const payload = readSignedToken<TwoFactorChallengePayload>(token);
  if (!payload || payload.exp <= Date.now()) {
    return null;
  }

  return {
    userId: payload.userId,
    email: payload.email,
  };
}

export async function refreshSessionUser(userId: string): Promise<SessionUser | null> {
  const user = await getUserById(userId);
  return user ? toSessionUser(user) : null;
}

export async function requireAuth(request: Request, response: Response): Promise<SessionUser | null> {
  const user = await getSessionUser(request);
  if (!user) {
    response.status(401).json({
      success: false,
      message: "Authentication required.",
    });
    return null;
  }

  return user;
}

export async function requirePermission(
  request: Request,
  response: Response,
  permission: string,
): Promise<SessionUser | null> {
  const user = await requireAuth(request, response);
  if (!user) {
    return null;
  }

  if (user.role === "SUPERADMIN" || user.permissions.includes("*") || user.permissions.includes(permission)) {
    return user;
  }

  response.status(403).json({
    success: false,
    message: "You do not have permission to perform this action.",
  });
  return null;
}

export { hashPassword, verifyPassword };
