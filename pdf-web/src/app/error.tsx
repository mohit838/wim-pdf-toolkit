"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import SiteStatusScreen from "@/components/SiteStatusScreen";
import MainLayout from "@/layouts/MainLayout";
import { contactEmail, supportPath, systemConfig } from "./site";

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  const copy = systemConfig.error;
  const router = useRouter();
  const pathname = usePathname();
  const shouldRedirect = pathname !== supportPath;

  useEffect(() => {
    if (!shouldRedirect) {
      return;
    }

    const redirectTimer = window.setTimeout(() => {
      router.replace(supportPath);
    }, 2800); // 1s longer for improved readability of the recovery screen

    return () => {
      window.clearTimeout(redirectTimer);
    };
  }, [router, shouldRedirect]);

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <MainLayout showFooterPromo={false}>
      <SiteStatusScreen
        eyebrow="System Error"
        title={copy.title}
        titleClassName="text-gradient-error"
        description="We hit an unexpected problem while processing this page. Our system is attempting to recover, and you'll be redirected shortly."
      >
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1.5rem" }}>
          <div className="status-screen-contact-card">
            <p className="status-screen-contact-label">{copy.emailLabel}</p>
            <a href={`mailto:${contactEmail}`} className="status-screen-contact-value">
              {contactEmail}
            </a>
          </div>
          
          <div className="status-screen-contact-card" style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <p className="status-screen-contact-label">Error Digest</p>
            <code style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "0.5rem" }}>
              {error.digest || "INTERNAL_APP_ERROR"}
            </code>
          </div>
        </div>

        <div className="status-screen-actions">
          <button type="button" onClick={reset} className="btn-accent">
            {copy.retryLabel}
          </button>
          <Link href={supportPath} className="btn-secondary">
            {copy.supportActionLabel}
          </Link>
          <Link href="/" className="btn-ghost" style={{ marginLeft: "auto" }}>
            Back to home
          </Link>
        </div>

        {shouldRedirect ? (
          <p className="status-screen-redirect" style={{ marginTop: "2rem" }}>
            {copy.redirectLabel}
          </p>
        ) : null}
      </SiteStatusScreen>
    </MainLayout>
  );
}
