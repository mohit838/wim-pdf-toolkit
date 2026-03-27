import { LegalPageEditor } from "@/components/pages/LegalPageEditor";

export default async function LegalPageEditorRoute({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const resolved = await params;
  return <LegalPageEditor slug={resolved.slug} />;
}
