"use client";

import ClientAdSlot from "@/components/ClientAdSlot";
import type { ToolPageCopy } from "@/app/site";
import { useMemo, useState } from "react";
import { getDownloadUrl } from "../api/pdfApi";
import FileDropzone from "../components/FileDropzone";
import { getApiErrorMessage, useMergePdfMutation } from "../hooks/usePdfMutations";

interface MergePdfPageProps {
  pageCopy: ToolPageCopy;
}

export default function MergePdfPage({ pageCopy }: MergePdfPageProps) {
  const fileInputCopy = pageCopy.fileInput!;
  const summaryCopy = pageCopy.summary!;
  const statusPanelCopy = pageCopy.statusPanel!;
  const [files, setFiles] = useState<File[]>([]);
  const [message, setMessage] = useState("");
  const [downloadUrl, setDownloadUrl] = useState("");
  const [error, setError] = useState("");
  const mergeMutation = useMergePdfMutation();

  const totalSize = useMemo(() => {
    return files.reduce((sum, file) => sum + file.size, 0);
  }, [files]);

  const handleRemoveFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleMerge = async () => {
    setError("");
    setMessage("");
    setDownloadUrl("");

    if (files.length < 2) {
      setError("Please select at least 2 PDF files.");
      return;
    }

    try {
      const result = await mergeMutation.mutateAsync(files);
      setMessage(result.message);
      setDownloadUrl(getDownloadUrl(result.download_url));
    } catch (error) {
      setError(getApiErrorMessage(error, "Failed to merge PDFs."));
    }
  };

  const handleClear = () => {
    setFiles([]);
    setMessage("");
    setError("");
    setDownloadUrl("");
  };

  return (
      <section className="app-shell tool-page-shell relative">
        {/* Background orbs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
          <div className="orb orb-violet animate-pulse-glow" style={{ width: "350px", height: "350px", top: "-50px", right: "-100px" }} />
          <div className="orb orb-cyan animate-pulse-glow" style={{ width: "250px", height: "250px", bottom: "20%", left: "-80px", animationDelay: "2s" }} />
        </div>

        {/* Header */}
        <div className="tool-page-header animate-fade-in-up">
          <p
            className="text-sm font-semibold uppercase tracking-[0.2em]"
            style={{ color: "var(--accent-from)" }}
          >
            {pageCopy.eyebrow}
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl" style={{ color: "var(--text-primary)" }}>
            {pageCopy.title}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 sm:text-base" style={{ color: "var(--text-secondary)" }}>
            {pageCopy.description}
          </p>
        </div>

        <ClientAdSlot slotId="tool_after_header" scope="tool_page" categories={["tool"]} className="mb-6 cms-ad-slot-center-narrow" />

        <div className="glass-card tool-page-panel animate-fade-in-up-delay-1">
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(18rem,0.82fr)] xl:gap-8">
            <div>
              <label className="mb-2 block text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                {fileInputCopy.label}
              </label>
              <FileDropzone
                files={files}
                onFilesSelected={setFiles}
                onRemoveFile={handleRemoveFile}
                copy={{
                  dropzoneTitle: fileInputCopy.dropzoneTitle,
                  dropzoneSubtitle: fileInputCopy.dropzoneSubtitle,
                  dropzoneHint: fileInputCopy.dropzoneHint,
                  listTitle: fileInputCopy.listTitle,
                  removeFileLabel: fileInputCopy.removeFileLabel,
                  countSingular: fileInputCopy.countSingular,
                  countPlural: fileInputCopy.countPlural,
                }}
              />

              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-sm" style={{ color: "var(--text-secondary)" }}>
                  {summaryCopy.totalSizeLabel}:{" "}
                  <span className="font-semibold" style={{ color: "var(--text-primary)" }}>
                    {(totalSize / 1024 / 1024).toFixed(2)} MB
                  </span>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <button onClick={handleClear} className="btn-ghost">
                    {pageCopy.actions.clearLabel}
                  </button>

                  <button
                    onClick={handleMerge}
                    disabled={mergeMutation.isPending || files.length < 2}
                    className="btn-accent"
                  >
                    {mergeMutation.isPending ? (
                      <>
                        <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                        </svg>
                        {pageCopy.actions.busyLabel}
                      </>
                    ) : (
                      <>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M16 3h5v5" /><path d="M8 3H3v5" />
                          <path d="M12 22v-8.3a4 4 0 0 0-1.172-2.872L3 3" />
                          <path d="m15 9 6-6" />
                        </svg>
                        {pageCopy.actions.primaryLabel}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl p-5" style={{ background: "var(--bg-glass)", border: "1px solid var(--border-subtle)" }}>
                <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
                  {statusPanelCopy.title}
                </h2>

                <div className="mt-5 space-y-4">
                  <div className="rounded-xl p-4" style={{ background: "rgba(255,255,255,0.02)" }}>
                    <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
                      {statusPanelCopy.filesSelectedLabel}
                    </p>
                    <p className="mt-1 text-3xl font-bold text-gradient">
                      {files.length}
                    </p>
                  </div>

                  <div className="rounded-xl p-4" style={{ background: "rgba(255,255,255,0.02)" }}>
                    <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
                      {statusPanelCopy.workflowLabel}
                    </p>
                    <div className="mt-3 space-y-2">
                      {statusPanelCopy.workflowSteps.map((step, i) => (
                        <div key={step} className="flex items-center gap-2.5">
                          <span
                            className="flex items-center justify-center shrink-0 text-xs font-bold"
                            style={{
                              width: "22px",
                              height: "22px",
                              borderRadius: "6px",
                              background:
                                i === 0 && files.length > 0
                                  ? "rgba(16, 185, 129, 0.15)"
                                  : i === 1 && mergeMutation.isPending
                                  ? "rgba(139, 92, 246, 0.15)"
                                  : i === 2 && downloadUrl
                                  ? "rgba(16, 185, 129, 0.15)"
                                  : "var(--bg-glass)",
                              color:
                                i === 0 && files.length > 0
                                  ? "#34d399"
                                  : i === 1 && mergeMutation.isPending
                                  ? "var(--accent-from)"
                                  : i === 2 && downloadUrl
                                  ? "#34d399"
                                  : "var(--text-muted)",
                            }}
                          >
                            {i + 1}
                          </span>
                          <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
                            {step}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {message && (
            <div
              className="mt-5 rounded-xl p-4 text-sm animate-fade-in-up"
              style={{
                background: "rgba(16, 185, 129, 0.08)",
                border: "1px solid rgba(16, 185, 129, 0.2)",
                color: "#34d399",
              }}
            >
              <div className="flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
                {message}
              </div>
            </div>
          )}

          {error && (
            <div
              className="mt-5 rounded-xl p-4 text-sm animate-fade-in-up"
              style={{
                background: "rgba(239, 68, 68, 0.08)",
                border: "1px solid rgba(239, 68, 68, 0.2)",
                color: "#f87171",
              }}
            >
              <div className="flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="15" y1="9" x2="9" y2="15" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                </svg>
                {error}
              </div>
            </div>
          )}

          {downloadUrl && (
            <a
              href={downloadUrl}
              target="_blank"
              rel="noreferrer"
              className="btn-accent mt-5 w-full text-center"
              style={{
                background: "linear-gradient(135deg, #10b981, #059669)",
                boxShadow: "0 4px 16px rgba(16, 185, 129, 0.3)",
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              {pageCopy.actions.downloadLabel}
            </a>
          )}
        </div>
      </section>
  );
}
