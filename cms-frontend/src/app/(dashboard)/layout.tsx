import type { PropsWithChildren } from "react";
import CmsShell from "@/components/CmsShell";

export default function DashboardLayout({ children }: PropsWithChildren) {
  return <CmsShell>{children}</CmsShell>;
}

