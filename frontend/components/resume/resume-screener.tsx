"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  CircleAlert,
  FileSearch,
  Lightbulb,
  Loader2,
  RotateCcw,
  Target,
  XCircle,
} from "lucide-react";
import type { ResumeAnalysis } from "@/lib/types";
import { analyzeResume } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FadeIn } from "@/components/FadeIn";
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
        "Couldn't analyze the resume — the backend may be offline. Start it at http://localhost:8000 and try again."
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
      <FadeIn>
        <div className="flex flex-col items-start gap-4">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/30">
            <FileSearch className="h-6 w-6 text-white" />
          </span>
          <h1 className="font-display text-3xl font-bold tracking-tight text-zinc-900 dark:text-white sm:text-4xl">
            AI Resume Screener
          </h1>
          <p className="max-w-2xl text-zinc-500 dark:text-zinc-400">
            Upload your resume for an ATS-style review — overall score, section-wise issues,
            suggestions and parser checks. Falls back to an offline engine when the AI is
            unavailable.
          </p>
        </div>
      </FadeIn>

      {/* Upload */}
      <FadeIn delay={0.1} className="mt-8">
        <Card>
          <CardContent className="flex flex-col gap-4 pt-6">
            <UploadZone file={file} onFileChange={setFile} disabled={loading} />
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="glow" size="lg" onClick={submit} disabled={!file || loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Analyzing…
                  </>
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
                className="ml-auto inline-flex items-center gap-1.5 text-sm font-medium text-indigo-500 hover:underline dark:text-indigo-300"
              >
                Match against a job description <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            {error && (
              <p className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-300">
                {error}
              </p>
            )}
          </CardContent>
        </Card>
      </FadeIn>

      {/* Results */}
      {result && (
        <div className="mt-10 flex flex-col gap-6">
          {/* Score + summary */}
          <FadeIn>
            <Card className="relative overflow-hidden">
              <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-400/60 to-transparent" />
              <CardContent className="flex flex-col items-center gap-8 py-8 sm:flex-row sm:items-center sm:gap-12">
                <ScoreGauge score={result.overall_score ?? 0} />
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="font-display text-xl font-semibold text-zinc-900 dark:text-white">
                      Overall ATS score
                    </h2>
                    <EngineBadge engine={result.engine ?? "fallback"} />
                  </div>
                  <p className="mt-4 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
                    {result.summary}
                  </p>
                  {result.skills_detected?.length > 0 && (
                    <div className="mt-5">
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                        Skills detected
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {result.skills_detected.map((s) => (
                          <Badge key={s} variant="indigo">
                            {s}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </FadeIn>

          {/* Sections */}
          {result.sections?.length > 0 && (
            <div className="grid gap-4 md:grid-cols-2">
              {result.sections.map((sec, i) => (
                <FadeIn key={sec.name} delay={i * 0.06}>
                  <Card className="h-full">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between gap-3">
                        <CardTitle className="text-base">{sec.name}</CardTitle>
                        <span
                          className="font-display text-lg font-bold"
                          style={{ color: scoreColor(sec.score ?? 0) }}
                        >
                          {sec.score}
                        </span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-zinc-200 dark:bg-white/10">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{
                            width: `${Math.max(0, Math.min(100, sec.score ?? 0))}%`,
                            backgroundColor: scoreColor(sec.score ?? 0),
                          }}
                        />
                      </div>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-3">
                      {sec.issues?.length > 0 && (
                        <ul className="flex flex-col gap-1.5">
                          {sec.issues.map((issue, j) => (
                            <li
                              key={j}
                              className="flex items-start gap-2 text-sm text-red-600 dark:text-red-300"
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
                              className="flex items-start gap-2 text-sm text-emerald-600 dark:text-emerald-300"
                            >
                              <Lightbulb className="mt-0.5 h-4 w-4 shrink-0" />
                              {tip}
                            </li>
                          ))}
                        </ul>
                      )}
                      {!sec.issues?.length && !sec.suggestions?.length && (
                        <p className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-300">
                          <CheckCircle2 className="h-4 w-4" /> No issues found in this section.
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </FadeIn>
              ))}
            </div>
          )}

          {/* ATS checks */}
          {result.ats_checks?.length > 0 && (
            <FadeIn>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">ATS parser checks</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="grid gap-3 sm:grid-cols-2">
                    {result.ats_checks.map((check) => (
                      <li
                        key={check.name}
                        className="flex items-start gap-3 rounded-lg border border-zinc-200 px-4 py-3 dark:border-white/10"
                      >
                        {check.passed ? (
                          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />
                        ) : (
                          <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
                        )}
                        <div>
                          <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                            {check.name}
                          </p>
                          {check.detail && (
                            <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                              {check.detail}
                            </p>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </FadeIn>
          )}

          {/* JD match CTA */}
          <FadeIn>
            <Card className="border-indigo-500/30 bg-gradient-to-r from-indigo-500/10 to-violet-500/10">
              <CardContent className="flex flex-col items-start justify-between gap-4 py-6 sm:flex-row sm:items-center">
                <div className="flex items-start gap-3">
                  <Target className="mt-0.5 h-6 w-6 text-indigo-500 dark:text-indigo-300" />
                  <div>
                    <p className="font-semibold text-zinc-900 dark:text-white">
                      Applying to a specific role?
                    </p>
                    <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                      Run a JD match to get a match score, tailored bullets, missing keywords and
                      an ATS-friendly tailored resume download.
                    </p>
                  </div>
                </div>
                <Link href="/resume/jd-match">
                  <Button variant="glow">
                    JD Match <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </FadeIn>
        </div>
      )}
    </div>
  );
}
