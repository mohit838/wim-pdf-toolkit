import { NextResponse } from "next/server";
import { cmsAppMode } from "@/lib/env";

export async function GET(): Promise<NextResponse> {
  return NextResponse.json({ ok: true, service: "cms-web", mode: cmsAppMode });
}
