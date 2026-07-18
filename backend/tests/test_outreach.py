"""API tests for the cold emailing centre (Pillar C)."""

import smtplib

import pytest

from app.services import mailer

CSV_OK = (
    "name,role,company,email\n"
    "Alice Rao,SDE,Acme,alice.outreach1@example.com\n"
    "Bob Singh,Analyst,Globex,bob.outreach1@example.com\n"
    "Alice Dupe,SDE,Acme,alice.outreach1@example.com\n"
    "Bad Row,Intern,Nope,not-an-email\n"
)


class _NoSmtp:
    def __init__(self, *args, **kwargs):
        raise AssertionError("smtplib must not be touched during a dry run")


@pytest.fixture()
def _forbid_smtp(monkeypatch):
    monkeypatch.setattr(smtplib, "SMTP", _NoSmtp)
    monkeypatch.setattr(smtplib, "SMTP_SSL", _NoSmtp)


def test_csv_import_skips_dupes_and_invalid(client):
    response = client.post(
        "/api/outreach/contacts",
        files={"file": ("contacts.csv", CSV_OK.encode(), "text/csv")},
    )
    assert response.status_code == 200
    assert response.json() == {"imported": 2, "skipped": 2}

    # Re-uploading the same file skips everything (DB-level dedupe).
    again = client.post(
        "/api/outreach/contacts",
        files={"file": ("contacts.csv", CSV_OK.encode(), "text/csv")},
    )
    assert again.json() == {"imported": 0, "skipped": 4}

    contacts = client.get("/api/outreach/contacts").json()
    emails = {c["email"] for c in contacts}
    assert "alice.outreach1@example.com" in emails
    assert "bob.outreach1@example.com" in emails


def test_contact_delete(client):
    client.post(
        "/api/outreach/contacts",
        files={"file": ("c.csv", b"name,role,company,email\nDel Me,X,Y,del.me@example.com\n", "text/csv")},
    )
    contacts = client.get("/api/outreach/contacts").json()
    target = next(c for c in contacts if c["email"] == "del.me@example.com")
    assert client.delete(f"/api/outreach/contacts/{target['id']}").status_code == 200
    remaining = {c["email"] for c in client.get("/api/outreach/contacts").json()}
    assert "del.me@example.com" not in remaining
    assert client.delete(f"/api/outreach/contacts/{target['id']}").status_code == 404


def test_templates_seeded_and_created(client):
    response = client.get("/api/outreach/templates")
    assert response.status_code == 200
    templates = response.json()
    assert len(templates) >= 3
    names = {t["name"] for t in templates}
    assert {"Referral ask", "HR outreach", "Alumni connect"} <= names
    for template in templates:
        assert set(template) == {"id", "name", "subject", "body", "created_at"}

    created = client.post(
        "/api/outreach/templates",
        json={"name": "Follow up", "subject": "Following up — {company}", "body": "Hi {name}, following up on my earlier note."},
    )
    assert created.status_code == 201
    assert created.json()["name"] == "Follow up"
    assert "{name}" in created.json()["body"]


def test_render_template_missing_keys_safe():
    body = "Hi {name}, about {company} and {unknown}."
    rendered = mailer.render_template(body, {"name": "Alice", "company": None})
    assert rendered == "Hi Alice, about  and {unknown}."
    # Unbalanced braces must not crash rendering.
    assert mailer.render_template("Hi {name} {", {"name": "A"}) == "Hi {name} {"


def test_dry_run_campaign_never_touches_smtp(client, _forbid_smtp):
    client.post(
        "/api/outreach/contacts",
        files={"file": ("c.csv", (
            "name,role,company,email\n"
            "Carol Dry,SDE,Initech,carol.dry@example.com\n"
            "Dave Dry,PM,Hooli,dave.dry@example.com\n"
        ).encode(), "text/csv")},
    )
    contacts = client.get("/api/outreach/contacts").json()
    ids = [c["id"] for c in contacts if c["email"].endswith(".dry@example.com")]
    template_id = client.get("/api/outreach/templates").json()[0]["id"]

    # dry_run omitted → defaults to True.
    response = client.post(
        "/api/outreach/campaigns",
        json={"name": "dry run test", "template_id": template_id, "contact_ids": ids},
    )
    assert response.status_code == 200
    result = response.json()
    assert result == {
        "campaign_id": result["campaign_id"],
        "status": "done",
        "sent": 0,
        "failed": 0,
        "dryrun": 2,
    }

    detail = client.get(f"/api/outreach/campaigns/{result['campaign_id']}").json()
    assert detail["dry_run"] is True
    assert len(detail["logs"]) == 2
    assert {log["status"] for log in detail["logs"]} == {"dryrun"}
    for log in detail["logs"]:
        assert set(log) == {"id", "campaign_id", "contact_id", "status", "detail", "sent_at"}


def test_campaign_listing_with_counts(client, _forbid_smtp):
    contacts = client.get("/api/outreach/contacts").json()
    template_id = client.get("/api/outreach/templates").json()[0]["id"]
    created = client.post(
        "/api/outreach/campaigns",
        json={
            "name": "listing test",
            "template_id": template_id,
            "contact_ids": [c["id"] for c in contacts[:2]],
            "dry_run": True,
        },
    )
    assert created.status_code == 200

    listing = client.get("/api/outreach/campaigns").json()
    assert listing
    entry = next(c for c in listing if c["id"] == created.json()["campaign_id"])
    assert entry["dryrun"] == 2
    assert entry["status"] == "done"
    assert set(entry) == {
        "id", "name", "template_id", "status", "dry_run", "created_at",
        "sent", "failed", "dryrun",
    }

    assert client.get("/api/outreach/campaigns/999999").status_code == 404
    bad = client.post(
        "/api/outreach/campaigns",
        json={"name": "x", "template_id": 999999, "contact_ids": [1]},
    )
    assert bad.status_code == 404


def test_personalize_fallback_without_key(client, monkeypatch):
    from app.config import settings

    monkeypatch.setattr(settings, "deepseek_api_key", "")
    response = client.post(
        "/api/outreach/personalize",
        json={"blurb": "SDE at Acme, ex-Google", "template_body": "Hi {name}, love your work."},
    )
    assert response.status_code == 200
    assert response.json() == {"engine": "fallback", "body": "Hi {name}, love your work."}
