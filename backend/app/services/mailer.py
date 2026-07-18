"""Cold-email engine: safe template rendering + SMTP sending with dry-run.

SMTP credentials are passed in per request and never persisted. When a
campaign is a dry run, smtplib is never touched — contacts are logged as
``dryrun`` instead of being emailed.
"""

from __future__ import annotations

import smtplib
import time
from email.message import EmailMessage

from sqlalchemy.orm import Session

from .. import models

DEFAULT_BATCH_SIZE = 20
DEFAULT_DELAY_SECONDS = 0.5
SMTP_TIMEOUT_SECONDS = 15


class _SafeDict(dict):
    """format_map mapping that leaves unknown placeholders untouched."""

    def __missing__(self, key: str) -> str:
        return "{" + key + "}"


def render_template(body: str, contact: dict) -> str:
    """Render {name}/{company}/{role} placeholders; safe on bad templates."""
    values = {k: ("" if v is None else str(v)) for k, v in contact.items()}
    try:
        return body.format_map(_SafeDict(values))
    except (ValueError, IndexError, KeyError):
        return body


def _build_message(template, contact: dict, sender: str) -> EmailMessage:
    message = EmailMessage()
    message["From"] = sender
    message["To"] = contact["email"]
    message["Subject"] = render_template(template.subject, contact)
    message.set_content(render_template(template.body, contact))
    return message


def _connect(smtp) -> smtplib.SMTP:
    if smtp.use_tls:
        server = smtplib.SMTP(smtp.host, smtp.port, timeout=SMTP_TIMEOUT_SECONDS)
        server.starttls()
    else:
        server = smtplib.SMTP_SSL(smtp.host, smtp.port, timeout=SMTP_TIMEOUT_SECONDS)
    server.login(smtp.username, smtp.password)
    return server


def run_campaign(
    db: Session,
    campaign: models.Campaign,
    template: models.EmailTemplate,
    contacts: list[models.Contact],
    smtp=None,
    batch_size: int = DEFAULT_BATCH_SIZE,
    delay_seconds: float = DEFAULT_DELAY_SECONDS,
) -> dict:
    """Run a campaign synchronously; write a CampaignLog row per contact.

    Returns counts: ``{"sent": n, "failed": n, "dryrun": n}``.
    """
    counts = {"sent": 0, "failed": 0, "dryrun": 0}
    campaign.status = "running"
    db.commit()

    def log(contact: models.Contact, status: str, detail: str) -> None:
        db.add(
            models.CampaignLog(
                campaign_id=campaign.id,
                contact_id=contact.id,
                status=status,
                detail=detail,
            )
        )
        counts[status] += 1

    if campaign.dry_run:
        for contact in contacts:
            log(contact, "dryrun", f"dry-run: would send to {contact.email}")
        campaign.status = "done"
        db.commit()
        return counts

    if smtp is None:
        for contact in contacts:
            log(contact, "failed", "no SMTP configuration provided")
        campaign.status = "failed"
        db.commit()
        return counts

    try:
        server = _connect(smtp)
    except Exception as exc:
        for contact in contacts:
            log(contact, "failed", f"smtp connection failed: {exc}")
        campaign.status = "failed"
        db.commit()
        return counts

    try:
        for index, contact in enumerate(contacts):
            contact_dict = {
                "name": contact.name,
                "role": contact.role,
                "company": contact.company,
                "email": contact.email,
            }
            try:
                server.send_message(_build_message(template, contact_dict, smtp.username))
                log(contact, "sent", "sent successfully")
            except Exception as exc:
                log(contact, "failed", f"send failed: {exc}")
            db.commit()
            # Throttle between batches to protect sender reputation.
            if (index + 1) % batch_size == 0 and index + 1 < len(contacts):
                time.sleep(delay_seconds)
    finally:
        try:
            server.quit()
        except Exception:
            pass

    campaign.status = "done" if counts["sent"] > 0 else "failed"
    db.commit()
    return counts
