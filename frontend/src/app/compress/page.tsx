import CompressPdfPage from "@/views/CompressPdfPage";
import ToolPageRouteShell from "@/components/ToolPageRouteShell";
import { buildMetadata, getResolvedToolPageCopy } from "../site";

export async function generateMetadata() {
  return buildMetadata("compress");
}

export default async function Page() {
  const pageCopy = await getResolvedToolPageCopy("compress");
  return (
    <ToolPageRouteShell toolId="compress">
      <CompressPdfPage pageCopy={pageCopy} />
    </ToolPageRouteShell>
  );
}
