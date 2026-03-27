import RearrangePdfPage from "@/views/RearrangePdfPage";
import ToolPageRouteShell from "@/components/ToolPageRouteShell";
import { buildMetadata, getResolvedToolPageCopy } from "../site";

export async function generateMetadata() {
  return buildMetadata("rearrange");
}

export default async function Page() {
  const pageCopy = await getResolvedToolPageCopy("rearrange");
  return (
    <ToolPageRouteShell toolId="rearrange">
      <RearrangePdfPage pageCopy={pageCopy} />
    </ToolPageRouteShell>
  );
}
