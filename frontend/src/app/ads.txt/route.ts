import { getRuntimeAdsTxtLines } from "@/lib/cms-runtime";

export async function GET() {
  const lines = await getRuntimeAdsTxtLines();

  return new Response(lines.join("\n"), {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "public, max-age=300",
    },
  });
}
