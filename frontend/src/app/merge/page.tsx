import MergePdfPage from "@/views/MergePdfPage";
import ToolPageRouteShell from "@/components/ToolPageRouteShell";
import { buildMetadata, getResolvedToolPageCopy } from "../site";

export async function generateMetadata() {
  return buildMetadata("merge");
}

export default async function Page() {
  const pageCopy = await getResolvedToolPageCopy("merge");
  return (
    <ToolPageRouteShell toolId="merge">
      <MergePdfPage pageCopy={pageCopy} />
    </ToolPageRouteShell>
  );
}
