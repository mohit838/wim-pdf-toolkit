import WatermarkPdfPage from "@/views/WatermarkPdfPage";
import ToolPageRouteShell from "@/components/ToolPageRouteShell";
import { buildMetadata, getResolvedToolPageCopy } from "../site";

export async function generateMetadata() {
  return buildMetadata("watermark");
}

export default async function Page() {
  const pageCopy = await getResolvedToolPageCopy("watermark");
  return (
    <ToolPageRouteShell toolId="watermark">
      <WatermarkPdfPage pageCopy={pageCopy} />
    </ToolPageRouteShell>
  );
}
