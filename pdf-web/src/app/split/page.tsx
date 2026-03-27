import SplitPdfPage from "@/views/SplitPdfPage";
import ToolPageRouteShell from "@/components/ToolPageRouteShell";
import { buildMetadata, getResolvedToolPageCopy } from "../site";

export async function generateMetadata() {
  return buildMetadata("split");
}

export default async function Page() {
  const pageCopy = await getResolvedToolPageCopy("split");
  return (
    <ToolPageRouteShell toolId="split">
      <SplitPdfPage pageCopy={pageCopy} />
    </ToolPageRouteShell>
  );
}
