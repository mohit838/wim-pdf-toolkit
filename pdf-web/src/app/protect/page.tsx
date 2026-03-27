import ProtectPdfPage from "@/views/ProtectPdfPage";
import ToolPageRouteShell from "@/components/ToolPageRouteShell";
import { buildMetadata, getResolvedToolPageCopy } from "../site";

export async function generateMetadata() {
  return buildMetadata("protect");
}

export default async function Page() {
  const pageCopy = await getResolvedToolPageCopy("protect");
  return (
    <ToolPageRouteShell toolId="protect">
      <ProtectPdfPage pageCopy={pageCopy} />
    </ToolPageRouteShell>
  );
}
