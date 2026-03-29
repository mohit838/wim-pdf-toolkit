import Link from "next/link";
import SiteStatusScreen from "@/components/SiteStatusScreen";
import MainLayout from "@/layouts/MainLayout";
import { supportPath } from "./site";

export default function NotFoundPage() {
  return (
    <MainLayout showFooterPromo={false} mainClassName="page-solid-bg">
      <SiteStatusScreen
        eyebrow="Error 404"
        title="Page not found"
        titleClassName="text-gradient-404"
        showAmbientOrbs={false}
        description="The page you are looking for doesn't exist or has been moved. Use the links below to find your way back."
      >
        <div className="status-screen-actions">
          <Link href="/" className="btn-accent">
            Back to home
          </Link>
          <Link href={supportPath} className="btn-secondary">
            Open support
          </Link>
        </div>

        <div className="status-screen-links-card">
          <p className="status-screen-links-label">
            Need a tool?
          </p>
          <div className="status-screen-tool-links">
            <Link href="/merge" className="link-standard">Merge PDF</Link>
            <Link href="/split" className="link-standard">Split PDF</Link>
            <Link href="/compress" className="link-standard">Compress PDF</Link>
            <Link href="/image-to-pdf" className="link-standard">Image to PDF</Link>
          </div>
        </div>
      </SiteStatusScreen>
    </MainLayout>
  );
}
