import type { ReactNode } from "react";
import BrandMark from "./BrandMark";

interface SiteStatusScreenProps {
  eyebrow: string;
  title: string;
  description: string;
  children?: ReactNode;
}

export default function SiteStatusScreen({
  eyebrow,
  title,
  description,
  children,
}: SiteStatusScreenProps) {
  return (
    <section className="app-shell tool-page-shell relative">
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="orb orb-violet animate-pulse-glow" style={{ width: "320px", height: "320px", top: "-50px", right: "-80px" }} />
        <div className="orb orb-cyan animate-pulse-glow" style={{ width: "260px", height: "260px", bottom: "10%", left: "-70px", animationDelay: "1.3s" }} />
      </div>

      <div className="status-screen-wrap animate-fade-in-up">
        <div className="glass-card status-screen-panel">
          <div className="status-screen-brand">
            <BrandMark size={56} />
            <div>
              <p className="status-screen-eyebrow">{eyebrow}</p>
              <h1 className="status-screen-title">{title}</h1>
            </div>
          </div>

          <p className="status-screen-description">{description}</p>

          {children ? <div className="status-screen-body">{children}</div> : null}
        </div>
      </div>
    </section>
  );
}
