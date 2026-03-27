"use client";

import { fileDropzoneUi } from "@/app/site";
import { useRef, useState } from "react";

interface FileDropzoneProps {
  files: File[];
  onFilesSelected: (files: File[]) => void;
  onRemoveFile?: (index: number) => void;
  accept?: string;
  multiple?: boolean;
  copy?: {
    dropzoneTitle?: string;
    dropzoneSubtitle?: string;
    dropzoneHint?: string;
    listTitle?: string;
    removeFileLabel?: string;
    countSingular?: string;
    countPlural?: string;
  };
}

export default function FileDropzone({
  files,
  onFilesSelected,
  onRemoveFile,
  accept = ".pdf",
  multiple = true,
  copy,
}: FileDropzoneProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleIncomingFiles = (incoming: FileList | null) => {
    if (!incoming) return;
    const nextFiles = [...files, ...Array.from(incoming)];
    onFilesSelected(nextFiles);
  };

  return (
    <div className="space-y-4">
      {/* Drop area */}
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragActive(false);
          handleIncomingFiles(e.dataTransfer.files);
        }}
        className={`dropzone ${dragActive ? "drag-active" : ""}`}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          className="hidden"
          onChange={(e) => {
            handleIncomingFiles(e.target.files);
            e.target.value = "";
          }}
        />

        <div className="mx-auto w-full px-2 sm:px-4">
          {/* Upload icon */}
          <div
            className="mx-auto mb-4 flex items-center justify-center animate-float"
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "16px",
              background: "rgba(139, 92, 246, 0.1)",
              color: "var(--accent-from)",
            }}
          >
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
          </div>

          <p className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>
            {copy?.dropzoneTitle || fileDropzoneUi.dropzoneTitle}
          </p>
          <p className="mt-2 text-sm" style={{ color: "var(--text-secondary)" }}>
            {copy?.dropzoneSubtitle || fileDropzoneUi.dropzoneSubtitle}
          </p>
          <p className="mt-3 text-xs" style={{ color: "var(--text-muted)" }}>
            {copy?.dropzoneHint || fileDropzoneUi.dropzoneHint}
          </p>
        </div>
      </div>

      {/* File list */}
      {files.length > 0 && (
        <div
          className="rounded-2xl p-4"
          style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--border-subtle)",
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              {copy?.listTitle || fileDropzoneUi.listTitle}
            </h4>
            <span
              className="text-xs font-semibold px-2.5 py-1 rounded-full"
              style={{
                background: "rgba(139, 92, 246, 0.1)",
                color: "var(--accent-from)",
              }}
            >
              {files.length} {files.length === 1 ? copy?.countSingular || fileDropzoneUi.countSingular : copy?.countPlural || fileDropzoneUi.countPlural}
            </span>
          </div>

          <div className="space-y-2">
            {files.map((file, index) => (
              <div
                key={`${file.name}-${index}`}
                className="flex items-center justify-between gap-3 rounded-xl px-4 py-3 transition-colors duration-200"
                style={{
                  background: "var(--bg-glass)",
                  border: "1px solid transparent",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "var(--border-subtle)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "transparent";
                }}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="shrink-0 flex items-center justify-center"
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "8px",
                      background: "rgba(239, 68, 68, 0.1)",
                      color: "#f87171",
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                    </svg>
                  </div>
                  <span className="truncate text-sm" style={{ color: "var(--text-primary)" }}>
                    {file.name}
                  </span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </span>
                  {onRemoveFile && (
                    <button
                      onClick={(e) => { e.stopPropagation(); onRemoveFile(index); }}
                      className="flex items-center justify-center rounded-lg transition-colors duration-200"
                      style={{
                        width: "28px",
                        height: "28px",
                        background: "transparent",
                        border: "none",
                        cursor: "pointer",
                        color: "var(--text-muted)",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "rgba(239, 68, 68, 0.1)";
                        e.currentTarget.style.color = "#f87171";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "transparent";
                        e.currentTarget.style.color = "var(--text-muted)";
                      }}
                      title={copy?.removeFileLabel || fileDropzoneUi.removeFileLabel}
                      aria-label={copy?.removeFileLabel || fileDropzoneUi.removeFileLabel}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
