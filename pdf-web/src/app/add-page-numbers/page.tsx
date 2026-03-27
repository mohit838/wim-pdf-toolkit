import AddPageNumbersPage from "@/views/AddPageNumbersPage";
import ToolPageRouteShell from "@/components/ToolPageRouteShell";
import { buildMetadata, getResolvedToolPageCopy } from "../site";

export async function generateMetadata() {
  return buildMetadata("addPageNumbers");
}

export default async function Page() {
  const pageCopy = await getResolvedToolPageCopy("addPageNumbers");
  return (
    <ToolPageRouteShell toolId="addPageNumbers">
      <AddPageNumbersPage pageCopy={pageCopy} />
    </ToolPageRouteShell>
  );
}
