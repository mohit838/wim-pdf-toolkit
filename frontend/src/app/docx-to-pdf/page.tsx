import DocxToPdfPage from "@/views/DocxToPdfPage";
import ToolPageRouteShell from "@/components/ToolPageRouteShell";
import { buildMetadata, getResolvedToolPageCopy } from "../site";

export async function generateMetadata() {
  return buildMetadata("docxToPdf");
}

export default async function Page() {
  const pageCopy = await getResolvedToolPageCopy("docxToPdf");
  return (
    <ToolPageRouteShell toolId="docxToPdf">
      <DocxToPdfPage pageCopy={pageCopy} />
    </ToolPageRouteShell>
  );
}
