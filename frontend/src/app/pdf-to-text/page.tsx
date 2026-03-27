import PdfToTextPage from "@/views/PdfToTextPage";
import ToolPageRouteShell from "@/components/ToolPageRouteShell";
import { buildMetadata, getResolvedToolPageCopy } from "../site";

export async function generateMetadata() {
  return buildMetadata("pdfToText");
}

export default async function Page() {
  const pageCopy = await getResolvedToolPageCopy("pdfToText");
  return (
    <ToolPageRouteShell toolId="pdfToText">
      <PdfToTextPage pageCopy={pageCopy} />
    </ToolPageRouteShell>
  );
}
