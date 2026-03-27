import ImageToPdfPage from "@/views/ImageToPdfPage";
import ToolPageRouteShell from "@/components/ToolPageRouteShell";
import { buildMetadata, getResolvedToolPageCopy } from "../site";

export async function generateMetadata() {
  return buildMetadata("imageToPdf");
}

export default async function Page() {
  const pageCopy = await getResolvedToolPageCopy("imageToPdf");
  return (
    <ToolPageRouteShell toolId="imageToPdf">
      <ImageToPdfPage pageCopy={pageCopy} />
    </ToolPageRouteShell>
  );
}
