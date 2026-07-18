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
      setError("File is larger than 5 MB — please upload a smaller resume.");
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
          "flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors",
          dragging
            ? "border-indigo-400 bg-indigo-500/10"
            : "border-zinc-300 hover:border-indigo-400/60 hover:bg-indigo-500/5 dark:border-white/15 dark:hover:border-indigo-400/40",
          disabled && "pointer-events-none opacity-50"
        )}
      >
        <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/30">
          <UploadCloud className="h-6 w-6 text-white" />
        </span>
        {file ? (
          <div className="flex items-center gap-2 rounded-lg border border-indigo-500/20 bg-indigo-500/10 px-3 py-2">
            <FileText className="h-4 w-4 shrink-0 text-indigo-500 dark:text-indigo-300" />
            <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
              {file.name}
            </span>
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              {formatSize(file.size)}
            </span>
            <button
              type="button"
              aria-label="Remove file"
              onClick={(e) => {
                e.stopPropagation();
                onFileChange(null);
                if (inputRef.current) inputRef.current.value = "";
              }}
              className="ml-1 rounded p-0.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <>
            <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
              Drag &amp; drop your resume here, or{" "}
              <span className="text-indigo-500 dark:text-indigo-300">browse files</span>
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              PDF or DOCX — up to 5 MB
            </p>
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
      {error && <p className="mt-2 text-sm text-red-500 dark:text-red-400">{error}</p>}
    </div>
  );
}
