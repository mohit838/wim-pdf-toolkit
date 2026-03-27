import type { NextRequest } from "next/server";
import { ensureRootEnvLoaded } from "@/lib/root-env";
import { POST as revalidateCmsPost } from "@/app/api/revalidate/cms/route";

ensureRootEnvLoaded();

function isTruthy(value: string | undefined): boolean {
  if (value === undefined) {
    return true;
  }

  return ["1", "true", "yes", "on"].includes(value.trim().toLowerCase());
}

function getActiveValue(devValue: string | undefined, prodValue: string | undefined): string | undefined {
  const useDev = isTruthy(process.env.APP_DEV ?? process.env.NEXT_PUBLIC_APP_DEV);
  return useDev ? devValue : prodValue;
}

function normalizeOrigin(value: string | undefined): string {
  return (value || "http://localhost:8000").replace(/\/+$/, "");
}

const INTERNAL_API_ORIGIN = normalizeOrigin(
  getActiveValue(
    process.env.DEV_INTERNAL_API_ORIGIN,
    process.env.PROD_INTERNAL_API_ORIGIN,
  ),
);

const INTERNAL_API_TOKEN = getActiveValue(
  process.env.DEV_INTERNAL_API_TOKEN,
  process.env.PROD_INTERNAL_API_TOKEN,
);

const METHODS_WITHOUT_BODY = new Set(["GET", "HEAD"]);
const RESPONSE_HEADER_BLACKLIST = new Set(["content-length", "content-encoding", "transfer-encoding", "connection"]);

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

    const targetUrl = new URL(`/api/${path.join("/")}`, INTERNAL_API_ORIGIN);
    targetUrl.search = request.nextUrl.search;

    const headers = new Headers(request.headers);
    headers.delete("host");
    headers.delete("connection");
    headers.delete("content-length");

    if (INTERNAL_API_TOKEN) {
      headers.set("x-internal-api-token", INTERNAL_API_TOKEN);
    }

    const init: RequestInit & { duplex?: "half" } = {
      method: request.method,
      headers,
      cache: "no-store",
      redirect: "manual",
    };

    if (!METHODS_WITHOUT_BODY.has(request.method)) {
      init.body = request.body;
      init.duplex = "half";
    }

    const response = await fetch(targetUrl, init);
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

    return Response.json(
      {
        ok: false,
        message: "Internal API is temporarily unavailable. Please try again shortly.",
      },
      {
        status: 502,
      },
    );
  }
}

export const runtime = "nodejs";

export { proxyRequest as GET, proxyRequest as POST, proxyRequest as PUT, proxyRequest as PATCH, proxyRequest as DELETE, proxyRequest as OPTIONS, proxyRequest as HEAD };
