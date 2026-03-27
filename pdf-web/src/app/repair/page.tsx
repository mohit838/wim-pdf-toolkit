import RepairPdfPage from "@/views/RepairPdfPage";
import ToolPageRouteShell from "@/components/ToolPageRouteShell";
import { buildMetadata, getResolvedToolPageCopy } from "../site";

export async function generateMetadata() {
  return buildMetadata("repair");
}

export default async function Page() {
  const pageCopy = await getResolvedToolPageCopy("repair");
  return (
    <ToolPageRouteShell toolId="repair">
      <RepairPdfPage pageCopy={pageCopy} />
    </ToolPageRouteShell>
  );
}
