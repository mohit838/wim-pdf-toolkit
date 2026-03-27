import type { Request } from "express";

function parseFirstForwardedIp(value: string): string {
  return value.split(",")[0]?.trim() || "";
}

function normalizeIp(value: string): string {
  if (!value) {
    return "";
  }

  return value.replace(/^\[|\]$/g, "");
}

function isPrivateOrLoopbackIp(value: string): boolean {
  const ip = normalizeIp(value).toLowerCase();
  if (!ip || ip === "unknown") {
    return false;
  }

  if (ip === "::1" || ip === "127.0.0.1" || ip.startsWith("::ffff:127.")) {
    return true;
  }

  if (ip.startsWith("10.") || ip.startsWith("::ffff:10.")) {
    return true;
  }

  if (ip.startsWith("192.168.") || ip.startsWith("::ffff:192.168.")) {
    return true;
  }

  if (ip.startsWith("169.254.") || ip.startsWith("::ffff:169.254.")) {
    return true;
  }

  if (ip.startsWith("fc") || ip.startsWith("fd") || ip.startsWith("fe80:")) {
    return true;
  }

  if (ip.startsWith("172.") || ip.startsWith("::ffff:172.")) {
    const dotted = ip.startsWith("::ffff:") ? ip.slice("::ffff:".length) : ip;
    const secondOctet = Number.parseInt(dotted.split(".")[1] || "", 10);
    return Number.isFinite(secondOctet) && secondOctet >= 16 && secondOctet <= 31;
  }

  return false;
}

export function getClientIpFromRequest(request: Request): string {
  const remoteAddress = request.socket.remoteAddress || "unknown";
  const forwardedFor = request.headers["x-forwarded-for"];

  if (isPrivateOrLoopbackIp(remoteAddress)) {
    if (Array.isArray(forwardedFor)) {
      const fromHeader = parseFirstForwardedIp(forwardedFor[0] || "");
      if (fromHeader) {
        return fromHeader;
      }
    }

    if (typeof forwardedFor === "string" && forwardedFor.trim()) {
      const fromHeader = parseFirstForwardedIp(forwardedFor);
      if (fromHeader) {
        return fromHeader;
      }
    }
  }

  return remoteAddress;
}
