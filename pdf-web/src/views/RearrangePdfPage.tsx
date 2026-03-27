"use client";

import ClientAdSlot from "@/components/ClientAdSlot";
import type { ToolPageCopy } from "@/app/site";
import { useCallback, useRef, useState } from "react";
import { getDownloadUrl } from "../api/pdfApi";
import SingleFileDropzone from "../components/SingleFileDropzone";
import { getApiErrorMessage, usePageCountMutation, useRearrangePdfMutation } from "../hooks/usePdfMutations";

interface RearrangePdfPageProps {
  pageCopy: ToolPageCopy;
}

export default function RearrangePdfPage({ pageCopy }: RearrangePdfPageProps) {
  const fileInputCopy = pageCopy.fileInput!;
  const orderSectionCopy = pageCopy.orderSection!;
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [order, setOrder] = useState<number[]>([]);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [downloadUrl, setDownloadUrl] = useState("");
  const [error, setError] = useState("");
  const pageCountMutation = usePageCountMutation();
  const rearrangeMutation = useRearrangePdfMutation();
  const requestIdRef = useRef(0);

  const handleFileChange = async (f: File) => {
    setFile(f);
    setError("");
    setMessage("");
    setDownloadUrl("");
    const requestId = ++requestIdRef.current;
    try {
      const result = await pageCountMutation.mutateAsync(f);
      if (requestId !== requestIdRef.current) return;
      setPageCount(result.page_count);
      setOrder(Array.from({ length: result.page_count }, (_, i) => i + 1));
    } catch (error) {
      if (requestId !== requestIdRef.current) return;
      setPageCount(0);
      setOrder([]);
      setError(getApiErrorMessage(error, "Failed to read page count."));
    }
  };

  const handleDragStart = useCallback((idx: number) => {
    setDragIdx(idx);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (dragIdx === null || dragIdx === idx) return;

    setOrder((prev) => {
      const next = [...prev];
      const [moved] = next.splice(dragIdx, 1);
      next.splice(idx, 0, moved);
      return next;
    });
    setDragIdx(idx);
  }, [dragIdx]);

  const handleDragEnd = useCallback(() => {
    setDragIdx(null);
  }, []);

  const movePage = useCallback((fromIndex: number, toIndex: number) => {
    setOrder((prev) => {
      if (fromIndex === toIndex || toIndex < 0 || toIndex >= prev.length) {
        return prev;
      }

      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
  }, []);

  const nudgePage = useCallback((index: number, direction: -1 | 1) => {
    movePage(index, index + direction);
  }, [movePage]);

  const handleSubmit = async () => {
    setError(""); setMessage(""); setDownloadUrl("");
    if (!file) { setError("Please select a PDF file."); return; }
    if (order.length === 0) { setError("No pages to rearrange."); return; }

    try {
      const result = await rearrangeMutation.mutateAsync({ file, order: order.join(",") });
      setMessage(result.message);
      setDownloadUrl(getDownloadUrl(result.download_url));
    } catch (error) {
      setError(getApiErrorMessage(error, "Rearrange failed."));
    }
  };

  const resetOrder = () => setOrder(Array.from({ length: pageCount }, (_, i) => i + 1));
  const reverseOrder = () => setOrder((prev) => [...prev].reverse());

  return (
      <section className="app-shell tool-page-shell relative">
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
          <div className="orb orb-indigo animate-pulse-glow" style={{ width: "300px", height: "300px", top: "20%", right: "-80px" }} />
        </div>

        <div className="tool-page-header animate-fade-in-up">
          <p className="text-sm font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--accent-from)" }}>{pageCopy.eyebrow}</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl" style={{ color: "var(--text-primary)" }}>{pageCopy.title}</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 sm:text-base" style={{ color: "var(--text-secondary)" }}>
            {pageCopy.description}
          </p>
        </div>

        <ClientAdSlot slotId="tool_after_header" scope="tool_page" categories={["tool"]} className="mb-6 cms-ad-slot-center-narrow" />

        <div className="glass-card tool-page-panel animate-fade-in-up-delay-1">
          <div className="mb-6">
            <label className="block text-sm font-semibold mb-2" style={{ color: "var(--text-primary)" }}>{fileInputCopy.label}</label>
            <SingleFileDropzone
              accept=".pdf"
              file={file}
              onFileSelected={handleFileChange}
              placeholder={fileInputCopy.placeholder || ""}
              selectedLabel={file ? `${file.name} (${pageCount} ${fileInputCopy.selectedCountLabel})` : undefined}
            />
          </div>

          {pageCount > 0 && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{orderSectionCopy.label}</label>
                <div className="flex gap-2">
                  <button onClick={resetOrder} className="btn-ghost text-xs px-3 py-1.5">{orderSectionCopy.resetLabel}</button>
                  <button onClick={reverseOrder} className="btn-ghost text-xs px-3 py-1.5">{orderSectionCopy.reverseLabel}</button>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {order.map((page, idx) => (
                  <div
                    key={`${page}-${idx}`}
                    draggable
                    onDragStart={() => handleDragStart(idx)}
                    onDragOver={(e) => handleDragOver(e, idx)}
                    onDragEnd={handleDragEnd}
                    className="flex flex-col items-center justify-center rounded-xl cursor-grab active:cursor-grabbing transition-all duration-200 select-none p-2"
                    style={{
                      width: "86px",
                      minHeight: "104px",
                      background: dragIdx === idx ? "rgba(139,92,246,0.15)" : "var(--bg-glass)",
                      border: `1px solid ${dragIdx === idx ? "var(--accent-from)" : "var(--border-subtle)"}`,
                      boxShadow: dragIdx === idx ? "0 4px 16px rgba(139,92,246,0.2)" : "none",
                      transform: dragIdx === idx ? "scale(1.05)" : "scale(1)",
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: "var(--text-muted)", marginBottom: "6px" }}>
                      <line x1="8" y1="6" x2="16" y2="6" /><line x1="8" y1="12" x2="16" y2="12" /><line x1="8" y1="18" x2="16" y2="18" />
                    </svg>
                    <span className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>{page}</span>
                    <div className="mt-2 flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => nudgePage(idx, -1)}
                        disabled={idx === 0}
                        className="btn-ghost px-2 py-1 text-[10px]"
                        aria-label={orderSectionCopy.moveEarlierLabel}
                      >
                        ←
                      </button>
                      <button
                        type="button"
                        onClick={() => nudgePage(idx, 1)}
                        disabled={idx === order.length - 1}
                        className="btn-ghost px-2 py-1 text-[10px]"
                        aria-label={orderSectionCopy.moveLaterLabel}
                      >
                        →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-2 text-xs" style={{ color: "var(--text-muted)" }}>
                {orderSectionCopy.helperText} {orderSectionCopy.currentOrderLabel}: {order.join(", ")}
              </p>
            </div>
          )}

          <div className="flex flex-col gap-3 sm:flex-row">
            <button onClick={handleSubmit} disabled={rearrangeMutation.isPending || !file || order.length === 0} className="btn-accent">
              {rearrangeMutation.isPending ? pageCopy.actions.busyLabel : pageCopy.actions.primaryLabel}
            </button>
          </div>

          {message && (
            <div className="mt-4 rounded-xl p-4 text-sm animate-fade-in-up" style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)", color: "#34d399" }}>✓ {message}</div>
          )}
          {error && (
            <div className="mt-4 rounded-xl p-4 text-sm animate-fade-in-up" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171" }}>✕ {error}</div>
          )}
          {downloadUrl && (
            <a href={downloadUrl} target="_blank" rel="noreferrer" className="btn-accent mt-4 w-full text-center" style={{ background: "linear-gradient(135deg,#10b981,#059669)", boxShadow: "0 4px 16px rgba(16,185,129,0.3)" }}>
              ↓ {pageCopy.actions.downloadLabel}
            </a>
          )}
        </div>
      </section>
  );
}
