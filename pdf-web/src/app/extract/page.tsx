import ExtractPagesPage from "@/views/ExtractPagesPage";
import ToolPageRouteShell from "@/components/ToolPageRouteShell";
import { buildMetadata, getResolvedToolPageCopy } from "../site";

export async function generateMetadata() {
  return buildMetadata("extract");
}

export default async function Page() {
  const pageCopy = await getResolvedToolPageCopy("extract");
  return (
    <ToolPageRouteShell toolId="extract">
      <ExtractPagesPage pageCopy={pageCopy} />
    </ToolPageRouteShell>
  );
}
