import { isAdBlueprintModeEnabled, resolveRuntimeAdPlacement } from "@/lib/cms-runtime";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const slotId = String(url.searchParams.get("slotId") || "");
  const scope = String(url.searchParams.get("scope") || "");
  const categories = String(url.searchParams.get("categories") || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  if (!slotId || !scope) {
    return Response.json(
      {
        ok: false,
        message: "slotId and scope are required.",
      },
      {
        status: 400,
      },
    );
  }

  const [placement, blueprintEnabled] = await Promise.all([
    resolveRuntimeAdPlacement(slotId, scope as Parameters<typeof resolveRuntimeAdPlacement>[1], categories),
    isAdBlueprintModeEnabled(),
  ]);

  return Response.json({
    ok: true,
    data: {
      placement,
      blueprintEnabled,
    },
  });
}
