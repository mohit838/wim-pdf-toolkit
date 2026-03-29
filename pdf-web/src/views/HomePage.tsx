import Link from "next/link";
import {
  getResolvedHomeConfig,
  getResolvedHomeQuickStart,
  getResolvedHomeSections,
  getResolvedReadyToolCount,
  getResolvedToolCardUi,
} from "@/app/site";
import AdSlot from "@/components/AdSlot";
import { getToolIcon } from "@/components/tool-icons";
import ToolCard from "../components/ToolCard";
import MainLayout from "../layouts/MainLayout";

function getSectionGridClass(count: number): string {
  if (count >= 4) {
    return "grid gap-5 md:grid-cols-2 xl:grid-cols-4";
  }

  if (count === 3) {
    return "grid gap-5 md:grid-cols-2 xl:grid-cols-3";
  }

  return "grid gap-5 md:grid-cols-2";
}

export default async function HomePage() {
  const [homeConfig, quickStartTools, homeSections, readyToolCount, toolCardUi] = await Promise.all([
    getResolvedHomeConfig(),
    getResolvedHomeQuickStart(),
    getResolvedHomeSections(),
    getResolvedReadyToolCount(),
    getResolvedToolCardUi(),
  ]);
  const heroConfig = homeConfig.hero;
  const quickStartConfig = homeConfig.quickStart;
  const primaryQuickStart = quickStartTools[0];

  return (
    <MainLayout>
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="orb orb-violet animate-float" style={{ width: "36rem", height: "36rem", top: "-8rem", left: "-12rem" }} />
        <div className="orb orb-indigo" style={{ width: "28rem", height: "28rem", top: "18rem", left: "46%" }} />
        <div className="orb orb-cyan animate-float" style={{ width: "34rem", height: "34rem", top: "22rem", right: "-12rem", animationDelay: "1.2s" }} />
      </div>

      <section className="app-shell relative overflow-hidden pb-14 pt-6 lg:pb-20 lg:pt-10">
        <div className="mx-auto max-w-376">
          <div
            className="relative overflow-hidden rounded-[2.4rem] border border-white/10 px-5 py-8 sm:px-8 sm:py-12 lg:px-12 lg:py-14"
            style={{
              background:
                "linear-gradient(180deg, rgba(10, 15, 31, 0.66) 0%, rgba(7, 11, 22, 0.3) 100%)",
            }}
          >
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.16]"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)",
                backgroundSize: "72px 72px",
                maskImage: "linear-gradient(180deg, rgba(0,0,0,0.85), transparent 100%)",
                WebkitMaskImage: "linear-gradient(180deg, rgba(0,0,0,0.85), transparent 100%)",
              }}
            />
            <div
              className="pointer-events-none absolute left-1/2 top-16 h-96 w-[24rem] -translate-x-1/2 rounded-full blur-3xl"
              style={{ background: "radial-gradient(circle, rgba(110, 97, 255, 0.28) 0%, rgba(110, 97, 255, 0.04) 58%, transparent 74%)" }}
            />
            <div
              className="pointer-events-none absolute -right-20 top-1/2 h-88 w-88 -translate-y-1/2 rounded-full blur-3xl"
              style={{ background: "radial-gradient(circle, rgba(23, 199, 255, 0.2) 0%, rgba(23, 199, 255, 0.03) 58%, transparent 76%)" }}
            />

            <div className="relative grid gap-10 lg:grid-cols-[minmax(0,1.08fr)_minmax(20rem,0.92fr)] lg:items-center lg:gap-12">
              <div className="max-w-2xl">
                <span
                  className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-[0.7rem] font-semibold uppercase tracking-[0.22em]"
                  style={{
                    background: "linear-gradient(180deg, rgba(22, 31, 60, 0.82), rgba(12, 18, 35, 0.78))",
                    color: "#a78bfa",
                    border: "1px solid rgba(124, 108, 255, 0.32)",
                    boxShadow: "0 10px 24px rgba(2, 8, 23, 0.16)",
                  }}
                >
                  <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#34d399", boxShadow: "0 0 10px rgba(52, 211, 153, 0.7)" }} />
                  {readyToolCount} {heroConfig.badgeCountSuffix}
                </span>

                <h1
                  className="mt-6 max-w-[12ch] text-4xl font-black tracking-[-0.05em] sm:text-6xl lg:text-[5.15rem]"
                  style={{ lineHeight: "0.97" }}
                >
                  {heroConfig.titleLead}{" "}
                  <span
                    className={heroConfig.emphasisColor ? undefined : "text-gradient"}
                    style={heroConfig.emphasisColor ? { color: heroConfig.emphasisColor } : undefined}
                  >
                    {heroConfig.titleHighlight}
                  </span>{" "}
                  {heroConfig.titleTail}
                </h1>

                <p className="mt-6 max-w-3xl text-base leading-8 sm:text-xl" style={{ color: "var(--text-secondary)" }}>
                  {heroConfig.description}
                </p>

                <div className="mt-8 flex flex-wrap gap-3">
                  {heroConfig.pills.map((pill) => (
                    <span
                      key={pill}
                      className="inline-flex items-center rounded-full px-3.5 py-2 text-[0.7rem] font-semibold uppercase tracking-[0.16em] sm:text-[0.74rem]"
                      style={{
                        color: "var(--text-primary)",
                        background: "rgba(11, 17, 33, 0.58)",
                        border: "1px solid rgba(148, 163, 184, 0.16)",
                      }}
                    >
                      {pill}
                    </span>
                  ))}
                </div>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <Link href={primaryQuickStart.to} className="btn-accent text-sm sm:text-base">
                    {heroConfig.primaryActionPrefix} {primaryQuickStart.title}
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="5" y1="12" x2="19" y2="12" />
                      <polyline points="12 5 19 12 12 19" />
                    </svg>
                  </Link>
                  <Link
                    href="#tool-sections"
                    className="btn-ghost inline-flex items-center justify-center gap-2 text-sm sm:text-base"
                  >
                    {heroConfig.secondaryActionLabel}
                  </Link>
                </div>

                <p className="mt-6 text-sm leading-7 sm:text-base" style={{ color: "var(--text-muted)" }}>
                  {readyToolCount} {heroConfig.readyToolsSuffix}
                </p>
              </div>

              <div
                className="relative overflow-hidden rounded-4xl border border-white/10 p-5 sm:p-6"
                style={{
                  background: "linear-gradient(180deg, rgba(10, 15, 31, 0.84) 0%, rgba(8, 13, 26, 0.72) 100%)",
                  boxShadow: "0 24px 80px rgba(2, 8, 23, 0.32)",
                }}
              >
                <div
                  className="pointer-events-none absolute inset-x-0 top-0 h-px opacity-90"
                  style={{ background: "var(--accent-gradient)" }}
                />
                <div className="relative flex items-end justify-between gap-4">
                  <div>
                    <p className="text-[0.68rem] font-semibold uppercase tracking-[0.26em]" style={{ color: "var(--text-muted)" }}>
                      {quickStartConfig.eyebrow}
                    </p>
                    <h2 className="mt-2 text-2xl font-semibold tracking-tight" style={{ color: "var(--text-primary)" }}>
                      {quickStartConfig.title}
                    </h2>
                  </div>

                  <span
                    className="shrink-0 rounded-full px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em]"
                    style={{
                      color: "var(--text-primary)",
                      background: "rgba(255, 255, 255, 0.06)",
                      border: "1px solid rgba(148, 163, 184, 0.16)",
                    }}
                  >
                    
                    {quickStartTools.length} {quickStartConfig.countSuffix}
                  </span>
                </div>

                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  {quickStartTools.map((tool) => {
                    const Icon = getToolIcon(tool.iconKey);

                    return (
                      <Link
                        key={tool.id}
                        href={tool.to}
                        className="group relative overflow-hidden rounded-[1.55rem] border border-white/10 p-5 transition duration-300 hover:-translate-y-1 hover:border-white/20"
                        style={{
                          background: "linear-gradient(180deg, rgba(14, 20, 38, 0.92) 0%, rgba(10, 15, 29, 0.74) 100%)",
                          boxShadow: "0 18px 44px rgba(2, 8, 23, 0.24)",
                        }}
                      >
                        <div className="pointer-events-none absolute inset-0 opacity-100" style={{ background: tool.glow }} />

                        <div className="relative flex h-full flex-col">
                          <div className="flex items-start justify-between gap-4">
                            <span
                              className="text-[0.64rem] font-semibold uppercase tracking-[0.22em]"
                              style={{ color: "var(--text-muted)" }}
                            >
                              {tool.eyebrow}
                            </span>

                            <div
                              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border"
                              style={{
                                color: tool.accentColor,
                                background: "rgba(255, 255, 255, 0.04)",
                                borderColor: "rgba(148, 163, 184, 0.14)",
                              }}
                            >
                              <Icon size={22} />
                            </div>
                          </div>

                          <p className="mt-5 text-lg font-semibold tracking-tight" style={{ color: "var(--text-primary)" }}>
                            {tool.title}
                          </p>

                          <p className="mt-2 text-sm leading-7" style={{ color: "var(--text-secondary)" }}>
                            {tool.description}
                          </p>

                          <span
                            className="mt-auto inline-flex items-center gap-2 pt-6 text-sm font-semibold"
                            style={{ color: tool.accentColor }}
                          >
                            {quickStartConfig.actionLabel}
                            <svg
                              width="15"
                              height="15"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="transition duration-300 group-hover:translate-x-1"
                            >
                              <line x1="5" y1="12" x2="19" y2="12" />
                              <polyline points="12 5 19 12 12 19" />
                            </svg>
                          </span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 grid gap-4">
            <AdSlot
              slotId="home_before_title"
              scope="home"
              categories={["homepage", "hero"]}
              className="cms-ad-slot-center"
            />
            <AdSlot
              slotId="home_after_title"
              scope="home"
              categories={["homepage", "hero"]}
              className="cms-ad-slot-center-narrow"
            />
          </div>

          <div id="tool-sections" className="defer-render mt-12 space-y-14 lg:mt-16 lg:space-y-16">
            {homeSections.map((section, index) => (
              <div
                id={section.id}
                key={section.id}
                className={index === 0 ? "animate-fade-in-up-delay-1" : "animate-fade-in-up-delay-2"}
              >
                <div
                  className="relative overflow-hidden rounded-4xl border border-white/10 px-5 py-6 sm:px-6 sm:py-7 lg:px-8"
                  style={{
                    background: "linear-gradient(180deg, rgba(11, 17, 33, 0.7) 0%, rgba(9, 14, 28, 0.48) 100%)",
                  }}
                >
                  <div
                    className="pointer-events-none absolute inset-x-0 top-0 h-px opacity-70"
                    style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.18), transparent)" }}
                  />

                  <div className="relative mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                      <p className="text-[0.68rem] font-semibold uppercase tracking-[0.24em]" style={{ color: "var(--text-muted)" }}>
                        {section.eyebrow}
                      </p>
                      <h2 className="mt-2 text-[1.55rem] font-bold tracking-tight sm:text-[1.8rem]" style={{ color: "var(--text-primary)" }}>
                        <span className="text-gradient">{section.accent}</span>
                        {section.titleTail ? ` ${section.titleTail}` : ""}
                      </h2>
                    </div>

                    <div className="flex flex-col items-start gap-3 lg:items-end">
                      <span
                        className="rounded-full px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.16em]"
                        style={{
                          color: "var(--text-primary)",
                          background: "rgba(255, 255, 255, 0.05)",
                          border: "1px solid rgba(148, 163, 184, 0.14)",
                        }}
                      >
                        {section.tools.length} {homeConfig.sectionCountSuffix}
                      </span>

                      <p className="max-w-2xl text-sm leading-7 sm:text-base lg:text-right" style={{ color: "var(--text-secondary)" }}>
                        {section.description}
                      </p>
                    </div>
                  </div>

                  <div className={getSectionGridClass(section.tools.length)}>
                    {section.tools.map((tool) => {
                      const Icon = getToolIcon(tool.iconKey);

                      return (
                        <ToolCard
                          key={tool.id}
                          title={tool.title}
                          description={tool.description}
                          icon={<Icon size={22} />}
                          to={tool.to}
                          status={tool.status}
                          uiCopy={toolCardUi}
                        />
                      );
                    })}
                  </div>
                </div>

                {index < homeSections.length - 1 ? (
                  <AdSlot
                    slotId={`home_between_${index + 1}`}
                    scope="home"
                    categories={["homepage", section.id]}
                    className="mt-8 cms-ad-slot-center"
                  />
                ) : null}
              </div>
            ))}
          </div>

          <div className="defer-render">
            <AdSlot
              slotId="home_mid"
              scope="home"
              categories={["homepage"]}
              className="mt-12 cms-ad-slot-center"
            />
          </div>
        </div>
      </section>
    </MainLayout>
  );
}
