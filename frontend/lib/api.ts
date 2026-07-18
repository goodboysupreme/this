import type {
  AdminAnalytics,
  Campaign,
  CampaignCreateRequest,
  CampaignCreateResult,
  CampaignDetail,
  CompanyDetail,
  CompanySummary,
  ContactImportResult,
  CutoffResponse,
  DatasetKind,
  DatasetUploadResult,
  ExperienceCreate,
  ExperienceRow,
  FavoriteCompany,
  JDMatchResult,
  LoginResponse,
  OfferQuery,
  OfferRow,
  OfferType,
  OutreachContact,
  OutreachTemplate,
  ProfileUpdate,
  ResumeAnalysis,
  StatsSummary,
  User,
} from "./types";
import { authFetch } from "./auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

/**
 * Failure-tolerant fetch. Returns null on network error or non-2xx so the
 * UI can render a graceful "backend offline" empty state instead of crashing.
 */
async function safeFetch<T>(path: string, init?: RequestInit): Promise<T | null> {
  try {
    const res = await fetch(`${API_URL}${path}`, { cache: "no-store", ...init });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

function qs(params: Record<string, string | number | undefined>): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== "") sp.set(k, String(v));
  }
  const s = sp.toString();
  return s ? `?${s}` : "";
}

export async function getHealth(): Promise<boolean> {
  const res = await safeFetch<{ status: string }>("/api/health");
  return res?.status === "ok";
}

export async function getCompanies(search?: string, sector?: string) {
  return safeFetch<CompanySummary[]>(`/api/companies${qs({ search, sector })}`);
}

export async function getCompany(slug: string) {
  return safeFetch<CompanyDetail>(`/api/companies/${encodeURIComponent(slug)}`);
}

export async function getOffers(query: OfferQuery) {
  return safeFetch<OfferRow[]>(
    `/api/offers${qs({
      type: query.type,
      year: query.year,
      branch: query.branch,
      company_id: query.company_id,
      role_category: query.role_category,
      min_cg: query.min_cg,
      max_cg: query.max_cg,
      limit: query.limit ?? 500,
    })}`
  );
}

export async function getCutoff(slug: string, type: OfferType = "placement") {
  return safeFetch<CutoffResponse>(
    `/api/companies/${encodeURIComponent(slug)}/cutoff${qs({ type })}`
  );
}

export async function getStatsSummary() {
  return safeFetch<StatsSummary>("/api/stats/summary");
}

export async function compareCompanies(slugs: string[]) {
  return safeFetch<CompanyDetail[]>(`/api/compare${qs({ slugs: slugs.join(",") })}`);
}

export { API_URL };

/* ---------- Resume Screener ---------- */

/**
 * Multipart POST. Do NOT set Content-Type manually — the browser must
 * generate the multipart boundary for FormData bodies.
 */
async function safePostForm<T>(path: string, form: FormData): Promise<T | null> {
  try {
    const res = await fetch(`${API_URL}${path}`, {
      method: "POST",
      body: form,
      cache: "no-store",
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

async function safePostJSON<T>(path: string, body: unknown): Promise<T | null> {
  try {
    const res = await fetch(`${API_URL}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export async function analyzeResume(file: File) {
  const form = new FormData();
  form.append("file", file);
  return safePostForm<ResumeAnalysis>("/api/resume/analyze", form);
}

export async function matchJD(file: File, jdText: string) {
  const form = new FormData();
  form.append("file", file);
  form.append("jd_text", jdText);
  return safePostForm<JDMatchResult>("/api/resume/jd-match", form);
}

/** Direct URL for the .docx export — use as an <a href> download link. */
export function resumeExportUrl(downloadId: string) {
  return `${API_URL}/api/resume/export/${encodeURIComponent(downloadId)}`;
}

/* ---------- Cold Email Centre ---------- */

export async function importContactsCSV(file: File) {
  const form = new FormData();
  form.append("file", file);
  return safePostForm<ContactImportResult>("/api/outreach/contacts", form);
}

export async function getOutreachContacts() {
  return safeFetch<OutreachContact[]>("/api/outreach/contacts");
}

export async function deleteOutreachContact(id: number): Promise<boolean> {
  try {
    const res = await fetch(`${API_URL}/api/outreach/contacts/${id}`, {
      method: "DELETE",
      cache: "no-store",
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function getOutreachTemplates() {
  return safeFetch<OutreachTemplate[]>("/api/outreach/templates");
}

export async function createOutreachTemplate(payload: {
  name: string;
  subject: string;
  body: string;
}) {
  return safePostJSON<OutreachTemplate>("/api/outreach/templates", payload);
}

export async function createCampaign(payload: CampaignCreateRequest) {
  return safePostJSON<CampaignCreateResult>("/api/outreach/campaigns", payload);
}

export async function getCampaigns() {
  return safeFetch<Campaign[]>("/api/outreach/campaigns");
}

export async function getCampaign(id: number) {
  return safeFetch<CampaignDetail>(`/api/outreach/campaigns/${id}`);
}

/* ---------- Auth ---------- */

/** Result carrying the HTTP status so forms can distinguish 401/409/etc. */
export interface ApiResult<T> {
  /** 0 means network failure (backend unreachable). */
  status: number;
  data: T | null;
}

async function requestJSON<T>(path: string, init?: RequestInit): Promise<ApiResult<T>> {
  try {
    const res = await fetch(`${API_URL}${path}`, {
      cache: "no-store",
      ...init,
      headers: { "Content-Type": "application/json", ...init?.headers },
    });
    const data = res.ok ? ((await res.json()) as T) : null;
    return { status: res.status, data };
  } catch {
    return { status: 0, data: null };
  }
}

export async function registerUser(payload: { email: string; password: string; name: string }) {
  return requestJSON<User>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function loginUser(payload: { email: string; password: string }) {
  return requestJSON<LoginResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getMe(): Promise<User | null> {
  const res = await authFetch("/api/auth/me");
  if (!res || !res.ok) return null;
  try {
    return (await res.json()) as User;
  } catch {
    return null;
  }
}

export async function updateMe(patch: ProfileUpdate): Promise<User | null> {
  const res = await authFetch("/api/auth/me", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  if (!res || !res.ok) return null;
  try {
    return (await res.json()) as User;
  } catch {
    return null;
  }
}

/* ---------- Favorites ---------- */

export async function toggleFavorite(slug: string): Promise<boolean | null> {
  const res = await authFetch(`/api/companies/${encodeURIComponent(slug)}/favorite`, {
    method: "POST",
  });
  if (!res || !res.ok) return null;
  try {
    const body = (await res.json()) as { favorited: boolean };
    return body.favorited;
  } catch {
    return null;
  }
}

export async function getFavorites(): Promise<FavoriteCompany[] | null> {
  const res = await authFetch("/api/me/favorites");
  if (!res || !res.ok) return null;
  try {
    return (await res.json()) as FavoriteCompany[];
  } catch {
    return null;
  }
}

/* ---------- Experience Bank ---------- */

export async function getExperiences(filter?: {
  type?: OfferType;
  company_slug?: string;
  limit?: number;
}) {
  return safeFetch<ExperienceRow[]>(
    `/api/experiences${qs({
      type: filter?.type,
      company_slug: filter?.company_slug,
      limit: filter?.limit ?? 100,
    })}`
  );
}

export async function submitExperience(payload: ExperienceCreate) {
  return requestJSON<{ ok: boolean }>("/api/experiences", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/* ---------- Admin (X-Admin-Key) ---------- */

function adminHeaders(key: string, extra?: Record<string, string>): Record<string, string> {
  return { "X-Admin-Key": key, ...extra };
}

export async function adminGetPending(key: string) {
  return requestJSON<ExperienceRow[]>("/api/admin/experiences/pending", {
    headers: adminHeaders(key),
  });
}

export async function adminModerateExperience(key: string, id: number, action: "approve" | "reject") {
  return requestJSON<{ ok: boolean }>(`/api/admin/experiences/${id}/${action}`, {
    method: "POST",
    headers: adminHeaders(key),
  });
}

export async function adminUploadDataset(
  key: string,
  file: File,
  kind: DatasetKind
): Promise<ApiResult<DatasetUploadResult>> {
  const form = new FormData();
  form.append("file", file);
  form.append("kind", kind);
  try {
    const res = await fetch(`${API_URL}/api/admin/dataset/upload`, {
      method: "POST",
      headers: adminHeaders(key),
      body: form,
      cache: "no-store",
    });
    const data = res.ok ? ((await res.json()) as DatasetUploadResult) : null;
    return { status: res.status, data };
  } catch {
    return { status: 0, data: null };
  }
}

export async function adminGetAnalytics(key: string) {
  return requestJSON<AdminAnalytics>("/api/admin/analytics", {
    headers: adminHeaders(key),
  });
}

/* ---------- Analytics ---------- */

/** Fire-and-forget page-view ping. Never throws, never awaited by the UI. */
export async function postAnalyticsEvent(path: string): Promise<void> {
  try {
    await fetch(`${API_URL}/api/analytics/event`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path }),
      cache: "no-store",
    });
  } catch {
    /* analytics must never break the UI */
  }
}
