"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { NavGroup, NavItem } from "@/app/site";
import { getToolIcon } from "./tool-icons";
import BrandMark from "./BrandMark";

interface NavbarProps {
  navGroups: NavGroup[];
  homeLabel: string;
  siteName: string;
}

export default function Navbar({ navGroups, homeLabel, siteName }: NavbarProps) {
  const pathname = usePathname();
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const menuTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenu(null);
      }
    };

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  const handleMouseEnter = (groupId: string) => {
    if (menuTimeoutRef.current) {
      clearTimeout(menuTimeoutRef.current);
    }

    setOpenMenu(groupId);
  };

  const handleMouseLeave = () => {
    menuTimeoutRef.current = setTimeout(() => setOpenMenu(null), 200);
  };

  const isActive = (items: NavItem[]) => items.some((item) => pathname === item.to);

  return (
    <header
      id="navbar"
      className="sticky top-0 z-50"
      style={{
        background: "rgba(8, 12, 24, 0.72)",
        backdropFilter: "blur(22px)",
        WebkitBackdropFilter: "blur(22px)",
        borderBottom: "1px solid var(--border-subtle)",
        boxShadow: "0 10px 40px rgba(2, 8, 23, 0.12)",
      }}
    >
      <div ref={menuRef} className="app-shell flex items-center justify-between py-3">
        <Link href="/" className="flex items-center gap-2.5 shrink-0" style={{ textDecoration: "none" }}>
          <BrandMark size={34} />
          <span className="text-base font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
            {siteName}
          </span>
        </Link>

        <nav className="hidden lg:flex items-center gap-1">
          <Link
            href="/"
            className="rounded-full px-4 py-2 text-sm font-medium transition-all duration-200"
            style={{
              color: pathname === "/" ? "var(--text-primary)" : "var(--text-secondary)",
              background: pathname === "/" ? "var(--bg-glass-hover)" : "transparent",
              textDecoration: "none",
            }}
          >
            {homeLabel}
          </Link>

          {navGroups.map((group) => (
            <div
              key={group.id}
              className="relative"
              onMouseEnter={() => handleMouseEnter(group.id)}
              onMouseLeave={handleMouseLeave}
            >
              <button
                className="flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-all duration-200"
                style={{
                  color: isActive(group.items) || openMenu === group.id ? "var(--text-primary)" : "var(--text-secondary)",
                  background: openMenu === group.id ? "var(--bg-glass-hover)" : isActive(group.items) ? "var(--bg-glass)" : "transparent",
                  border: "none",
                  cursor: "pointer",
                }}
                onClick={() => setOpenMenu(openMenu === group.id ? null : group.id)}
              >
                {group.label}
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  style={{
                    transition: "transform 0.2s",
                    transform: openMenu === group.id ? "rotate(180deg)" : "rotate(0)",
                  }}
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>

              {openMenu === group.id && (
                <div
                  className="absolute top-full right-0 mt-2 animate-fade-in-up"
                  style={{
                    width: group.items.length > 4 ? "min(560px, calc(100vw - 2rem))" : "min(320px, calc(100vw - 2rem))",
                    maxWidth: "calc(100vw - 2rem)",
                    background: "rgba(12, 18, 35, 0.94)",
                    backdropFilter: "blur(24px)",
                    WebkitBackdropFilter: "blur(24px)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: "1.5rem",
                    boxShadow: "0 24px 64px rgba(2, 8, 23, 0.42)",
                    padding: "14px",
                    zIndex: 100,
                    transformOrigin: "top right",
                  }}
                  onMouseEnter={() => handleMouseEnter(group.id)}
                  onMouseLeave={handleMouseLeave}
                >
                  <div
                    className="grid gap-1"
                    style={{
                      gridTemplateColumns: group.items.length > 4 ? "repeat(2, minmax(0, 1fr))" : "1fr",
                    }}
                  >
                    {group.items.map((item) => {
                      const Icon = getToolIcon(item.iconKey);

                      return (
                        <Link
                          key={item.to}
                          href={item.to}
                          className="flex items-start gap-3 rounded-xl px-3 py-2.5 transition-all duration-200 group"
                          style={{
                            textDecoration: "none",
                            background: pathname === item.to ? "var(--bg-glass-hover)" : "transparent",
                          }}
                          onMouseEnter={(event) => {
                            if (pathname !== item.to) {
                              event.currentTarget.style.background = "var(--bg-glass)";
                            }
                          }}
                          onMouseLeave={(event) => {
                            if (pathname !== item.to) {
                              event.currentTarget.style.background = "transparent";
                            }
                          }}
                        >
                          <div
                            className="shrink-0 flex items-center justify-center mt-0.5"
                            style={{
                              width: "32px",
                              height: "32px",
                              borderRadius: "8px",
                              background: pathname === item.to
                                ? "linear-gradient(135deg, rgba(139, 92, 246, 0.22), rgba(23, 199, 255, 0.18))"
                                : "var(--bg-glass)",
                              color: pathname === item.to ? "#9b8bff" : "var(--text-muted)",
                              transition: "all 0.2s",
                              border: "1px solid var(--border-subtle)",
                            }}
                          >
                            <Icon size={16} />
                          </div>
                          <div>
                            <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                              {item.label}
                            </p>
                            <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                              {item.description}
                            </p>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ))}
        </nav>

        <button
          className="lg:hidden flex items-center justify-center"
          onClick={() => setMobileOpen((value) => !value)}
          style={{
            width: "36px",
            height: "36px",
            borderRadius: "8px",
            background: "var(--bg-glass)",
            border: "1px solid var(--border-subtle)",
            color: "var(--text-primary)",
            cursor: "pointer",
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {mobileOpen
              ? (
                <>
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </>
              )
              : (
                <>
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </>
              )}
          </svg>
        </button>
      </div>

      {mobileOpen && (
        <div className="lg:hidden px-4 pb-5 animate-fade-in-up" style={{ borderTop: "1px solid var(--border-subtle)" }}>
          <Link
            href="/"
            onClick={() => setMobileOpen(false)}
            className="block px-3 py-2.5 mt-2 text-sm font-medium rounded-lg"
            style={{
              color: pathname === "/" ? "var(--text-primary)" : "var(--text-secondary)",
              background: pathname === "/" ? "var(--bg-glass-hover)" : "transparent",
              textDecoration: "none",
            }}
          >
            {homeLabel}
          </Link>

          {navGroups.map((group) => (
            <div key={group.id} className="mt-3">
              <p className="px-3 text-xs font-bold uppercase tracking-[0.15em] mb-2" style={{ color: "var(--text-muted)" }}>
                {group.label}
              </p>
              {group.items.map((item) => {
                const Icon = getToolIcon(item.iconKey);

                return (
                  <Link
                    key={item.to}
                    href={item.to}
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200"
                    style={{
                      color: pathname === item.to ? "var(--text-primary)" : "var(--text-secondary)",
                      background: pathname === item.to ? "var(--bg-glass-hover)" : "transparent",
                      textDecoration: "none",
                    }}
                  >
                    <span style={{ color: "var(--text-muted)", width: "16px", height: "16px", display: "flex", alignItems: "center" }}>
                      <Icon size={16} />
                    </span>
                    {item.label}
                  </Link>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </header>
  );
}
