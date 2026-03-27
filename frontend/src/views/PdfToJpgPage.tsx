"use client";

import ClientAdSlot from "@/components/ClientAdSlot";
import type { ToolPageCopy } from "@/app/site";
import { useState } from "react";
import { getDownloadUrl } from "../api/pdfApi";
import SingleFileDropzone from "../components/SingleFileDropzone";
import { getApiErrorMessage, usePdfToJpgMutation } from "../hooks/usePdfMutations";

interface PdfToJpgPageProps {
  pageCopy: ToolPageCopy;
}

export default function PdfToJpgPage({ pageCopy }: PdfToJpgPageProps) {
  const fileInputCopy = pageCopy.fileInput!;
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState("");
  const [downloadUrl, setDownloadUrl] = useState("");
  const [error, setError] = useState("");
  const toJpgMutation = usePdfToJpgMutation();

  const handleSubmit = async () => {
    setError(""); setMessage(""); setDownloadUrl("");
    if (!file) { setError("Please select a PDF file."); return; }

    try {
      const result = await toJpgMutation.mutateAsync(file);
      setMessage(result.message);
      setDownloadUrl(getDownloadUrl(result.download_url));
    } catch (err) {
      setError(getApiErrorMessage(err, "Conversion failed."));
    }
  };

  return (
      <section className="app-shell tool-page-shell relative">
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
          <div className="orb orb-cyan" style={{ width: "280px", height: "280px", top: "-40px", left: "-60px" }} />
        </div>

        <div className="tool-page-header">
          <p className="text-sm font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--accent-from)" }}>{pageCopy.eyebrow}</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl" style={{ color: "var(--text-primary)" }}>{pageCopy.title}</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 sm:text-base" style={{ color: "var(--text-secondary)" }}>
            {pageCopy.description}
          </p>
        </div>

        <ClientAdSlot slotId="tool_after_header" scope="tool_page" categories={["tool"]} className="mb-6 cms-ad-slot-center-narrow" />

        <div className="glass-card tool-page-panel">
          <div className="mb-6">
            <label className="block text-sm font-semibold mb-2" style={{ color: "var(--text-primary)" }}>{fileInputCopy.label}</label>
            <SingleFileDropzone
              accept=".pdf"
              file={file}
              onFileSelected={setFile}
              placeholder={fileInputCopy.placeholder || ""}
            />
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button onClick={handleSubmit} disabled={toJpgMutation.isPending || !file} className="btn-accent">
              {toJpgMutation.isPending ? pageCopy.actions.busyLabel : pageCopy.actions.primaryLabel}
            </button>
          </div>

          {message && (
            <div className="mt-4 rounded-xl p-4 text-sm" style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)", color: "#34d399" }}>✓ {message}</div>
          )}
          {error && (
            <div className="mt-4 rounded-xl p-4 text-sm" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171" }}>✕ {error}</div>
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
