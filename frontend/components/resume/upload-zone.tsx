"use client";

import { useRef, useState } from "react";
import { FileText, UploadCloud, X } from "lucide-react";
import { cn } from "@/lib/utils";

const MAX_BYTES = 5 * 1024 * 1024;
const ACCEPTED = [".pdf", ".docx"];

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function UploadZone({
  file,
  onFileChange,
  disabled,
}: {
  file: File | null;
  onFileChange: (file: File | null) => void;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function accept(f: File | undefined | null) {
    if (!f) return;
    const lower = f.name.toLowerCase();
    if (!ACCEPTED.some((ext) => lower.endsWith(ext))) {
      setError("Only .pdf and .docx files are supported.");
      return;
    }
    if (f.size > MAX_BYTES) {
      setError("File is larger than 5 MB. Please upload a smaller resume.");
      return;
    }
    setError(null);
    onFileChange(f);
  }

  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        aria-label="Upload resume"
        onClick={() => !disabled && inputRef.current?.click()}
        onKeyDown={(e) => {
          if (!disabled && (e.key === "Enter" || e.key === " ")) inputRef.current?.click();
        }}
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          if (!disabled) accept(e.dataTransfer.files?.[0]);
        }}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed px-6 py-10 text-center transition-colors",
          dragging
            ? "border-accent bg-accent-soft"
            : "border-line hover:border-accent/50 hover:bg-surface",
          disabled && "pointer-events-none opacity-50"
        )}
      >
        <span className="flex h-12 w-12 items-center justify-center rounded-md border border-line bg-surface text-muted">
          <UploadCloud className="h-6 w-6" />
        </span>
        {file ? (
          <div className="flex items-center gap-2 rounded-md border border-line bg-bg px-3 py-2">
            <FileText className="h-4 w-4 shrink-0 text-muted" />
            <span className="text-sm font-medium text-ink">{file.name}</span>
            <span className="stat-num text-xs text-muted">{formatSize(file.size)}</span>
            <button
              type="button"
              aria-label="Remove file"
              onClick={(e) => {
                e.stopPropagation();
                onFileChange(null);
                if (inputRef.current) inputRef.current.value = "";
              }}
              className="ml-1 rounded p-0.5 text-muted hover:text-ink"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <>
            <p className="text-sm font-medium text-ink">
              Drag &amp; drop your resume here, or{" "}
              <span className="text-accent">browse files</span>
            </p>
            <p className="text-xs text-muted">PDF or DOCX, up to 5 MB</p>
          </>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.docx"
        className="hidden"
        onChange={(e) => accept(e.target.files?.[0])}
      />
      {error && <p className="mt-2 text-sm text-danger">{error}</p>}
    </div>
  );
}
