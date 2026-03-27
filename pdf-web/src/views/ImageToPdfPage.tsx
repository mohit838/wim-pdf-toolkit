"use client";

import ClientAdSlot from "@/components/ClientAdSlot";
import type { ToolPageCopy } from "@/app/site";
import { useMemo, useRef, useState } from "react";
import { getDownloadUrl } from "../api/pdfApi";
import { getApiErrorMessage, useImageToPdfMutation } from "../hooks/usePdfMutations";

interface ImageToPdfPageProps {
  pageCopy: ToolPageCopy;
}

export default function ImageToPdfPage({ pageCopy }: ImageToPdfPageProps) {
  const fileInputCopy = pageCopy.fileInput!;
  const imageListCopy = pageCopy.imageList!;
  const [files, setFiles] = useState<File[]>([]);
  const [message, setMessage] = useState("");
  const [downloadUrl, setDownloadUrl] = useState("");
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);
  const imageToPdfMutation = useImageToPdfMutation();

  const totalSize = useMemo(() => files.reduce((s, f) => s + f.size, 0), [files]);

  const handleFilesSelected = (incoming: FileList | null) => {
    if (!incoming) return;
    setFiles((prev) => [...prev, ...Array.from(incoming)]);
  };

  const removeFile = (idx: number) => setFiles((prev) => prev.filter((_, i) => i !== idx));

  const handleSubmit = async () => {
    setError(""); setMessage(""); setDownloadUrl("");
    if (files.length === 0) { setError("Please select at least one image."); return; }

    try {
      const result = await imageToPdfMutation.mutateAsync(files);
      setMessage(result.message);
      setDownloadUrl(getDownloadUrl(result.download_url));
    } catch (error) {
      setError(getApiErrorMessage(error, "Conversion failed."));
    }
  };

  return (
      <section className="app-shell tool-page-shell relative">
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
          <div className="orb orb-violet animate-pulse-glow" style={{ width: "280px", height: "280px", bottom: "10%", right: "-60px" }} />
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
            <label className="mb-2 block text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{fileInputCopy.label}</label>
            <div
              className="dropzone"
              role="button"
              tabIndex={0}
              onClick={() => inputRef.current?.click()}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  inputRef.current?.click();
                }
              }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); handleFilesSelected(e.dataTransfer.files); }}
            >
              <input
                ref={inputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/bmp,image/tiff,image/webp"
                multiple
                className="hidden"
                onChange={(e) => { handleFilesSelected(e.target.files); if (e.target) e.target.value = ""; }}
              />
              <div className="mx-auto w-full px-2 sm:px-4">
                <div className="mx-auto mb-3 flex items-center justify-center animate-float" style={{ width: "48px", height: "48px", borderRadius: "14px", background: "rgba(139,92,246,0.1)", color: "var(--accent-from)" }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" />
                  </svg>
                </div>
                <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{fileInputCopy.dropzoneTitle}</p>
                <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>{fileInputCopy.dropzoneSubtitle}</p>
                <p className="mt-2 text-xs" style={{ color: "var(--text-muted)" }}>{fileInputCopy.dropzoneHint}</p>
              </div>
            </div>
          </div>

          {files.length > 0 && (
            <div className="mb-6 rounded-xl p-4" style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)" }}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                  {files.length} {files.length === 1 ? imageListCopy.itemLabelSingular : imageListCopy.itemLabelPlural}
                </span>
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>{(totalSize / 1024 / 1024).toFixed(2)} MB</span>
              </div>
              <div className="space-y-2">
                {files.map((file, i) => (
                  <div key={`${file.name}-${i}`} className="flex items-center justify-between gap-3 rounded-lg px-3 py-2" style={{ background: "var(--bg-glass)" }}>
                    <span className="truncate text-sm" style={{ color: "var(--text-primary)" }}>{file.name}</span>
                    <button
                      onClick={() => removeFile(i)}
                      aria-label={fileInputCopy.removeFileLabel}
                      title={fileInputCopy.removeFileLabel}
                      style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: "4px" }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = "#f87171"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-muted)"; }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-col gap-3 sm:flex-row">
            <button onClick={() => { setFiles([]); setMessage(""); setError(""); setDownloadUrl(""); }} className="btn-ghost">{pageCopy.actions.clearLabel}</button>
            <button onClick={handleSubmit} disabled={imageToPdfMutation.isPending || files.length === 0} className="btn-accent">
              {imageToPdfMutation.isPending ? pageCopy.actions.busyLabel : pageCopy.actions.primaryLabel}
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
