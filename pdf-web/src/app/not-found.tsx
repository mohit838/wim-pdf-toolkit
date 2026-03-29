import Link from "next/link";
import SiteStatusScreen from "@/components/SiteStatusScreen";
import MainLayout from "@/layouts/MainLayout";
import { supportPath } from "./site";

export default function NotFoundPage() {
  return (
    <MainLayout>
      <SiteStatusScreen
        eyebrow="Error 404"
        title="Page not found"
        titleClassName="text-gradient-404"
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

        <div style={{ marginTop: "3rem", padding: "1.5rem", borderRadius: "1.25rem", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
          <p style={{ margin: 0, fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", color: "var(--text-muted)" }}>
            Need a tool?
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "1.5rem", marginTop: "1rem" }}>
            <Link href="/merge" className="link-standard" style={{ fontSize: "0.9rem" }}>Merge PDF</Link>
            <Link href="/split" className="link-standard" style={{ fontSize: "0.9rem" }}>Split PDF</Link>
            <Link href="/compress" className="link-standard" style={{ fontSize: "0.9rem" }}>Compress PDF</Link>
            <Link href="/image-to-pdf" className="link-standard" style={{ fontSize: "0.9rem" }}>Image to PDF</Link>
          </div>
        </div>
      </SiteStatusScreen>
    </MainLayout>
  );
}
