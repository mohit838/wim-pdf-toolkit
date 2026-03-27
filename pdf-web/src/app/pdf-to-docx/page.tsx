import PdfToDocxPage from "@/views/PdfToDocxPage";
import ToolPageRouteShell from "@/components/ToolPageRouteShell";
import { buildMetadata, getResolvedToolPageCopy } from "../site";

export async function generateMetadata() {
  return buildMetadata("pdfToDocx");
}

export default async function Page() {
  const pageCopy = await getResolvedToolPageCopy("pdfToDocx");
  return (
    <ToolPageRouteShell toolId="pdfToDocx">
      <PdfToDocxPage pageCopy={pageCopy} />
    </ToolPageRouteShell>
  );
}
