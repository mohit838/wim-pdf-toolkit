import type { ReactNode } from "react";
import BrandMark from "./BrandMark";

interface SiteStatusScreenProps {
  eyebrow: string;
  title: string;
  description: string;
  children?: ReactNode;
  titleClassName?: string;
}

export default function SiteStatusScreen({
  eyebrow,
  title,
  description,
  children,
  titleClassName,
}: SiteStatusScreenProps) {
  const combinedTitleClassName = titleClassName 
    ? `status-screen-title-premium ${titleClassName}` 
    : "status-screen-title-premium";

  return (
    <section className="app-shell status-screen-shell relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="orb orb-violet animate-pulse-glow" style={{ width: "45vw", height: "45vw", top: "-15vw", right: "-10vw", opacity: 0.15 }} />
        <div className="orb orb-cyan animate-pulse-glow" style={{ width: "40vw", height: "40vw", bottom: "-10vw", left: "-10vw", animationDelay: "1.5s", opacity: 0.12 }} />
        <div className="orb orb-indigo animate-pulse-glow" style={{ width: "30vw", height: "30vw", top: "20%", left: "15%", animationDelay: "3s", opacity: 0.08 }} />
      </div>

      <div className="status-screen-wrap animate-fade-in-up relative z-10">
        <div className="status-screen-panel glass-card-premium">
          <div className="status-screen-content">
            <div className="status-screen-header">
              <div className="status-screen-brand-box">
                <BrandMark size={64} />
                <div className="status-screen-separator" />
              </div>
              <div className="status-screen-title-area">
                <p className="status-screen-eyebrow-premium">{eyebrow}</p>
                <h1 className={combinedTitleClassName}>{title}</h1>
              </div>
            </div>

            <p className="status-screen-description-premium">{description}</p>

            {children ? <div className="status-screen-body-premium">{children}</div> : null}
          </div>
        </div>
      </div>
    </section>
  );
}
