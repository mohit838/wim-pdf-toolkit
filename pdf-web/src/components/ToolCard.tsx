import Link from "next/link";
import type { ToolCardUiCopy } from "@/app/site";

interface ToolCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  to: string;
  status?: "ready" | "coming-soon";
  uiCopy: ToolCardUiCopy;
}

export default function ToolCard({
  title,
  description,
  icon,
  to,
  status = "ready",
  uiCopy,
}: ToolCardProps) {
  const isReady = status === "ready";

  return (
    <div
      className="glass-card group relative flex h-full flex-col overflow-hidden p-5 sm:p-6"
      style={{ cursor: isReady ? "pointer" : "default" }}
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px opacity-80"
        style={{ background: "var(--accent-gradient)" }}
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background:
            "radial-gradient(circle at top right, rgba(99, 102, 241, 0.22), transparent 36%)",
        }}
      />

      <div className="relative mb-5 flex items-start justify-between gap-3">
        {/* Icon */}
        <div
          className="flex items-center justify-center shrink-0"
          style={{
            width: "48px",
            height: "48px",
            borderRadius: "14px",
            background: isReady
              ? "linear-gradient(180deg, rgba(124, 108, 255, 0.16), rgba(63, 88, 203, 0.12))"
              : "rgba(148, 163, 184, 0.06)",
            color: isReady ? "#8f7dff" : "var(--text-muted)",
            border: isReady ? "1px solid var(--border-subtle)" : "1px dashed var(--border-subtle)",
            boxShadow: isReady ? "inset 0 1px 0 rgba(255,255,255,0.03)" : "none",
          }}
        >
          {icon}
        </div>

        {/* Badge */}
        <span className={isReady ? "badge-ready" : "badge-soon"}>
          {isReady ? uiCopy.readyLabel : uiCopy.soonLabel}
        </span>
      </div>

      <div className="relative flex flex-1 flex-col">
        <h3
          className="text-[1.05rem] font-semibold leading-7"
          style={{ color: "var(--text-primary)" }}
        >
          {title}
        </h3>

        <p
          className="mt-2 text-sm leading-7"
          style={{ color: "var(--text-secondary)" }}
        >
          {description}
        </p>

        <div className="mt-auto pt-6">
          {isReady ? (
            <Link href={to} className="btn-accent text-sm">
              {uiCopy.openLabel}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </Link>
          ) : (
            <button
              disabled
              className="btn-ghost text-sm cursor-not-allowed opacity-50"
            >
              {uiCopy.comingSoonLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
