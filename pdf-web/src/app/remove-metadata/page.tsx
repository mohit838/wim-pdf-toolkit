import RemoveMetadataPage from "@/views/RemoveMetadataPage";
import ToolPageRouteShell from "@/components/ToolPageRouteShell";
import { buildMetadata, getResolvedToolPageCopy } from "../site";

export async function generateMetadata() {
  return buildMetadata("removeMetadata");
}

export default async function Page() {
  const pageCopy = await getResolvedToolPageCopy("removeMetadata");
  return (
    <ToolPageRouteShell toolId="removeMetadata">
      <RemoveMetadataPage pageCopy={pageCopy} />
    </ToolPageRouteShell>
  );
}
