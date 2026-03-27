import PdfToJpgPage from "@/views/PdfToJpgPage";
import ToolPageRouteShell from "@/components/ToolPageRouteShell";
import { buildMetadata, getResolvedToolPageCopy } from "../site";

export async function generateMetadata() {
  return buildMetadata("pdfToJpg");
}

export default async function Page() {
  const pageCopy = await getResolvedToolPageCopy("pdfToJpg");
  return (
    <ToolPageRouteShell toolId="pdfToJpg">
      <PdfToJpgPage pageCopy={pageCopy} />
    </ToolPageRouteShell>
  );
}
