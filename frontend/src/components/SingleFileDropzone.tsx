"use client";

import { useRef } from "react";

interface SingleFileDropzoneProps {
  accept: string;
  file: File | null;
  onFileSelected: (file: File) => void;
  placeholder: string;
  selectedLabel?: string;
  icon?: React.ReactNode;
  hint?: string;
}

export default function SingleFileDropzone({
  accept,
  file,
  onFileSelected,
  placeholder,
  selectedLabel,
  icon,
  hint,
}: SingleFileDropzoneProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const openPicker = () => {
    inputRef.current?.click();
  };

  return (
    <div
      className="dropzone"
      role="button"
      tabIndex={0}
      onClick={openPicker}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          openPicker();
        }
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(event) => {
          const nextFile = event.target.files?.[0];
          if (nextFile) {
            onFileSelected(nextFile);
          }
          event.target.value = "";
        }}
      />
      <div className="mx-auto w-full px-2 sm:px-4">
        {icon ? (
          <div
            className="mx-auto mb-3 flex items-center justify-center animate-float"
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "14px",
            }}
          >
            {icon}
          </div>
        ) : null}
        <p className="text-sm" style={{ color: file ? "var(--text-primary)" : "var(--text-secondary)" }}>
          {file ? selectedLabel || file.name : placeholder}
        </p>
        {hint ? (
          <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
            {hint}
          </p>
        ) : null}
      </div>
    </div>
  );
}
