import Link from "next/link";
import SiteStatusScreen from "@/components/SiteStatusScreen";
import MainLayout from "@/layouts/MainLayout";
import { buildMetadata, contactEmail, systemConfig } from "../site";

export async function generateMetadata() {
  return buildMetadata("support");
}

export default function SupportPage() {
  const copy = systemConfig.support;

  return (
    <MainLayout>
      <SiteStatusScreen
        eyebrow={copy.eyebrow}
        title={copy.title}
        description={copy.description}
      >
        <div className="status-screen-contact-card">
          <p className="status-screen-contact-label">{copy.emailLabel}</p>
          <a href={`mailto:${contactEmail}`} className="status-screen-contact-value">
            {contactEmail}
          </a>
        </div>

        <div className="status-screen-actions">
          <a href={`mailto:${contactEmail}`} className="btn-accent">
            {copy.emailActionLabel}
          </a>
          <Link href="/" className="btn-ghost">
            {copy.homeActionLabel}
          </Link>
        </div>
      </SiteStatusScreen>
    </MainLayout>
  );
}
