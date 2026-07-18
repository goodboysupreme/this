export type OfferType = "placement" | "ps1" | "ps2" | "si";

export interface CompanySummary {
  id: number;
  name: string;
  slug: string;
  sector: string;
  offer_count: number;
}

export interface Offer {
  id: number;
  type: OfferType;
  year: number;
  role: string;
  role_category: string;
  branch: string;
  cgpa_cutoff: number | null;
  stipend_ctc: number | null;
  slots: number | null;
}

export interface OfferRow extends Offer {
  company_name: string;
  company_slug: string;
}

export interface Experience {
  id: number;
  type: OfferType;
  year: number;
  author_hint: string;
  content: string;
}

export interface CutoffPrediction {
  type: OfferType;
  expected_cutoff: number;
  band: [number, number];
  sample_size: number;
  basis: string;
}

export interface CompanyDetail {
  id: number;
  name: string;
  slug: string;
  sector: string;
  description: string;
  offers: Offer[];
  experiences: Experience[];
  cutoff_predictions: CutoffPrediction[];
  /** Present only when fetched with an authenticated user. */
  is_favorited?: boolean;
}

export interface CutoffResponse {
  company: string;
  type: string;
  expected_cutoff: number;
  band: [number, number];
  sample_size: number;
  basis: string;
}

export interface StatsSummary {
  companies_count: number;
  offers_count: number;
  offers_by_type: Record<string, number>;
  avg_stipend_by_type: Record<string, number>;
  top_recruiters: { name: string; count: number }[];
  cg_cutoff_distribution: unknown[];
  branch_stats: unknown[];
  yearly_trend: unknown[];
}

export interface OfferQuery {
  type?: OfferType;
  year?: number;
  branch?: string;
  company_id?: number;
  role_category?: string;
  min_cg?: number;
  max_cg?: number;
  limit?: number;
}

/* ---------- Resume Screener ---------- */

export interface ResumeSection {
  name: string;
  score: number;
  issues: string[];
  suggestions: string[];
}

export interface ATSCheck {
  name: string;
  passed: boolean;
  detail: string;
}

export interface ResumeAnalysis {
  engine: string;
  overall_score: number;
  sections: ResumeSection[];
  skills_detected: string[];
  ats_checks: ATSCheck[];
  summary: string;
}

export interface TailoredBullet {
  original: string;
  suggested: string;
}

export interface SuggestedProject {
  title: string;
  stack: string[];
  why: string;
  talking_points: string[];
}

export interface JDMatchResult {
  engine: string;
  match_score: number;
  matched_keywords: string[];
  missing_keywords: string[];
  tailored_bullets: TailoredBullet[];
  suggested_projects: SuggestedProject[];
  download_id: string;
}

/* ---------- Cold Email Centre ---------- */

export interface OutreachContact {
  id: number;
  name: string;
  role: string;
  company: string;
  email: string;
  created_at: string;
}

export interface ContactImportResult {
  imported: number;
  skipped: number;
}

export interface OutreachTemplate {
  id: number;
  name: string;
  subject: string;
  body: string;
  created_at: string;
}

export interface SMTPConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  use_tls: boolean;
}

export interface CampaignCreateRequest {
  name: string;
  template_id: number;
  contact_ids: number[];
  dry_run: boolean;
  smtp?: SMTPConfig;
}

export interface CampaignCreateResult {
  campaign_id: number;
  status: string;
  sent: number;
  failed: number;
  dryrun: number;
}

export interface Campaign {
  id: number;
  name: string;
  status: string;
  dry_run: boolean;
  created_at: string;
  sent?: number;
  failed?: number;
  dryrun?: number;
}

export interface CampaignLog {
  id: number;
  contact_id: number;
  status: string; // "sent" | "failed" | "dryrun"
  detail: string;
  sent_at: string;
}

export interface CampaignDetail extends Campaign {
  logs?: CampaignLog[];
}

/* ---------- Auth & Profiles ---------- */

export interface User {
  id: number;
  email: string;
  name: string;
  branch?: string | null;
  degree?: string | null;
  grad_year?: number | null;
  cgpa?: number | null;
}

export interface ProfileUpdate {
  name?: string;
  branch?: string;
  degree?: string;
  grad_year?: number;
  cgpa?: number;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
}

export interface FavoriteCompany {
  id: number;
  name: string;
  slug: string;
  sector: string;
  offer_count: number;
}

/* ---------- Experience Bank ---------- */

export interface ExperienceCreate {
  company_slug: string;
  type: OfferType;
  year: number;
  author_hint: string;
  content: string;
}

export interface ExperienceRow {
  id: number;
  company_name: string;
  company_slug: string;
  type: OfferType;
  year: number;
  author_hint: string;
  content: string;
}

/* ---------- Admin ---------- */

export interface AdminAnalytics {
  page_events: { path: string; count: number }[];
  totals: {
    events: number;
    users: number;
    experiences_pending: number;
  };
}

export interface DatasetUploadResult {
  imported: number;
  skipped: number;
}

export type DatasetKind = OfferType | "companies";
