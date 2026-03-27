import { ensureRootEnvLoaded } from "@/lib/root-env";
import { selectedCmsApiInternalOrigin } from "@/lib/server-env";

ensureRootEnvLoaded();

function getIpAddress(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || "unknown";
  }

  return request.headers.get("x-real-ip") || "unknown";
}

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const ipAddress = getIpAddress(request);

    const response = await fetch(`${selectedCmsApiInternalOrigin}/published/v1/contact`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-forwarded-for": ipAddress,
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    const responseText = await response.text();
    const jsonPayload = responseText
      ? JSON.parse(responseText) as { success?: boolean; message?: string; data?: { message?: string } }
      : {};

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

    return Response.json(
      {
        ok: false,
        message: "We could not send your message right now. Please try again later or email support directly.",
      },
      {
        status: 500,
      },
    );
  }
}
