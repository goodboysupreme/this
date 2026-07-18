"""Cold emailing centre endpoints (Pillar C).

Contacts, templates, and campaigns. Sending always defaults to dry-run;
real sends use per-request SMTP credentials that are never stored.
"""

from __future__ import annotations

import csv
import io
import re

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..config import settings
from ..db import get_db
from ..models import Campaign, CampaignLog, Contact, EmailTemplate
from ..schemas import (
    CampaignDetail,
    CampaignIn,
    CampaignListItem,
    CampaignLogOut,
    CampaignResult,
    ContactOut,
    CsvImportResult,
    PersonalizeIn,
    PersonalizeOut,
    TemplateIn,
    TemplateOut,
)
from ..services import deepseek_client, mailer

router = APIRouter(prefix="/outreach", tags=["outreach"])

EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")

DEFAULT_TEMPLATES: tuple[dict, ...] = (
    {
        "name": "Referral ask",
        "subject": "Referral request — BITS Pilani student interested in {company}",
        "body": (
            "Hi {name},\n\n"
            "I'm a BITS Pilani student very interested in the {role} opening at {company}. "
            "Would you be open to referring me? I've attached my resume and would be happy "
            "to share anything else that helps.\n\n"
            "Thanks for your time,\nVansh"
        ),
    },
    {
        "name": "HR outreach",
        "subject": "Application interest — {role} at {company}",
        "body": (
            "Dear {name},\n\n"
            "I'm reaching out regarding the {role} position at {company}. I believe my "
            "background is a strong fit and would appreciate the chance to interview. "
            "My resume is attached.\n\n"
            "Best regards,\nVansh"
        ),
    },
    {
        "name": "Alumni connect",
        "subject": "BITSian reaching out — advice on {company}",
        "body": (
            "Hi {name},\n\n"
            "Fellow BITSian here! I saw you're a {role} at {company} and would love to "
            "hear about your journey and any advice for someone applying. Would you be "
            "open to a quick 15-minute chat?\n\n"
            "Regards,\nVansh"
        ),
    },
)


def seed_default_templates(db: Session) -> None:
    """Insert the built-in template library if the table is empty."""
    if db.scalar(select(EmailTemplate.id).limit(1)) is not None:
        return
    db.add_all(EmailTemplate(**t) for t in DEFAULT_TEMPLATES)
    db.commit()


def _contact_out(contact: Contact) -> ContactOut:
    return ContactOut(
        id=contact.id,
        name=contact.name,
        role=contact.role,
        company=contact.company,
        email=contact.email,
        created_at=contact.created_at,
    )


def _template_out(template: EmailTemplate) -> TemplateOut:
    return TemplateOut(
        id=template.id,
        name=template.name,
        subject=template.subject,
        body=template.body,
        created_at=template.created_at,
    )


def _status_counts(db: Session, campaign_id: int) -> dict:
    counts = {"sent": 0, "failed": 0, "dryrun": 0}
    for status in db.scalars(
        select(CampaignLog.status).where(CampaignLog.campaign_id == campaign_id)
    ):
        if status in counts:
            counts[status] += 1
    return counts


# --- contacts ---------------------------------------------------------------


@router.post("/contacts", response_model=CsvImportResult)
def import_contacts(file: UploadFile = File(...), db: Session = Depends(get_db)) -> dict:
    raw = file.file.read().decode("utf-8-sig", errors="replace")
    reader = csv.DictReader(io.StringIO(raw))
    if not reader.fieldnames or "email" not in {f.strip().lower() for f in reader.fieldnames}:
        raise HTTPException(status_code=400, detail="CSV must have columns: name,role,company,email")

    existing = set(db.scalars(select(Contact.email)))
    seen: set[str] = set()
    imported = skipped = 0
    for row in reader:
        normalized = {(k or "").strip().lower(): (v or "").strip() for k, v in row.items()}
        name = normalized.get("name", "")
        email = normalized.get("email", "").lower()
        if not name or not EMAIL_RE.match(email) or email in existing or email in seen:
            skipped += 1
            continue
        db.add(
            Contact(
                name=name,
                role=normalized.get("role") or None,
                company=normalized.get("company") or None,
                email=email,
            )
        )
        seen.add(email)
        imported += 1
    db.commit()
    return {"imported": imported, "skipped": skipped}


@router.get("/contacts", response_model=list[ContactOut])
def list_contacts(db: Session = Depends(get_db)) -> list[ContactOut]:
    return [_contact_out(c) for c in db.scalars(select(Contact).order_by(Contact.id))]


@router.delete("/contacts/{contact_id}")
def delete_contact(contact_id: int, db: Session = Depends(get_db)) -> dict:
    contact = db.get(Contact, contact_id)
    if contact is None:
        raise HTTPException(status_code=404, detail="contact not found")
    db.delete(contact)
    db.commit()
    return {"deleted": contact_id}


# --- templates --------------------------------------------------------------


@router.get("/templates", response_model=list[TemplateOut])
def list_templates(db: Session = Depends(get_db)) -> list[TemplateOut]:
    seed_default_templates(db)
    return [_template_out(t) for t in db.scalars(select(EmailTemplate).order_by(EmailTemplate.id))]


@router.post("/templates", response_model=TemplateOut, status_code=201)
def create_template(payload: TemplateIn, db: Session = Depends(get_db)) -> TemplateOut:
    template = EmailTemplate(name=payload.name, subject=payload.subject, body=payload.body)
    db.add(template)
    db.commit()
    db.refresh(template)
    return _template_out(template)


# --- campaigns --------------------------------------------------------------


@router.post("/campaigns", response_model=CampaignResult)
def create_campaign(payload: CampaignIn, db: Session = Depends(get_db)) -> dict:
    template = db.get(EmailTemplate, payload.template_id)
    if template is None:
        raise HTTPException(status_code=404, detail="template not found")
    contacts = []
    if payload.contact_ids:
        contacts = list(
            db.scalars(select(Contact).where(Contact.id.in_(payload.contact_ids)).order_by(Contact.id))
        )
    if not contacts:
        raise HTTPException(status_code=400, detail="no valid contacts selected")

    campaign = Campaign(
        name=payload.name,
        template_id=template.id,
        status="pending",
        dry_run=payload.dry_run,
    )
    db.add(campaign)
    db.commit()
    db.refresh(campaign)

    counts = mailer.run_campaign(
        db, campaign, template, contacts, smtp=payload.smtp if not payload.dry_run else None
    )
    return {
        "campaign_id": campaign.id,
        "status": campaign.status,
        **counts,
    }


@router.get("/campaigns", response_model=list[CampaignListItem])
def list_campaigns(db: Session = Depends(get_db)) -> list[CampaignListItem]:
    items = []
    for campaign in db.scalars(select(Campaign).order_by(Campaign.id)):
        counts = _status_counts(db, campaign.id)
        items.append(
            CampaignListItem(
                id=campaign.id,
                name=campaign.name,
                template_id=campaign.template_id,
                status=campaign.status,
                dry_run=campaign.dry_run,
                created_at=campaign.created_at,
                **counts,
            )
        )
    return items


@router.get("/campaigns/{campaign_id}", response_model=CampaignDetail)
def campaign_detail(campaign_id: int, db: Session = Depends(get_db)) -> CampaignDetail:
    campaign = db.get(Campaign, campaign_id)
    if campaign is None:
        raise HTTPException(status_code=404, detail="campaign not found")
    logs = db.scalars(
        select(CampaignLog).where(CampaignLog.campaign_id == campaign.id).order_by(CampaignLog.id)
    )
    return CampaignDetail(
        id=campaign.id,
        name=campaign.name,
        template_id=campaign.template_id,
        status=campaign.status,
        dry_run=campaign.dry_run,
        created_at=campaign.created_at,
        logs=[
            CampaignLogOut(
                id=log.id,
                campaign_id=log.campaign_id,
                contact_id=log.contact_id,
                status=log.status,
                detail=log.detail,
                sent_at=log.sent_at,
            )
            for log in logs
        ],
    )


# --- optional AI personalization --------------------------------------------


@router.post("/personalize", response_model=PersonalizeOut)
def personalize(payload: PersonalizeIn) -> PersonalizeOut:
    if settings.deepseek_api_key:
        try:
            result = deepseek_client.personalize_opening(payload.blurb, payload.template_body)
            body = result.get("body") if isinstance(result, dict) else None
            if body:
                return PersonalizeOut(engine="deepseek", body=str(body))
        except Exception:
            pass
    return PersonalizeOut(engine="fallback", body=payload.template_body)
