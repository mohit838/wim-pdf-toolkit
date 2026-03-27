import RotatePdfPage from "@/views/RotatePdfPage";
import ToolPageRouteShell from "@/components/ToolPageRouteShell";
import { buildMetadata, getResolvedToolPageCopy } from "../site";

export async function generateMetadata() {
  return buildMetadata("rotate");
}

export default async function Page() {
  const pageCopy = await getResolvedToolPageCopy("rotate");
  return (
    <ToolPageRouteShell toolId="rotate">
      <RotatePdfPage pageCopy={pageCopy} />
    </ToolPageRouteShell>
  );
}
