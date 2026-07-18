"""Pydantic v2 response schemas for the PlaceIQ API."""

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


class HealthOut(BaseModel):
    status: str


class CompanyListItem(BaseModel):
    id: int
    name: str
    slug: str
    sector: str | None
    offer_count: int


class OfferOut(BaseModel):
    id: int
    company_id: int
    company_name: str
    company_slug: str
    type: str
    year: int
    role: str | None
    role_category: str | None
    branch: str | None
    cgpa_cutoff: float | None
    stipend_ctc: float | None
    slots: int | None


class ExperienceOut(BaseModel):
    id: int
    type: str
    year: int
    author_hint: str | None
    content: str


class CutoffPrediction(BaseModel):
    company: str
    type: str
    expected_cutoff: float | None
    band: list[float] | None
    sample_size: int
    basis: str
    disclaimer: str = (
        "Statistical estimate from historical data — not an official cutoff."
    )


class CompanyDetail(BaseModel):
    id: int
    name: str
    slug: str
    sector: str | None
    description: str | None
    offers: list[OfferOut]
    experiences: list[ExperienceOut]
    cutoff_predictions: list[CutoffPrediction]
    is_favorited: bool = False


class CompareItem(BaseModel):
    company: CompanyListItem
    latest_year: int | None
    offer_types: list[str]
    avg_cgpa_cutoff: float | None
    ctc_or_stipend_range: list[float] | None
    cutoff_predictions: list[CutoffPrediction]


class CompareResponse(BaseModel):
    companies: list[CompareItem]
    missing_slugs: list[str]


class TopRecruiter(BaseModel):
    name: str
    slug: str
    offer_count: int


class BranchStat(BaseModel):
    branch: str
    offer_count: int
    avg_cgpa_cutoff: float | None


class YearlyTrendPoint(BaseModel):
    year: int
    offer_count: int
    avg_cgpa_cutoff: float | None


class StatsSummary(BaseModel):
    companies_count: int
    offers_count: int
    offers_by_type: dict[str, int]
    avg_stipend_by_type: dict[str, float | None]
    top_recruiters: list[TopRecruiter]
    cg_cutoff_distribution: dict[str, int]
    branch_stats: list[BranchStat]
    yearly_trend: list[YearlyTrendPoint]


# --- Pillar B: resume screener ---


class ResumeSectionScore(BaseModel):
    name: str
    score: int
    issues: list[str]
    suggestions: list[str]


class AtsCheck(BaseModel):
    name: str
    passed: bool
    detail: str


class ResumeAnalysis(BaseModel):
    engine: str  # "deepseek" | "fallback"
    overall_score: int
    sections: list[ResumeSectionScore]
    skills_detected: list[str]
    ats_checks: list[AtsCheck]
    summary: str


class TailoredBullet(BaseModel):
    original: str
    suggested: str


class SuggestedProject(BaseModel):
    title: str
    stack: list[str]
    why: str
    talking_points: list[str]


class JdMatchResult(BaseModel):
    engine: str
    match_score: int
    matched_keywords: list[str]
    missing_keywords: list[str]
    tailored_bullets: list[TailoredBullet]
    suggested_projects: list[SuggestedProject]
    download_id: str


# --- Pillar C: cold emailing centre ---


class ContactOut(BaseModel):
    id: int
    name: str
    role: str | None
    company: str | None
    email: str
    created_at: datetime


class CsvImportResult(BaseModel):
    imported: int
    skipped: int


class TemplateIn(BaseModel):
    name: str
    subject: str
    body: str


class TemplateOut(TemplateIn):
    id: int
    created_at: datetime


class SmtpConfig(BaseModel):
    host: str
    port: int
    username: str
    password: str
    use_tls: bool = True


class CampaignIn(BaseModel):
    name: str
    template_id: int
    contact_ids: list[int]
    dry_run: bool = True
    smtp: SmtpConfig | None = None


class CampaignResult(BaseModel):
    campaign_id: int
    status: str
    sent: int
    failed: int
    dryrun: int


class CampaignListItem(BaseModel):
    id: int
    name: str
    template_id: int
    status: str
    dry_run: bool
    created_at: datetime
    sent: int
    failed: int
    dryrun: int


class CampaignLogOut(BaseModel):
    id: int
    campaign_id: int
    contact_id: int
    status: str
    detail: str | None
    sent_at: datetime


class CampaignDetail(BaseModel):
    id: int
    name: str
    template_id: int
    status: str
    dry_run: bool
    created_at: datetime
    logs: list[CampaignLogOut]


class PersonalizeIn(BaseModel):
    blurb: str
    template_body: str


class PersonalizeOut(BaseModel):
    engine: str
    body: str


# --- Pillar D: auth, favorites, experience bank, admin, analytics ---


class RegisterIn(BaseModel):
    email: str
    password: str
    name: str


class LoginIn(BaseModel):
    email: str
    password: str


class UserOut(BaseModel):
    id: int
    email: str
    name: str


class ProfileOut(BaseModel):
    id: int
    email: str
    name: str
    branch: str | None
    degree: str | None
    grad_year: int | None
    cgpa: float | None


class ProfilePatchIn(BaseModel):
    name: str | None = None
    branch: str | None = None
    degree: str | None = None
    grad_year: int | None = None
    cgpa: float | None = None


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"


class FavoriteToggleOut(BaseModel):
    favorited: bool


class ExperienceIn(BaseModel):
    company_slug: str
    type: Literal["placement", "ps1", "ps2", "si"]
    year: int
    author_hint: str
    content: str = Field(min_length=20, max_length=5000)


class OkOut(BaseModel):
    ok: bool = True


class ExperienceBankItem(BaseModel):
    id: int
    company_name: str
    company_slug: str
    type: str
    year: int
    author_hint: str | None
    content: str


class PageEventIn(BaseModel):
    path: str = Field(min_length=1, max_length=200)


class PageEventCount(BaseModel):
    path: str
    count: int


class AdminAnalyticsTotals(BaseModel):
    events: int
    users: int
    experiences_pending: int


class AdminAnalyticsOut(BaseModel):
    page_events: list[PageEventCount]
    totals: AdminAnalyticsTotals
