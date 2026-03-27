"use client";

import ClientAdSlot from "@/components/ClientAdSlot";
import type { ToolPageCopy } from "@/app/site";
import { useState } from "react";
import { getDownloadUrl } from "../api/pdfApi";
import SingleFileDropzone from "../components/SingleFileDropzone";
import { getApiErrorMessage, useWatermarkPdfMutation } from "../hooks/usePdfMutations";

interface WatermarkPdfPageProps {
  pageCopy: ToolPageCopy;
}

export default function WatermarkPdfPage({ pageCopy }: WatermarkPdfPageProps) {
  const fileInputCopy = pageCopy.fileInput!;
  const watermarkSectionCopy = pageCopy.watermarkSection!;
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState("");
  const [fontSize, setFontSize] = useState(48);
  const [opacity, setOpacity] = useState(0.15);
  const [rotation, setRotation] = useState(45);
  const [message, setMessage] = useState("");
  const [downloadUrl, setDownloadUrl] = useState("");
  const [error, setError] = useState("");
  const watermarkMutation = useWatermarkPdfMutation();

  const handleSubmit = async () => {
    setError(""); setMessage(""); setDownloadUrl("");
    if (!file) { setError("Please select a PDF file."); return; }
    if (!text.trim()) { setError("Please enter watermark text."); return; }

    try {
      const result = await watermarkMutation.mutateAsync({ file, text, fontSize, opacity, rotation });
      setMessage(result.message);
      setDownloadUrl(getDownloadUrl(result.download_url));
    } catch (error) {
      setError(getApiErrorMessage(error, "Watermark failed."));
    }
  };

  const inputStyle = {
    background: "var(--bg-glass)",
    border: "1px solid var(--border-subtle)",
    color: "var(--text-primary)",
  };

  return (
      <section className="app-shell tool-page-shell relative">
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
          <div className="orb orb-cyan animate-pulse-glow" style={{ width: "280px", height: "280px", top: "-40px", left: "-60px" }} />
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
          {/* File */}
          <div className="mb-6">
            <label className="block text-sm font-semibold mb-2" style={{ color: "var(--text-primary)" }}>{fileInputCopy.label}</label>
            <SingleFileDropzone
              accept=".pdf"
              file={file}
              onFileSelected={setFile}
              placeholder={fileInputCopy.placeholder || ""}
            />
          </div>

          {/* Text */}
          <div className="mb-6">
            <label className="block text-sm font-semibold mb-2" style={{ color: "var(--text-primary)" }}>{watermarkSectionCopy.textLabel}</label>
            <input
              type="text" value={text} onChange={(e) => setText(e.target.value)}
              placeholder={watermarkSectionCopy.textPlaceholder}
              className="w-full rounded-xl px-4 py-3 text-sm outline-none"
              style={inputStyle}
              onFocus={(e) => { e.currentTarget.style.borderColor = "var(--accent-from)"; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = "var(--border-subtle)"; }}
            />
          </div>

          {/* Settings grid */}
          <div className="grid gap-4 sm:grid-cols-3 mb-6">
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text-muted)" }}>{watermarkSectionCopy.fontSizeLabel}</label>
              <input type="number" min={12} max={120} value={fontSize} onChange={(e) => setFontSize(parseInt(e.target.value) || 48)} className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={inputStyle} />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text-muted)" }}>
                {watermarkSectionCopy.opacityLabel} <span style={{ color: "var(--text-secondary)" }}>{(opacity * 100).toFixed(0)}%</span>
              </label>
              <input
                type="range" min={0.01} max={0.5} step={0.01} value={opacity}
                onChange={(e) => setOpacity(parseFloat(e.target.value))}
                className="w-full"
                style={{ accentColor: "var(--accent-from)" }}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text-muted)" }}>{watermarkSectionCopy.angleLabel}</label>
              <input type="number" min={0} max={360} value={rotation} onChange={(e) => setRotation(parseInt(e.target.value) || 45)} className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={inputStyle} />
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button onClick={handleSubmit} disabled={watermarkMutation.isPending || !file || !text.trim()} className="btn-accent">
              {watermarkMutation.isPending ? pageCopy.actions.busyLabel : pageCopy.actions.primaryLabel}
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
