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
    }, 1800);

    return () => {
      window.clearTimeout(redirectTimer);
    };
  }, [router, shouldRedirect]);

  useEffect(() => {
    console.error(error);
  }, [error]);

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
          <button type="button" onClick={reset} className="btn-accent">
            {copy.retryLabel}
          </button>
          <Link href={supportPath} className="btn-ghost">
            {copy.supportActionLabel}
          </Link>
        </div>

        {shouldRedirect ? (
          <p className="status-screen-redirect">{copy.redirectLabel}</p>
        ) : null}
      </SiteStatusScreen>
    </MainLayout>
  );
}
