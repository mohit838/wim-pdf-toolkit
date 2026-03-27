import { NextResponse } from "next/server";
import { appMode } from "@/lib/server-env";

export async function GET(): Promise<NextResponse> {
  return NextResponse.json({ ok: true, service: "pdf-web", mode: appMode });
}
