"""Tests for Phase 4: auth, favorites, experience bank, admin, analytics."""

import csv
import uuid

import pytest

ADMIN_KEY = "dev-admin-key"


def _register(client, email=None, password="secret123", name="Test User"):
    email = email or f"user-{uuid.uuid4().hex[:8]}@example.com"
    resp = client.post(
        "/api/auth/register",
        json={"email": email, "password": password, "name": name},
    )
    return resp, email


def _auth_headers(client, email=None, password="secret123"):
    resp, email = _register(client, email=email, password=password)
    assert resp.status_code == 201
    token = client.post(
        "/api/auth/login", json={"email": email, "password": password}
    ).json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


# --- auth ---


def test_register_login_me_roundtrip(client):
    resp, email = _register(client, name="Vansh Malik")
    assert resp.status_code == 201
    body = resp.json()
    assert body["email"] == email
    assert body["name"] == "Vansh Malik"
    assert isinstance(body["id"], int)

    login = client.post(
        "/api/auth/login", json={"email": email, "password": "secret123"}
    )
    assert login.status_code == 200
    token = login.json()["access_token"]
    assert login.json()["token_type"] == "bearer"

    me = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me.status_code == 200
    profile = me.json()
    assert profile["email"] == email
    assert profile["branch"] is None
    assert profile["cgpa"] is None

    patched = client.patch(
        "/api/auth/me",
        headers={"Authorization": f"Bearer {token}"},
        json={"branch": "CS", "degree": "B.E.", "grad_year": 2026, "cgpa": 8.5},
    )
    assert patched.status_code == 200
    profile = patched.json()
    assert profile["branch"] == "CS"
    assert profile["grad_year"] == 2026
    assert profile["cgpa"] == 8.5


def test_register_duplicate_email_409(client):
    _, email = _register(client)
    resp, _ = _register(client, email=email)
    assert resp.status_code == 409


def test_login_bad_credentials_401(client):
    _, email = _register(client)
    resp = client.post(
        "/api/auth/login", json={"email": email, "password": "wrong-password"}
    )
    assert resp.status_code == 401


def test_me_requires_token_401(client):
    assert client.get("/api/auth/me").status_code == 401
    assert (
        client.get("/api/auth/me", headers={"Authorization": "Bearer garbage"}).status_code
        == 401
    )


# --- favorites ---


def test_favorite_toggle_and_list(client):
    headers = _auth_headers(client)

    anon_detail = client.get("/api/companies/microsoft")
    assert anon_detail.status_code == 200
    assert anon_detail.json()["is_favorited"] is False

    assert client.post("/api/companies/microsoft/favorite").status_code == 401

    on = client.post("/api/companies/microsoft/favorite", headers=headers)
    assert on.status_code == 200
    assert on.json() == {"favorited": True}

    detail = client.get("/api/companies/microsoft", headers=headers)
    assert detail.status_code == 200
    assert detail.json()["is_favorited"] is True

    favs = client.get("/api/me/favorites", headers=headers)
    assert favs.status_code == 200
    slugs = [c["slug"] for c in favs.json()]
    assert slugs == ["microsoft"]
    assert {"id", "name", "slug", "sector", "offer_count"} <= set(favs.json()[0])

    off = client.post("/api/companies/microsoft/favorite", headers=headers)
    assert off.json() == {"favorited": False}
    assert client.get("/api/me/favorites", headers=headers).json() == []


# --- experience bank + admin moderation ---


def test_experience_submit_pending_approve_flow(client):
    content = "Three rounds: OA with two DSA problems, then a technical round on OS and networks, then HR. Mostly LeetCode mediums."
    submit = client.post(
        "/api/experiences",
        json={
            "company_slug": "adobe",
            "type": "placement",
            "year": 2025,
            "author_hint": "CS '25",
            "content": content,
        },
    )
    assert submit.status_code == 201
    assert submit.json() == {"ok": True}

    # Not visible publicly until approved.
    public = client.get("/api/experiences", params={"company_slug": "adobe"})
    assert all(content not in e["content"] for e in public.json())
    detail = client.get("/api/companies/adobe")
    assert all(content not in e["content"] for e in detail.json()["experiences"])

    # Admin endpoints reject missing/wrong keys.
    assert client.get("/api/admin/experiences/pending").status_code == 403
    assert (
        client.get(
            "/api/admin/experiences/pending", headers={"X-Admin-Key": "nope"}
        ).status_code
        == 403
    )

    pending = client.get(
        "/api/admin/experiences/pending", headers={"X-Admin-Key": ADMIN_KEY}
    )
    assert pending.status_code == 200
    match = [e for e in pending.json() if e["content"] == content]
    assert match and match[0]["company_name"] == "Adobe"
    exp_id = match[0]["id"]

    approve = client.post(
        f"/api/admin/experiences/{exp_id}/approve", headers={"X-Admin-Key": ADMIN_KEY}
    )
    assert approve.status_code == 200
    assert approve.json() == {"ok": True}

    public = client.get("/api/experiences", params={"company_slug": "adobe"})
    assert any(e["content"] == content for e in public.json())
    assert all(e["company_slug"] == "adobe" for e in public.json())


def test_experience_validation(client):
    assert (
        client.post(
            "/api/experiences",
            json={
                "company_slug": "no-such-company",
                "type": "placement",
                "year": 2025,
                "author_hint": "x",
                "content": "This content is long enough to pass length checks.",
            },
        ).status_code
        == 404
    )
    assert (
        client.post(
            "/api/experiences",
            json={
                "company_slug": "adobe",
                "type": "placement",
                "year": 2025,
                "author_hint": "x",
                "content": "too short",
            },
        ).status_code
        == 422
    )
    assert (
        client.post(
            "/api/experiences",
            json={
                "company_slug": "adobe",
                "type": "invalid-type",
                "year": 2025,
                "author_hint": "x",
                "content": "This content is long enough to pass length checks.",
            },
        ).status_code
        == 422
    )


def test_experience_reject_deletes(client):
    content = "Reject me: single HR-only round for a non-tech role, very quick process overall."
    client.post(
        "/api/experiences",
        json={
            "company_slug": "tcs",
            "type": "si",
            "year": 2024,
            "author_hint": "Mech '26",
            "content": content,
        },
    )
    pending = client.get(
        "/api/admin/experiences/pending", headers={"X-Admin-Key": ADMIN_KEY}
    ).json()
    exp_id = next(e["id"] for e in pending if e["content"] == content)

    reject = client.post(
        f"/api/admin/experiences/{exp_id}/reject", headers={"X-Admin-Key": ADMIN_KEY}
    )
    assert reject.json() == {"ok": True}
    pending_after = client.get(
        "/api/admin/experiences/pending", headers={"X-Admin-Key": ADMIN_KEY}
    ).json()
    assert all(e["id"] != exp_id for e in pending_after)


# --- analytics ---


def test_analytics_event_and_admin_analytics(client):
    assert client.post("/api/analytics/event", json={"path": "/companies"}).status_code == 201
    assert client.post("/api/analytics/event", json={"path": "/companies"}).json() == {
        "ok": True
    }
    assert client.post("/api/analytics/event", json={"path": "/resume"}).status_code == 201
    assert (
        client.post("/api/analytics/event", json={"path": "x" * 201}).status_code == 422
    )

    assert client.get("/api/admin/analytics").status_code == 403
    resp = client.get("/api/admin/analytics", headers={"X-Admin-Key": ADMIN_KEY})
    assert resp.status_code == 200
    body = resp.json()
    counts = {p["path"]: p["count"] for p in body["page_events"]}
    assert counts["/companies"] == 2
    assert counts["/resume"] == 1
    assert body["totals"]["events"] >= 3
    assert body["totals"]["users"] >= 1
    assert "experiences_pending" in body["totals"]


# --- admin dataset upload ---


def test_dataset_upload_csv(client, tmp_path):
    csv_path = tmp_path / "placements.csv"
    with csv_path.open("w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["Company", "Year", "Role", "CGPA", "CTC"])
        writer.writerow(["UploadTest Corp", 2024, "SDE", 8.0, 30])
        writer.writerow(["UploadTest Corp", 2023, "SDE", 7.5, 28])
        writer.writerow([None, None, None, None, None])  # skipped row

    with csv_path.open("rb") as f:
        resp = client.post(
            "/api/admin/dataset/upload",
            headers={"X-Admin-Key": ADMIN_KEY},
            files={"file": ("placements.csv", f, "text/csv")},
            data={"kind": "placement"},
        )
    assert resp.status_code == 200
    assert resp.json() == {"imported": 2, "skipped": 1}

    detail = client.get("/api/companies/uploadtest-corp")
    assert detail.status_code == 200
    assert len(detail.json()["offers"]) == 2

    # Requires the admin key.
    with csv_path.open("rb") as f:
        forbidden = client.post(
            "/api/admin/dataset/upload",
            files={"file": ("placements.csv", f, "text/csv")},
            data={"kind": "placement"},
        )
    assert forbidden.status_code == 403

    # Rejects bad kind values.
    with csv_path.open("rb") as f:
        bad_kind = client.post(
            "/api/admin/dataset/upload",
            headers={"X-Admin-Key": ADMIN_KEY},
            files={"file": ("placements.csv", f, "text/csv")},
            data={"kind": "bogus"},
        )
    assert bad_kind.status_code == 422
