"use client";

import ClientAdSlot from "@/components/ClientAdSlot";
import type { ToolPageCopy } from "@/app/site";
import { useState } from "react";
import { getDownloadUrl } from "../api/pdfApi";
import SingleFileDropzone from "../components/SingleFileDropzone";
import { getApiErrorMessage, useRotatePdfMutation } from "../hooks/usePdfMutations";

interface RotatePdfPageProps {
  pageCopy: ToolPageCopy;
}

export default function RotatePdfPage({ pageCopy }: RotatePdfPageProps) {
  const fileInputCopy = pageCopy.fileInput!;
  const rotationFieldCopy = pageCopy.rotationField!;
  const pagesFieldCopy = pageCopy.pagesField!;
  const [file, setFile] = useState<File | null>(null);
  const [rotation, setRotation] = useState(90);
  const [pages, setPages] = useState("");
  const [message, setMessage] = useState("");
  const [downloadUrl, setDownloadUrl] = useState("");
  const [error, setError] = useState("");
  const rotateMutation = useRotatePdfMutation();

  const handleSubmit = async () => {
    setError(""); setMessage(""); setDownloadUrl("");
    if (!file) { setError("Please select a PDF file."); return; }

    try {
      const result = await rotateMutation.mutateAsync({ file, rotation, pages: pages || undefined });
      setMessage(result.message);
      setDownloadUrl(getDownloadUrl(result.download_url));
    } catch (error) {
      setError(getApiErrorMessage(error, "Rotation failed."));
    }
  };

  return (
      <section className="app-shell tool-page-shell relative">
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
          <div className="orb orb-violet animate-pulse-glow" style={{ width: "300px", height: "300px", top: "-50px", right: "-80px" }} />
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
          {/* File input */}
          <div className="mb-6">
            <label className="block text-sm font-semibold mb-2" style={{ color: "var(--text-primary)" }}>{fileInputCopy.label}</label>
            <SingleFileDropzone
              accept=".pdf"
              file={file}
              onFileSelected={setFile}
              placeholder={fileInputCopy.placeholder || ""}
            />
          </div>

          {/* Rotation selector */}
          <div className="mb-6">
            <label className="block text-sm font-semibold mb-3" style={{ color: "var(--text-primary)" }}>{rotationFieldCopy.label}</label>
            <div className="flex gap-3">
              {[90, 180, 270].map((deg) => (
                <button
                  key={deg}
                  onClick={() => setRotation(deg)}
                  className={rotation === deg ? "btn-accent" : "btn-ghost"}
                >
                  {deg}°
                </button>
              ))}
            </div>
          </div>

          {/* Pages input */}
          <div className="mb-6">
            <label className="block text-sm font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
              {pagesFieldCopy.label} <span className="font-normal" style={{ color: "var(--text-muted)" }}>({pagesFieldCopy.hint})</span>
            </label>
            <input
              type="text"
              value={pages}
              onChange={(e) => setPages(e.target.value)}
              placeholder={pagesFieldCopy.placeholder}
              className="w-full rounded-xl px-4 py-3 text-sm outline-none transition"
              style={{
                background: "var(--bg-glass)",
                border: "1px solid var(--border-subtle)",
                color: "var(--text-primary)",
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = "var(--accent-from)"; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = "var(--border-subtle)"; }}
            />
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button onClick={handleSubmit} disabled={rotateMutation.isPending || !file} className="btn-accent">
              {rotateMutation.isPending ? pageCopy.actions.busyLabel : pageCopy.actions.primaryLabel}
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
