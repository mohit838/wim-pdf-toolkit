import type { NextRequest } from "next/server";
import { selectedCmsApiInternalOrigin } from "@/lib/env";

const METHODS_WITHOUT_BODY = new Set(["GET", "HEAD"]);
const RESPONSE_HEADER_BLACKLIST = new Set(["content-length", "content-encoding", "transfer-encoding", "connection"]);

async function proxyRequest(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  try {
    const { path } = await context.params;
    const targetUrl = new URL(`/${path.join("/")}`, selectedCmsApiInternalOrigin);
    targetUrl.search = request.nextUrl.search;

    const headers = new Headers(request.headers);
    headers.delete("host");
    headers.delete("connection");
    headers.delete("content-length");

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
    console.error("CMS frontend proxy request failed", error);

    return Response.json(
      {
        success: false,
        message: "CMS backend is temporarily unavailable. Please try again shortly.",
      },
      {
        status: 502,
      },
    );
  }
}

export const runtime = "nodejs";

export { proxyRequest as GET, proxyRequest as POST, proxyRequest as PUT, proxyRequest as PATCH, proxyRequest as DELETE, proxyRequest as OPTIONS, proxyRequest as HEAD };
