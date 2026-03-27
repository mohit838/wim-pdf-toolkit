"use client";

import ClientAdSlot from "@/components/ClientAdSlot";
import type { ToolPageCopy } from "@/app/site";
import { useState } from "react";
import { getDownloadUrl } from "../api/pdfApi";
import SingleFileDropzone from "../components/SingleFileDropzone";
import { getApiErrorMessage, usePdfToDocxMutation } from "../hooks/usePdfMutations";

interface PdfToDocxPageProps {
  pageCopy: ToolPageCopy;
}

export default function PdfToDocxPage({ pageCopy }: PdfToDocxPageProps) {
  const fileInputCopy = pageCopy.fileInput!;
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState("");
  const [downloadUrl, setDownloadUrl] = useState("");
  const [error, setError] = useState("");
  const pdfToDocxMutation = usePdfToDocxMutation();

  const handleSubmit = async () => {
    setError(""); setMessage(""); setDownloadUrl("");
    if (!file) { setError("Please select a PDF file."); return; }

    try {
      const result = await pdfToDocxMutation.mutateAsync(file);
      setMessage(result.message);
      setDownloadUrl(getDownloadUrl(result.download_url));
    } catch (error) {
      setError(getApiErrorMessage(error, "Conversion failed."));
    }
  };

  return (
      <section className="app-shell tool-page-shell relative">
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
          <div className="orb orb-cyan animate-pulse-glow" style={{ width: "300px", height: "300px", bottom: "0", left: "-60px" }} />
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
              onFileSelected={setFile}
              placeholder={fileInputCopy.placeholder || ""}
              hint={fileInputCopy.hint}
              icon={
                <div
                  className="flex h-full w-full items-center justify-center"
                  style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444", borderRadius: "14px" }}
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                </div>
              }
            />
          </div>

          <button onClick={handleSubmit} disabled={pdfToDocxMutation.isPending || !file} className="btn-accent">
            {pdfToDocxMutation.isPending ? (
              <><svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>{pageCopy.actions.busyLabel}</>
            ) : (
              <>{pageCopy.actions.primaryLabel}</>
            )}
          </button>

          {message && <div className="mt-4 rounded-xl p-4 text-sm animate-fade-in-up" style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)", color: "#34d399" }}>✓ {message}</div>}
          {error && <div className="mt-4 rounded-xl p-4 text-sm animate-fade-in-up" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171" }}>✕ {error}</div>}
          {downloadUrl && (
            <a href={downloadUrl} target="_blank" rel="noreferrer" className="btn-accent mt-4 w-full text-center" style={{ background: "linear-gradient(135deg,#3b82f6,#2563eb)", boxShadow: "0 4px 16px rgba(59,130,246,0.3)" }}>
              ↓ {pageCopy.actions.downloadLabel}
            </a>
          )}
        </div>
      </section>
  );
}
