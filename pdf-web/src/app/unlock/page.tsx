import UnlockPdfPage from "@/views/UnlockPdfPage";
import ToolPageRouteShell from "@/components/ToolPageRouteShell";
import { buildMetadata, getResolvedToolPageCopy } from "../site";

export async function generateMetadata() {
  return buildMetadata("unlock");
}

export default async function Page() {
  const pageCopy = await getResolvedToolPageCopy("unlock");
  return (
    <ToolPageRouteShell toolId="unlock">
      <UnlockPdfPage pageCopy={pageCopy} />
    </ToolPageRouteShell>
  );
}
