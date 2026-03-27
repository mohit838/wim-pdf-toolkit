"use client";

import ClientAdSlot from "@/components/ClientAdSlot";
import type { ToolPageCopy } from "@/app/site";
import { useState } from "react";
import { getDownloadUrl } from "../api/pdfApi";
import SingleFileDropzone from "../components/SingleFileDropzone";
import { getApiErrorMessage, useAddPageNumbersMutation } from "../hooks/usePdfMutations";

interface AddPageNumbersPageProps {
  pageCopy: ToolPageCopy;
}

const POSITIONS = [
  "bottom-center",
  "bottom-right",
  "bottom-left",
  "top-center",
  "top-right",
  "top-left",
] as const;

export default function AddPageNumbersPage({ pageCopy }: AddPageNumbersPageProps) {
  const fileInputCopy = pageCopy.fileInput!;
  const [file, setFile] = useState<File | null>(null);
  const [startNumber, setStartNumber] = useState(1);
  const [fontSize, setFontSize] = useState(11);
  const [position, setPosition] = useState<(typeof POSITIONS)[number]>("bottom-center");
  const [message, setMessage] = useState("");
  const [downloadUrl, setDownloadUrl] = useState("");
  const [error, setError] = useState("");
  const mutation = useAddPageNumbersMutation();

  const handleSubmit = async () => {
    setError("");
    setMessage("");
    setDownloadUrl("");
    if (!file) {
      setError("Please select a PDF file.");
      return;
    }

    try {
      const result = await mutation.mutateAsync({
        file,
        startNumber,
        fontSize,
        position,
      });
      setMessage(result.message);
      setDownloadUrl(getDownloadUrl(result.download_url));
    } catch (err) {
      setError(getApiErrorMessage(err, "Adding page numbers failed."));
    }
  };

  return (
    <section className="app-shell tool-page-shell relative">
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="orb orb-indigo" style={{ width: "280px", height: "280px", top: "-40px", left: "-60px" }} />
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

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <label className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
            Start number
            <input
              type="number"
              min={1}
              value={startNumber}
              onChange={(event) => setStartNumber(Math.max(1, Number(event.target.value || 1)))}
              className="mt-2 w-full rounded-xl border px-3 py-2"
              style={{ borderColor: "var(--stroke)", background: "var(--panel-soft)", color: "var(--text-primary)" }}
            />
          </label>
          <label className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
            Font size
            <input
              type="number"
              min={8}
              max={48}
              value={fontSize}
              onChange={(event) => setFontSize(Math.min(48, Math.max(8, Number(event.target.value || 11))))}
              className="mt-2 w-full rounded-xl border px-3 py-2"
              style={{ borderColor: "var(--stroke)", background: "var(--panel-soft)", color: "var(--text-primary)" }}
            />
          </label>
          <label className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
            Position
            <select
              value={position}
              onChange={(event) => setPosition(event.target.value as (typeof POSITIONS)[number])}
              className="mt-2 w-full rounded-xl border px-3 py-2"
              style={{ borderColor: "var(--stroke)", background: "var(--panel-soft)", color: "var(--text-primary)" }}
            >
              {POSITIONS.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <button onClick={handleSubmit} disabled={mutation.isPending || !file} className="btn-accent">
            {mutation.isPending ? pageCopy.actions.busyLabel : pageCopy.actions.primaryLabel}
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
