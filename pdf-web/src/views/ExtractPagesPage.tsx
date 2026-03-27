"use client";

import ClientAdSlot from "@/components/ClientAdSlot";
import type { ToolPageCopy } from "@/app/site";
import { useRef, useState } from "react";
import { getDownloadUrl } from "../api/pdfApi";
import SingleFileDropzone from "../components/SingleFileDropzone";
import { getApiErrorMessage, useExtractPagesMutation, usePageCountMutation } from "../hooks/usePdfMutations";

interface ExtractPagesPageProps {
  pageCopy: ToolPageCopy;
}

export default function ExtractPagesPage({ pageCopy }: ExtractPagesPageProps) {
  const fileInputCopy = pageCopy.fileInput!;
  const selectionCopy = pageCopy.selectionSection!;
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [selectedPages, setSelectedPages] = useState<number[]>([]);
  const [message, setMessage] = useState("");
  const [downloadUrl, setDownloadUrl] = useState("");
  const [error, setError] = useState("");
  const pageCountMutation = usePageCountMutation();
  const extractMutation = useExtractPagesMutation();
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
      setSelectedPages([]);
    } catch (error) {
      if (requestId !== requestIdRef.current) return;
      setPageCount(0);
      setSelectedPages([]);
      setError(getApiErrorMessage(error, "Failed to read page count."));
    }
  };

  const togglePage = (page: number) => {
    setSelectedPages((prev) =>
      prev.includes(page) ? prev.filter((p) => p !== page) : [...prev, page].sort((a, b) => a - b)
    );
  };

  const selectAll = () => setSelectedPages(Array.from({ length: pageCount }, (_, i) => i + 1));
  const clearSelection = () => setSelectedPages([]);

  const handleSubmit = async () => {
    setError(""); setMessage(""); setDownloadUrl("");
    if (!file) { setError("Please select a PDF file."); return; }
    if (selectedPages.length === 0) { setError("Please select at least one page."); return; }

    try {
      const result = await extractMutation.mutateAsync({ file, pages: selectedPages.join(",") });
      setMessage(result.message);
      setDownloadUrl(getDownloadUrl(result.download_url));
    } catch (error) {
      setError(getApiErrorMessage(error, "Extraction failed."));
    }
  };

  return (
      <section className="app-shell tool-page-shell relative">
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
          <div className="orb orb-indigo animate-pulse-glow" style={{ width: "300px", height: "300px", top: "-30px", left: "-60px" }} />
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
                <label className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                  {selectionCopy.label}{" "}
                  <span className="font-normal" style={{ color: "var(--text-muted)" }}>
                    ({selectedPages.length} {selectionCopy.selectedSuffix})
                  </span>
                </label>
                <div className="flex gap-2">
                  <button onClick={selectAll} className="btn-ghost text-xs px-3 py-1.5">{selectionCopy.selectAllLabel}</button>
                  <button onClick={clearSelection} className="btn-ghost text-xs px-3 py-1.5">{selectionCopy.clearLabel}</button>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {Array.from({ length: pageCount }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => togglePage(page)}
                    className="flex items-center justify-center rounded-lg text-sm font-semibold transition-all duration-200"
                    style={{
                      width: "44px",
                      height: "44px",
                      background: selectedPages.includes(page) ? "var(--accent-gradient)" : "var(--bg-glass)",
                      border: `1px solid ${selectedPages.includes(page) ? "transparent" : "var(--border-subtle)"}`,
                      color: selectedPages.includes(page) ? "white" : "var(--text-secondary)",
                      cursor: "pointer",
                      boxShadow: selectedPages.includes(page) ? "0 4px 12px rgba(99,102,241,0.3)" : "none",
                    }}
                  >
                    {page}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-col gap-3 sm:flex-row">
            <button onClick={handleSubmit} disabled={extractMutation.isPending || !file || selectedPages.length === 0} className="btn-accent">
              {extractMutation.isPending
                ? pageCopy.actions.busyLabel
                : `${selectionCopy.actionPrefix} ${selectedPages.length} ${
                    selectedPages.length === 1 ? selectionCopy.actionUnitSingular : selectionCopy.actionUnitPlural
                  }`}
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
          {downloadUrl && (
            <a href={downloadUrl} target="_blank" rel="noreferrer" className="btn-accent mt-4 w-full text-center" style={{ background: "linear-gradient(135deg,#10b981,#059669)", boxShadow: "0 4px 16px rgba(16,185,129,0.3)" }}>
              ↓ {pageCopy.actions.downloadLabel}
            </a>
          )}
        </div>
      </section>
  );
}
