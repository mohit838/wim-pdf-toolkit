"use client";

import ClientAdSlot from "@/components/ClientAdSlot";
import type { ToolPageCopy } from "@/app/site";
import { useRef, useState } from "react";
import { getDownloadUrl } from "../api/pdfApi";
import SingleFileDropzone from "../components/SingleFileDropzone";
import { getApiErrorMessage, usePageCountMutation, useSplitPdfMutation } from "../hooks/usePdfMutations";

interface SplitPdfPageProps {
  pageCopy: ToolPageCopy;
}

export default function SplitPdfPage({ pageCopy }: SplitPdfPageProps) {
  const fileInputCopy = pageCopy.fileInput!;
  const rangeSectionCopy = pageCopy.rangeSection!;
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [ranges, setRanges] = useState<[number, number][]>([[1, 1]]);
  const [message, setMessage] = useState("");
  const [downloads, setDownloads] = useState<{ filename: string; download_url: string }[]>([]);
  const [error, setError] = useState("");
  const pageCountMutation = usePageCountMutation();
  const splitMutation = useSplitPdfMutation();
  const requestIdRef = useRef(0);

  const handleFileChange = async (f: File) => {
    setFile(f);
    setError("");
    setMessage("");
    setDownloads([]);
    const requestId = ++requestIdRef.current;
    try {
      const result = await pageCountMutation.mutateAsync(f);
      if (requestId !== requestIdRef.current) return;
      setPageCount(result.page_count);
      setRanges([[1, result.page_count]]);
    } catch (error) {
      if (requestId !== requestIdRef.current) return;
      setPageCount(0);
      setRanges([[1, 1]]);
      setError(getApiErrorMessage(error, "Failed to read page count."));
    }
  };

  const updateRange = (idx: number, field: "start" | "end", value: number) => {
    setRanges((prev) => prev.map((r, i) => (i === idx ? (field === "start" ? [value, r[1]] : [r[0], value]) : r)));
  };

  const addRange = () => setRanges((prev) => [...prev, [1, pageCount || 1]]);
  const removeRange = (idx: number) => setRanges((prev) => prev.filter((_, i) => i !== idx));

  const handleSubmit = async () => {
    setError(""); setMessage(""); setDownloads([]);
    if (!file) { setError("Please select a PDF file."); return; }

    try {
      const result = await splitMutation.mutateAsync({ file, ranges });
      setMessage(result.message);
      setDownloads(result.files);
    } catch (error) {
      setError(getApiErrorMessage(error, "Split failed."));
    }
  };

  return (
      <section className="app-shell tool-page-shell relative">
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
          <div className="orb orb-cyan animate-pulse-glow" style={{ width: "300px", height: "300px", bottom: "0", left: "-80px" }} />
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
              <label className="block text-sm font-semibold mb-3" style={{ color: "var(--text-primary)" }}>
                {rangeSectionCopy.label}
              </label>
              <div className="space-y-3">
                {ranges.map((range, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <span className="text-xs font-semibold" style={{ color: "var(--text-muted)", minWidth: "50px" }}>
                      {rangeSectionCopy.partPrefix} {idx + 1}
                    </span>
                    <input
                      type="number" min={1} max={pageCount} value={range[0]}
                      onChange={(e) => updateRange(idx, "start", parseInt(e.target.value) || 1)}
                      className="w-20 rounded-lg px-3 py-2 text-sm text-center outline-none"
                      style={{ background: "var(--bg-glass)", border: "1px solid var(--border-subtle)", color: "var(--text-primary)" }}
                    />
                    <span style={{ color: "var(--text-muted)" }}>{rangeSectionCopy.toLabel}</span>
                    <input
                      type="number" min={1} max={pageCount} value={range[1]}
                      onChange={(e) => updateRange(idx, "end", parseInt(e.target.value) || 1)}
                      className="w-20 rounded-lg px-3 py-2 text-sm text-center outline-none"
                      style={{ background: "var(--bg-glass)", border: "1px solid var(--border-subtle)", color: "var(--text-primary)" }}
                    />
                    {ranges.length > 1 && (
                      <button
                        onClick={() => removeRange(idx)}
                        className="btn-ghost px-3 py-2 text-xs"
                        aria-label={rangeSectionCopy.removeLabel}
                        title={rangeSectionCopy.removeLabel}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button onClick={addRange} className="btn-ghost mt-3 text-xs">{rangeSectionCopy.addLabel}</button>
            </div>
          )}

          <div className="flex flex-col gap-3 sm:flex-row">
            <button onClick={handleSubmit} disabled={splitMutation.isPending || !file} className="btn-accent">
              {splitMutation.isPending ? pageCopy.actions.busyLabel : pageCopy.actions.primaryLabel}
            </button>
          </div>

          {message && (
            <div className="mt-4 rounded-xl p-4 text-sm animate-fade-in-up" style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)", color: "#34d399" }}>
              ✓ {message}
            </div>
          )}
          {error && (
            <div className="mt-4 rounded-xl p-4 text-sm animate-fade-in-up" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171" }}>
              ✕ {error}
            </div>
          )}
          {downloads.length > 0 && (
            <div className="mt-4 space-y-2">
              {downloads.map((dl, i) => (
                <a key={i} href={getDownloadUrl(dl.download_url)} target="_blank" rel="noreferrer" className="btn-accent w-full text-center" style={{ background: "linear-gradient(135deg,#10b981,#059669)", boxShadow: "0 4px 16px rgba(16,185,129,0.3)" }}>
                  ↓ {pageCopy.actions.downloadPrefix} {dl.filename}
                </a>
              ))}
            </div>
          )}
        </div>
      </section>
  );
}
