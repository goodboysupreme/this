"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Download,
  FileSearch,
  Lightbulb,
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
        "Couldn't run the JD match. The backend may be offline. Start it at http://localhost:8000 and try again."
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
      <div className="flex flex-col items-start gap-4">
        <span className="inline-flex h-12 w-12 items-center justify-center rounded-md border border-line bg-surface text-muted">
          <Target className="h-6 w-6" />
        </span>
        <h1 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">JD Match</h1>
        <p className="max-w-2xl text-muted">
          Paste a job description, upload your resume, and get a match score, tailored bullet
          rewrites, project ideas to close the gap, plus a downloadable ATS-friendly tailored
          resume.
        </p>
      </div>

      {/* Inputs */}
      <div className="mt-8">
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
              <span className="stat-num text-xs text-muted">
                {jdText.length.toLocaleString()} chars
              </span>
            </CardHeader>
            <CardContent>
              <textarea
                value={jdText}
                onChange={(e) => setJdText(e.target.value)}
                disabled={loading}
                placeholder="Paste the full job description here: responsibilities, requirements, preferred skills…"
                rows={10}
                className="w-full resize-y rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </CardContent>
          </Card>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Button
            size="lg"
            onClick={submit}
            disabled={!file || !jdText.trim() || loading}
          >
            {loading ? (
              "Matching…"
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
            className="ml-auto inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:underline"
          >
            <FileSearch className="h-4 w-4" /> Just screen my resume
          </Link>
        </div>
        {error && (
          <p className="mt-4 rounded-lg border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger">
            {error}
          </p>
        )}
      </div>

      {/* Results */}
      {result && (
        <div className="mt-10 flex flex-col gap-6">
          {/* Score + download */}
          <Card>
            <CardContent className="flex flex-col items-center gap-8 py-8 sm:flex-row sm:gap-12">
              <ScoreGauge score={result.match_score ?? 0} />
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="text-lg font-semibold tracking-tight text-ink">
                    JD match score
                  </h2>
                  <EngineBadge engine={result.engine ?? "fallback"} />
                </div>
                <p className="mt-3 text-sm text-muted">
                  <span className="stat-num">{result.matched_keywords?.length ?? 0}</span>{" "}
                  keywords matched ·{" "}
                  <span className="stat-num">{result.missing_keywords?.length ?? 0}</span>{" "}
                  missing
                </p>
                {result.download_id && (
                  <a
                    href={resumeExportUrl(result.download_id)}
                    className="mt-5 inline-flex"
                    download
                  >
                    <Button>
                      <Download className="h-4 w-4" /> Download ATS-friendly resume (.docx)
                    </Button>
                  </a>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Keywords */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="text-base text-success">Matched keywords</CardTitle>
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
                  <p className="text-sm text-muted">No keywords matched yet.</p>
                )}
              </CardContent>
            </Card>
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="text-base text-danger">Missing keywords</CardTitle>
              </CardHeader>
              <CardContent>
                {result.missing_keywords?.length ? (
                  <div className="flex flex-wrap gap-1.5">
                    {result.missing_keywords.map((k) => (
                      <Badge key={k} variant="danger">
                        {k}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted">Nothing missing, great coverage.</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Tailored bullets */}
          {result.tailored_bullets?.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-muted" />
                  <CardTitle className="text-base">Tailored bullet rewrites</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-line border-t border-line">
                  {result.tailored_bullets.map((b, i) => (
                    <div key={i} className="grid gap-3 px-6 py-4 md:grid-cols-2">
                      <div>
                        <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted">
                          Original
                        </p>
                        <p className="text-sm text-muted">{b.original}</p>
                      </div>
                      <div className="border-t border-line pt-3 md:border-l md:border-t-0 md:pl-4 md:pt-0">
                        <p className="mb-1.5 flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-success">
                          <ArrowRight className="h-3 w-3" /> Suggested
                        </p>
                        <p className="text-sm font-medium text-ink">{b.suggested}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Suggested projects */}
          {result.suggested_projects?.length > 0 && (
            <div>
              <h2 className="mb-4 text-lg font-semibold tracking-tight text-ink">
                Projects to close the gap
              </h2>
              <div className="overflow-hidden rounded-lg border border-line">
                <div className="divide-y divide-line">
                  {result.suggested_projects.map((p) => (
                    <div key={p.title} className="px-4 py-4 sm:px-6">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold text-ink">{p.title}</h3>
                        {p.stack?.length > 0 && (
                          <span className="flex flex-wrap gap-1.5">
                            {p.stack.map((tech) => (
                              <Badge key={tech} variant="secondary">
                                {tech}
                              </Badge>
                            ))}
                          </span>
                        )}
                      </div>
                      <div className="mt-3 flex items-start gap-2 text-sm text-muted">
                        <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-warn" />
                        {p.why}
                      </div>
                      {p.talking_points?.length > 0 && (
                        <div className="mt-3">
                          <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted">
                            <MessageSquareText className="h-3.5 w-3.5" /> Talking points
                          </p>
                          <ul className="flex list-disc flex-col gap-1.5 pl-5 text-sm text-muted">
                            {p.talking_points.map((tp, j) => (
                              <li key={j}>{tp}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
