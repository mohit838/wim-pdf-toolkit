import { ensureRootEnvLoaded } from "@/lib/root-env";
import { selectedCmsApiInternalOrigin } from "@/lib/server-env";

ensureRootEnvLoaded();

function getForwardedForHeader(request: Request): string | null {
  const candidates = [
    request.headers.get("x-forwarded-for"),
    request.headers.get("x-real-ip"),
    request.headers.get("cf-connecting-ip"),
    request.headers.get("true-client-ip"),
    request.headers.get("x-client-ip"),
    request.headers.get("x-vercel-forwarded-for"),
  ];

  for (const candidate of candidates) {
    if (!candidate) {
      continue;
    }

    const trimmed = candidate.trim();
    if (!trimmed) {
      continue;
    }

    return trimmed;
  }

  return null;
}

function parseJsonSafe(value: string): { success?: boolean; message?: string; data?: { message?: string } } {
  if (!value) {
    return {};
  }

  try {
    return JSON.parse(value) as { success?: boolean; message?: string; data?: { message?: string } };
  } catch {
    return {};
  }
}

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const forwardedFor = getForwardedForHeader(request);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    let response: Response;
    try {
      const headers: Record<string, string> = {
        "content-type": "application/json",
      };

      if (forwardedFor) {
        headers["x-forwarded-for"] = forwardedFor;
      }

      response = await fetch(`${selectedCmsApiInternalOrigin}/published/v1/contact`, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
        cache: "no-store",
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }

    const responseText = await response.text();
    const jsonPayload = parseJsonSafe(responseText);

    if (!response.ok || !jsonPayload.success) {
      return Response.json(
        {
          ok: false,
          message: jsonPayload.message || "We could not send your message right now.",
        },
        {
          status: response.status || 500,
        },
      );
    }

    return Response.json({
      ok: true,
      message: jsonPayload.data?.message || "Your message was sent successfully.",
    });
  } catch (error) {
    console.error("Contact form proxy failed", error);

    const isAbort = error instanceof Error && error.name === "AbortError";

    return Response.json(
      {
        ok: false,
        message: "We could not send your message right now. Please try again later or email support directly.",
      },
      {
        status: isAbort ? 504 : 500,
      },
    );
  }
}
