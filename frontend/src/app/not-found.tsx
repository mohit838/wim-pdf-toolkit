import Link from "next/link";
import SiteStatusScreen from "@/components/SiteStatusScreen";
import MainLayout from "@/layouts/MainLayout";
import { supportPath } from "./site";

export default function NotFoundPage() {
  return (
    <MainLayout>
      <SiteStatusScreen
        eyebrow="404"
        title="Page not found"
        description="The page you requested does not exist or may have been moved."
      >
        <div className="status-screen-actions">
          <Link href="/" className="btn-accent">
            Back to home
          </Link>
          <Link href={supportPath} className="btn-ghost">
            Open support
          </Link>
        </div>
      </SiteStatusScreen>
    </MainLayout>
  );
}
