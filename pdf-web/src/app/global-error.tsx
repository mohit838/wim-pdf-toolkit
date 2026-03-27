"use client";

import "../index.css";

import Link from "next/link";
import { useEffect } from "react";
import SiteStatusScreen from "@/components/SiteStatusScreen";
import { contactEmail, siteLanguage, supportPath, systemConfig } from "./site";

interface GlobalErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalErrorPage({ error, reset }: GlobalErrorPageProps) {
  const copy = systemConfig.error;

  useEffect(() => {
    if (window.location.pathname === supportPath) {
      return;
    }

    const redirectTimer = window.setTimeout(() => {
      window.location.replace(supportPath);
    }, 1800);

    return () => {
      window.clearTimeout(redirectTimer);
    };
  }, []);

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang={siteLanguage}>
      <body>
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
            <button type="button" onClick={reset} className="btn-accent">
              {copy.retryLabel}
            </button>
            <Link href={supportPath} className="btn-ghost">
              {copy.supportActionLabel}
            </Link>
          </div>

          <p className="status-screen-redirect">{copy.redirectLabel}</p>
        </SiteStatusScreen>
      </body>
    </html>
  );
}
