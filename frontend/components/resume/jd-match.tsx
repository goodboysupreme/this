"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Download,
  FileSearch,
  Lightbulb,
  Loader2,
  MessageSquareText,
  RotateCcw,
  Sparkles,
  Target,
} from "lucide-react";
import type { JDMatchResult } from "@/lib/types";
import { matchJD, resumeExportUrl } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FadeIn } from "@/components/FadeIn";
import { UploadZone } from "./upload-zone";
import { ScoreGauge } from "./score-gauge";
import { EngineBadge } from "./engine-badge";

export function JDMatch() {
  const [file, setFile] = useState<File | null>(null);
  const [jdText, setJdText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<JDMatchResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!file || !jdText.trim() || loading) return;
    setLoading(true);
    setError(null);
    setResult(null);
    const res = await matchJD(file, jdText.trim());
    setLoading(false);
    if (!res) {
      setError(
        "Couldn't run the JD match — the backend may be offline. Start it at http://localhost:8000 and try again."
      );
      return;
    }
    setResult(res);
  }

  function reset() {
    setFile(null);
    setJdText("");
    setResult(null);
    setError(null);
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      {/* Header */}
      <FadeIn>
        <div className="flex flex-col items-start gap-4">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-fuchsia-500 to-pink-600 shadow-lg shadow-fuchsia-500/30">
            <Target className="h-6 w-6 text-white" />
          </span>
          <h1 className="font-display text-3xl font-bold tracking-tight text-zinc-900 dark:text-white sm:text-4xl">
            JD Match
          </h1>
          <p className="max-w-2xl text-zinc-500 dark:text-zinc-400">
            Paste a job description, upload your resume, and get a match score, tailored bullet
            rewrites, project ideas to close the gap — plus a downloadable ATS-friendly tailored
            resume.
          </p>
        </div>
      </FadeIn>

      {/* Inputs */}
      <FadeIn delay={0.1} className="mt-8">
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">1 · Your resume</CardTitle>
            </CardHeader>
            <CardContent>
              <UploadZone file={file} onFileChange={setFile} disabled={loading} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base">2 · Job description</CardTitle>
              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                {jdText.length.toLocaleString()} chars
              </span>
            </CardHeader>
            <CardContent>
              <textarea
                value={jdText}
                onChange={(e) => setJdText(e.target.value)}
                disabled={loading}
                placeholder="Paste the full job description here — responsibilities, requirements, preferred skills…"
                rows={10}
                className="w-full resize-y rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 disabled:opacity-50 dark:border-white/10 dark:bg-white/5 dark:text-zinc-100 dark:placeholder:text-zinc-500"
              />
            </CardContent>
          </Card>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Button
            variant="glow"
            size="lg"
            onClick={submit}
            disabled={!file || !jdText.trim() || loading}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Matching…
              </>
            ) : (
              <>
                <Target className="h-4 w-4" /> Run JD match
              </>
            )}
          </Button>
          {(result || error) && (
            <Button variant="outline" onClick={reset} disabled={loading}>
              <RotateCcw className="h-4 w-4" /> Start over
            </Button>
          )}
          <Link
            href="/resume"
            className="ml-auto inline-flex items-center gap-1.5 text-sm font-medium text-indigo-500 hover:underline dark:text-indigo-300"
          >
            <FileSearch className="h-4 w-4" /> Just screen my resume
          </Link>
        </div>
        {error && (
          <p className="mt-4 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-300">
            {error}
          </p>
        )}
      </FadeIn>

      {/* Results */}
      {result && (
        <div className="mt-10 flex flex-col gap-6">
          {/* Score + download */}
          <FadeIn>
            <Card className="relative overflow-hidden">
              <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-fuchsia-400/60 to-transparent" />
              <CardContent className="flex flex-col items-center gap-8 py-8 sm:flex-row sm:gap-12">
                <ScoreGauge score={result.match_score ?? 0} />
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="font-display text-xl font-semibold text-zinc-900 dark:text-white">
                      JD match score
                    </h2>
                    <EngineBadge engine={result.engine ?? "fallback"} />
                  </div>
                  <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">
                    {result.matched_keywords?.length ?? 0} keywords matched ·{" "}
                    {result.missing_keywords?.length ?? 0} missing
                  </p>
                  {result.download_id && (
                    <a
                      href={resumeExportUrl(result.download_id)}
                      className="mt-5 inline-flex"
                      download
                    >
                      <Button variant="glow">
                        <Download className="h-4 w-4" /> Download ATS-friendly resume (.docx)
                      </Button>
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>
          </FadeIn>

          {/* Keywords */}
          <div className="grid gap-4 md:grid-cols-2">
            <FadeIn>
              <Card className="h-full">
                <CardHeader>
                  <CardTitle className="text-base text-emerald-600 dark:text-emerald-300">
                    Matched keywords
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {result.matched_keywords?.length ? (
                    <div className="flex flex-wrap gap-1.5">
                      {result.matched_keywords.map((k) => (
                        <Badge key={k} variant="success">
                          {k}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                      No keywords matched yet.
                    </p>
                  )}
                </CardContent>
              </Card>
            </FadeIn>
            <FadeIn delay={0.05}>
              <Card className="h-full">
                <CardHeader>
                  <CardTitle className="text-base text-red-600 dark:text-red-300">
                    Missing keywords
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {result.missing_keywords?.length ? (
                    <div className="flex flex-wrap gap-1.5">
                      {result.missing_keywords.map((k) => (
                        <Badge
                          key={k}
                          className="border border-red-500/20 bg-red-500/10 text-red-600 dark:text-red-300"
                        >
                          {k}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                      Nothing missing — great coverage.
                    </p>
                  )}
                </CardContent>
              </Card>
            </FadeIn>
          </div>

          {/* Tailored bullets */}
          {result.tailored_bullets?.length > 0 && (
            <FadeIn>
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-indigo-500 dark:text-indigo-300" />
                    <CardTitle className="text-base">Tailored bullet rewrites</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  {result.tailored_bullets.map((b, i) => (
                    <div
                      key={i}
                      className="grid gap-3 rounded-lg border border-zinc-200 p-4 dark:border-white/10 md:grid-cols-2"
                    >
                      <div>
                        <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                          Original
                        </p>
                        <p className="text-sm text-zinc-600 dark:text-zinc-400">{b.original}</p>
                      </div>
                      <div className="border-t border-zinc-200 pt-3 dark:border-white/10 md:border-l md:border-t-0 md:pl-4 md:pt-0">
                        <p className="mb-1.5 flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-300">
                          <ArrowRight className="h-3 w-3" /> Suggested
                        </p>
                        <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                          {b.suggested}
                        </p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </FadeIn>
          )}

          {/* Suggested projects */}
          {result.suggested_projects?.length > 0 && (
            <div>
              <FadeIn>
                <h2 className="mb-4 font-display text-xl font-semibold text-zinc-900 dark:text-white">
                  Projects to close the gap
                </h2>
              </FadeIn>
              <div className="grid gap-4 md:grid-cols-2">
                {result.suggested_projects.map((p, i) => (
                  <FadeIn key={p.title} delay={i * 0.06}>
                    <Card className="h-full">
                      <CardHeader>
                        <CardTitle className="text-base">{p.title}</CardTitle>
                        {p.stack?.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {p.stack.map((tech) => (
                              <Badge key={tech} variant="violet">
                                {tech}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </CardHeader>
                      <CardContent className="flex flex-col gap-4">
                        <div className="flex items-start gap-2 text-sm text-zinc-600 dark:text-zinc-300">
                          <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                          {p.why}
                        </div>
                        {p.talking_points?.length > 0 && (
                          <div>
                            <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                              <MessageSquareText className="h-3.5 w-3.5" /> Talking points
                            </p>
                            <ul className="flex list-disc flex-col gap-1.5 pl-5 text-sm text-zinc-600 dark:text-zinc-300">
                              {p.talking_points.map((tp, j) => (
                                <li key={j}>{tp}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </FadeIn>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
