import type { NextRequest } from "next/server";
import { ensureRootEnvLoaded } from "@/lib/root-env";
import { POST as revalidateCmsPost } from "@/app/api/revalidate/cms/route";
import { selectedInternalApiOrigin, selectedInternalApiToken } from "@/lib/server-env";

ensureRootEnvLoaded();

const METHODS_WITHOUT_BODY = new Set(["GET", "HEAD"]);
const RESPONSE_HEADER_BLACKLIST = new Set(["content-length", "content-encoding", "transfer-encoding", "connection"]);
const REQUEST_HEADER_ALLOWLIST = new Set([
  "accept",
  "accept-language",
  "content-type",
  "cookie",
  "user-agent",
  "x-request-id",
  "x-correlation-id",
]);
const PROXY_TIMEOUT_MS = 10000;

function buildProxyHeaders(request: NextRequest): Headers {
  const headers = new Headers();

  for (const [name, value] of request.headers.entries()) {
    if (REQUEST_HEADER_ALLOWLIST.has(name.toLowerCase())) {
      headers.set(name, value);
    }
  }

  if (selectedInternalApiToken) {
    headers.set("x-internal-api-token", selectedInternalApiToken);
  }

  return headers;
}

async function proxyRequest(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  try {
    const { path } = await context.params;
    const normalizedPath = path.join("/");

    // Guard against catch-all proxy swallowing local route handlers.
    if (normalizedPath === "revalidate/cms") {
      if (request.method !== "POST") {
        return Response.json(
          {
            ok: false,
            message: "Method not allowed.",
          },
          {
            status: 405,
            headers: {
              allow: "POST",
            },
          },
        );
      }

      return revalidateCmsPost(request);
    }

    const targetUrl = new URL(`/api/${path.join("/")}`, selectedInternalApiOrigin);
    targetUrl.search = request.nextUrl.search;

    const headers = buildProxyHeaders(request);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), PROXY_TIMEOUT_MS);

    let response: Response;
    try {
      const init: RequestInit & { duplex?: "half" } = {
        method: request.method,
        headers,
        cache: "no-store",
        redirect: "manual",
        signal: controller.signal,
      };

      if (!METHODS_WITHOUT_BODY.has(request.method)) {
        init.body = request.body;
        init.duplex = "half";
      }

      response = await fetch(targetUrl, init);
    } finally {
      clearTimeout(timeout);
    }
    const responseHeaders = new Headers(response.headers);

    for (const headerName of RESPONSE_HEADER_BLACKLIST) {
      responseHeaders.delete(headerName);
    }

    return new Response(response.body, {
      status: response.status,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error("Frontend API proxy request failed", error);
    const isAbort = error instanceof Error && error.name === "AbortError";

    return Response.json(
      {
        ok: false,
        message: isAbort
          ? "Internal API request timed out. Please try again."
          : "Internal API is temporarily unavailable. Please try again shortly.",
      },
      {
        status: isAbort ? 504 : 502,
      },
    );
  }
}

export const runtime = "nodejs";

export { proxyRequest as GET, proxyRequest as POST, proxyRequest as PUT, proxyRequest as PATCH, proxyRequest as DELETE, proxyRequest as OPTIONS, proxyRequest as HEAD };
