"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  CircleAlert,
  FileSearch,
  Lightbulb,
  RotateCcw,
  Target,
  XCircle,
} from "lucide-react";
import type { ResumeAnalysis } from "@/lib/types";
import { analyzeResume } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UploadZone } from "./upload-zone";
import { ScoreGauge, scoreColor } from "./score-gauge";
import { EngineBadge } from "./engine-badge";

export function ResumeScreener() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ResumeAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!file || loading) return;
    setLoading(true);
    setError(null);
    setResult(null);
    const res = await analyzeResume(file);
    setLoading(false);
    if (!res) {
      setError(
        "Couldn't analyze the resume. The backend may be offline. Start it at http://localhost:8000 and try again."
      );
      return;
    }
    setResult(res);
  }

  function reset() {
    setFile(null);
    setResult(null);
    setError(null);
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      {/* Header */}
      <div className="flex flex-col items-start gap-4">
        <span className="inline-flex h-12 w-12 items-center justify-center rounded-md border border-line bg-surface text-muted">
          <FileSearch className="h-6 w-6" />
        </span>
        <h1 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
          AI Resume Screener
        </h1>
        <p className="max-w-2xl text-muted">
          Upload your resume for an ATS-style review: overall score, section-wise issues,
          suggestions and parser checks. Falls back to an offline engine when the AI is
          unavailable.
        </p>
      </div>

      {/* Upload */}
      <div className="mt-8">
        <Card>
          <CardContent className="flex flex-col gap-4 pt-6">
            <UploadZone file={file} onFileChange={setFile} disabled={loading} />
            <div className="flex flex-wrap items-center gap-3">
              <Button size="lg" onClick={submit} disabled={!file || loading}>
                {loading ? (
                  "Analyzing…"
                ) : (
                  <>
                    <FileSearch className="h-4 w-4" /> Analyze resume
                  </>
                )}
              </Button>
              {(result || error) && (
                <Button variant="outline" onClick={reset} disabled={loading}>
                  <RotateCcw className="h-4 w-4" /> Start over
                </Button>
              )}
              <Link
                href="/resume/jd-match"
                className="ml-auto inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:underline"
              >
                Match against a job description <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            {error && (
              <p className="rounded-lg border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger">
                {error}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Results */}
      {result && (
        <div className="mt-10 flex flex-col gap-6">
          {/* Score + summary */}
          <Card>
            <CardContent className="flex flex-col items-center gap-8 py-8 sm:flex-row sm:items-center sm:gap-12">
              <ScoreGauge score={result.overall_score ?? 0} />
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="text-lg font-semibold tracking-tight text-ink">
                    Overall ATS score
                  </h2>
                  <EngineBadge engine={result.engine ?? "fallback"} />
                </div>
                <p className="mt-4 text-sm leading-relaxed text-muted">{result.summary}</p>
                {result.skills_detected?.length > 0 && (
                  <div className="mt-5">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">
                      Skills detected
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {result.skills_detected.map((s) => (
                        <Badge key={s} variant="accent">
                          {s}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Sections */}
          {result.sections?.length > 0 && (
            <div className="overflow-hidden rounded-lg border border-line">
              <div className="divide-y divide-line">
                {result.sections.map((sec) => (
                  <div key={sec.name} className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="font-semibold text-ink">{sec.name}</h3>
                      <span
                        className="stat-num text-lg font-semibold"
                        style={{ color: scoreColor(sec.score ?? 0) }}
                      >
                        {sec.score}
                      </span>
                    </div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-md bg-line/60">
                      <div
                        className="h-full rounded-md transition-all duration-200"
                        style={{
                          width: `${Math.max(0, Math.min(100, sec.score ?? 0))}%`,
                          backgroundColor: scoreColor(sec.score ?? 0),
                        }}
                      />
                    </div>
                    <div className="mt-3 flex flex-col gap-3">
                      {sec.issues?.length > 0 && (
                        <ul className="flex flex-col gap-1.5">
                          {sec.issues.map((issue, j) => (
                            <li
                              key={j}
                              className="flex items-start gap-2 text-sm text-danger"
                            >
                              <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
                              {issue}
                            </li>
                          ))}
                        </ul>
                      )}
                      {sec.suggestions?.length > 0 && (
                        <ul className="flex flex-col gap-1.5">
                          {sec.suggestions.map((tip, j) => (
                            <li
                              key={j}
                              className="flex items-start gap-2 text-sm text-success"
                            >
                              <Lightbulb className="mt-0.5 h-4 w-4 shrink-0" />
                              {tip}
                            </li>
                          ))}
                        </ul>
                      )}
                      {!sec.issues?.length && !sec.suggestions?.length && (
                        <p className="flex items-center gap-2 text-sm text-success">
                          <CheckCircle2 className="h-4 w-4" /> No issues found in this section.
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ATS checks */}
          {result.ats_checks?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">ATS parser checks</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ul className="divide-y divide-line border-t border-line">
                  {result.ats_checks.map((check) => (
                    <li key={check.name} className="flex items-start gap-3 px-6 py-3">
                      {check.passed ? (
                        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-success" />
                      ) : (
                        <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-danger" />
                      )}
                      <div>
                        <p className="text-sm font-medium text-ink">{check.name}</p>
                        {check.detail && (
                          <p className="mt-0.5 text-xs text-muted">{check.detail}</p>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* JD match CTA */}
          <Card>
            <CardContent className="flex flex-col items-start justify-between gap-4 py-6 sm:flex-row sm:items-center">
              <div className="flex items-start gap-3">
                <Target className="mt-0.5 h-6 w-6 text-muted" />
                <div>
                  <p className="font-semibold text-ink">Applying to a specific role?</p>
                  <p className="mt-1 text-sm text-muted">
                    Run a JD match to get a match score, tailored bullets, missing keywords and
                    an ATS-friendly tailored resume download.
                  </p>
                </div>
              </div>
              <Link href="/resume/jd-match">
                <Button>
                  JD Match <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
