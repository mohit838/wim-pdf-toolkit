import type { PropsWithChildren } from "react";
import AdSlot from "./AdSlot";
import MainLayout from "@/layouts/MainLayout";

interface ToolPageRouteShellProps extends PropsWithChildren {
  toolId: string;
}

export default function ToolPageRouteShell({ toolId, children }: ToolPageRouteShellProps) {
  const categories = ["tool", toolId];

  return (
    <MainLayout>
      <div className="cms-tool-route-stack">
        <AdSlot
          slotId="tool_before_title"
          scope="tool_page"
          categories={categories}
          className="app-shell cms-tool-route-slot cms-tool-route-slot-before cms-ad-slot-center-narrow"
        />
        {children}
        <AdSlot
          slotId="tool_after_panel"
          scope="tool_page"
          categories={categories}
          className="app-shell cms-tool-route-slot cms-tool-route-slot-after cms-ad-slot-center-narrow"
        />
      </div>
    </MainLayout>
  );
}
