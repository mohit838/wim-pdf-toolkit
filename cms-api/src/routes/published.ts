import crypto from "node:crypto";
import type { Transporter } from "nodemailer";
import nodemailer from "nodemailer";
import { sanitize } from "payload-sanitizer";
import { Router } from "express";
import sanitizeHtml from "sanitize-html";
import { cmsEnv } from "../lib/env";
import { getClientIpFromRequest } from "../lib/client-ip";
import { checkRateLimit } from "../lib/redis";
import { getPublishedConfig, getPublishedContentLibrary, getPublishedSiteContent } from "../lib/storage";

function environmentMatches(value: "all" | "dev" | "prod"): boolean {
  return value === "all" || value === cmsEnv.appMode;
}

export const publishedRouter = Router();

const globalForContactMail = globalThis as typeof globalThis & {
  cmsContactMailTransporter?: Transporter;
};

function shouldApplyIpRateLimit(ipAddress: string): boolean {
  const ip = ipAddress.trim().toLowerCase();
  if (!ip || ip === "unknown" || ip === "::1" || ip === "127.0.0.1") {
    return false;
  }

  if (ip.startsWith("10.") || ip.startsWith("192.168.") || ip.startsWith("169.254.")) {
    return false;
  }

  if (ip.startsWith("fc") || ip.startsWith("fd") || ip.startsWith("fe80:")) {
    return false;
  }

  if (ip.startsWith("172.")) {
    const secondOctet = Number.parseInt(ip.split(".")[1] || "", 10);
    if (Number.isFinite(secondOctet) && secondOctet >= 16 && secondOctet <= 31) {
      return false;
    }
  }

  return true;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function toPlainText(value: unknown): string {
  return sanitizeHtml(String(value || ""), {
    allowedTags: [],
    allowedAttributes: {},
  }).trim();
}

function validateEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function countLinks(value: string): number {
  const matches = value.match(/(https?:\/\/|www\.)/gi);
  return matches ? matches.length : 0;
}

function hashForRateLimit(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex").slice(0, 32);
}

function getTransporter(): Transporter {
  if (globalForContactMail.cmsContactMailTransporter) {
    return globalForContactMail.cmsContactMailTransporter;
  }

  globalForContactMail.cmsContactMailTransporter = nodemailer.createTransport({
    host: cmsEnv.smtpHost,
    port: cmsEnv.smtpPort,
    secure: cmsEnv.smtpSecure,
    auth: cmsEnv.smtpUser || cmsEnv.smtpPassword
      ? {
        user: cmsEnv.smtpUser,
        pass: cmsEnv.smtpPassword,
      }
      : undefined,
  });

  return globalForContactMail.cmsContactMailTransporter;
}

publishedRouter.get("/site-runtime-config", async (_request, response) => {
  const config = await getPublishedConfig();

  response.json({
    success: true,
    data: {
      ...config,
      integrations: config.integrations.filter((integration) => environmentMatches(integration.environment)),
      adPlacements: config.adPlacements.filter((placement) => environmentMatches(placement.environment)),
    },
  });
});

publishedRouter.get("/site-content", async (_request, response) => {
  response.json({
    success: true,
    data: await getPublishedSiteContent(),
  });
});

publishedRouter.get("/content-library", async (_request, response) => {
  response.json({
    success: true,
    data: await getPublishedContentLibrary(),
  });
});

publishedRouter.get("/legal/:slug", async (request, response) => {
  const contentLibrary = await getPublishedContentLibrary();
  const slug = String(request.params.slug || "");
  const page = contentLibrary.legalPages[slug];

  if (!page) {
    response.status(404).json({
      success: false,
      message: "Legal page not found.",
    });
    return;
  }

  response.json({
    success: true,
    data: page,
  });
});

publishedRouter.get("/faq", async (_request, response) => {
  response.json({
    success: true,
    data: (await getPublishedContentLibrary()).faq,
  });
});

publishedRouter.get("/guides", async (_request, response) => {
  response.json({
    success: true,
    data: (await getPublishedContentLibrary()).guides,
  });
});

publishedRouter.get("/guides/:slug", async (request, response) => {
  const contentLibrary = await getPublishedContentLibrary();
  const slug = String(request.params.slug || "");
  const guide = contentLibrary.guides.find((entry) => entry.slug === slug);

  if (!guide) {
    response.status(404).json({
      success: false,
      message: "Guide not found.",
    });
    return;
  }

  response.json({
    success: true,
    data: guide,
  });
});

publishedRouter.get("/ads.txt", async (_request, response) => {
  const config = await getPublishedConfig();
  response.type("text/plain").send(config.adsTxtLines.join("\n"));
});

publishedRouter.get("/ads/resolve", async (request, response) => {
  const config = await getPublishedConfig();
  const slotId = String(request.query.slotId || "");
  const scope = String(request.query.scope || "");
  const rawCategories = String(request.query.categories || "");
  const categories = rawCategories
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  const placement = config.adPlacements.find((item) => {
    if (!item.enabled || item.slotId !== slotId || !environmentMatches(item.environment)) {
      return false;
    }

    if (scope && !item.scopes.includes(scope as typeof item.scopes[number])) {
      return false;
    }

    if (categories.length === 0) {
      return true;
    }

    return categories.some((category) => item.categories.includes(category));
  });

  response.json({
    success: true,
    data: placement || null,
  });
});

publishedRouter.post("/contact", async (request, response) => {
  const ipAddress = getClientIpFromRequest(request);

  try {
    const cleanedPayload = sanitize(request.body, {
      drop: ["undefined", "null", "emptyString", "whitespaceString", "nan"],
      trimStrings: true,
      cleanArrays: true,
    }) as Record<string, unknown>;

    const name = toPlainText(cleanedPayload.name);
    const email = toPlainText(cleanedPayload.email).toLowerCase();
    const subject = toPlainText(cleanedPayload.subject);
    const message = toPlainText(cleanedPayload.message);
    const honeypot = toPlainText(cleanedPayload.website);

    if (name.length < 2 || name.length > 120) {
      response.status(400).json({ success: false, message: "Please enter your name." });
      return;
    }

    if (!validateEmail(email) || email.length > 180) {
      response.status(400).json({ success: false, message: "Please enter a valid email address." });
      return;
    }

    if (subject.length < 1 || subject.length > 180) {
      response.status(400).json({ success: false, message: "Please enter a subject line." });
      return;
    }

    if (message.length < 5 || message.length > 5000) {
      response.status(400).json({ success: false, message: "Please enter a message." });
      return;
    }

    if (honeypot.length > 0) {
      response.status(400).json({ success: false, message: "Invalid request." });
      return;
    }

    if (countLinks(`${subject} ${message}`) > cmsEnv.contactMaxLinks) {
      response.status(400).json({
        success: false,
        message: "Please remove excessive links and try again.",
      });
      return;
    }

    if (shouldApplyIpRateLimit(ipAddress)) {
      const ipLimit = await checkRateLimit(
        `contact:ip:${ipAddress}`,
        cmsEnv.contactRateLimitIpMaxRequests,
        cmsEnv.contactRateLimitIpWindowSeconds,
      );
      if (!ipLimit.allowed) {
        response.setHeader("retry-after", ipLimit.headers["Retry-After"] || "60");
        response.status(429).json({
          success: false,
          message: "Too many contact requests from this network. Please try again later.",
        });
        return;
      }
    }

    const emailKey = hashForRateLimit(email);
    const emailLimit = await checkRateLimit(
      `contact:email:${emailKey}`,
      cmsEnv.contactRateLimitEmailMaxRequests,
      cmsEnv.contactRateLimitEmailWindowSeconds,
    );
    if (!emailLimit.allowed) {
      response.setHeader("retry-after", emailLimit.headers["Retry-After"] || "60");
      response.status(429).json({
        success: false,
        message: "Too many contact attempts for this email. Please try again tomorrow.",
      });
      return;
    }

    const payloadKey = hashForRateLimit(`${email}\n${subject}\n${message}`);
    const payloadLimit = await checkRateLimit(
      `contact:payload:${payloadKey}`,
      cmsEnv.contactRateLimitPayloadMaxRequests,
      cmsEnv.contactRateLimitPayloadWindowSeconds,
    );
    if (!payloadLimit.allowed) {
      response.setHeader("retry-after", payloadLimit.headers["Retry-After"] || "60");
      response.status(429).json({
        success: false,
        message: "Duplicate message detected. Please wait before sending again.",
      });
      return;
    }

    const siteContent = await getPublishedSiteContent();
    const siteData = siteContent.site as any;
    const supportEmail = toPlainText(siteData.contact?.email).toLowerCase();
    const fallbackSupportEmail = cmsEnv.smtpFromAddress.trim().toLowerCase();
    const deliveryEmail = supportEmail || fallbackSupportEmail;

    if (!validateEmail(deliveryEmail)) {
      throw new Error("Support email is not configured.");
    }

    if (!cmsEnv.smtpHost || !cmsEnv.smtpFromAddress) {
      throw new Error("SMTP is not configured for contact delivery.");
    }

    const transporter = getTransporter();

    await transporter.sendMail({
      from: cmsEnv.smtpFromAddress,
      to: deliveryEmail,
      replyTo: email,
      subject: `[PDF Toolkit Contact] ${subject}`,
      text: [
        `Name: ${name}`,
        `Email: ${email}`,
        `IP: ${ipAddress}`,
        "",
        message,
      ].join("\n"),
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.6;color:#0f172a">
          <h2 style="margin:0 0 16px">New contact form submission</h2>
          <p><strong>Name:</strong> ${escapeHtml(name)}</p>
          <p><strong>Email:</strong> ${escapeHtml(email)}</p>
          <p><strong>IP:</strong> ${escapeHtml(ipAddress)}</p>
          <p><strong>Subject:</strong> ${escapeHtml(subject)}</p>
          <hr style="margin:24px 0;border:none;border-top:1px solid #cbd5e1" />
          <p style="white-space:pre-wrap">${escapeHtml(message)}</p>
        </div>
      `,
    });

    response.json({
      success: true,
      data: {
        message: "Your message was sent. We will review it and reply to your email if needed.",
      },
    });
  } catch (error) {
    console.error("Published contact delivery failed", error);

    response.status(500).json({
      success: false,
      message: "We could not send your message right now. Please try again later or email support directly.",
    });
  }
});
