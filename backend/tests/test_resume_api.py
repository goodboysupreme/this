"""API tests for the resume screener (Pillar B) via FastAPI TestClient.

Fixture resumes (docx + pdf) are generated at test time with python-docx and
PyMuPDF. No DeepSeek key is configured in tests, so engine must be "fallback".
"""

import io

import docx
import fitz
import pytest

from app.config import settings

RESUME_LINES = [
    "Jane Doe",
    "jane@example.com | +91 98765 43210 | linkedin.com/in/janedoe",
    "Education",
    "B.E. Computer Science, BITS Pilani, 2022-2026",
    "Experience",
    "• Built a fastapi backend serving 10000 requests per day using python and sql",
    "• Improved the data analysis pipeline with pandas, cutting runtime by 40%",
    "Projects",
    "• Developed a dockerized ml model achieving 92% accuracy on test data",
    "Skills",
    "python, sql, react, fastapi, pandas, docker, git, machine learning",
]

DOCX_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"


def _docx_bytes() -> bytes:
    document = docx.Document()
    for line in RESUME_LINES:
        document.add_paragraph(line)
    buffer = io.BytesIO()
    document.save(buffer)
    return buffer.getvalue()


def _pdf_bytes() -> bytes:
    pdf = fitz.open()
    page = pdf.new_page()
    y = 72
    for line in RESUME_LINES:
        page.insert_text((72, y), line, fontsize=11)
        y += 16
    data = pdf.tobytes()
    pdf.close()
    return data


@pytest.fixture(autouse=True)
def _no_deepseek_key(monkeypatch):
    monkeypatch.setattr(settings, "deepseek_api_key", "")


def test_analyze_docx_fallback_shape(client):
    response = client.post(
        "/api/resume/analyze",
        files={"file": ("resume.docx", _docx_bytes(), DOCX_MIME)},
    )
    assert response.status_code == 200
    body = response.json()
    assert set(body) == {
        "engine",
        "overall_score",
        "sections",
        "skills_detected",
        "ats_checks",
        "summary",
    }
    assert body["engine"] == "fallback"
    assert isinstance(body["overall_score"], int)
    assert 0 <= body["overall_score"] <= 100
    assert body["sections"]
    for section in body["sections"]:
        assert set(section) == {"name", "score", "issues", "suggestions"}
    assert body["ats_checks"]
    for check in body["ats_checks"]:
        assert set(check) == {"name", "passed", "detail"}
    assert "python" in body["skills_detected"]
    assert isinstance(body["summary"], str) and body["summary"]


def test_analyze_pdf_fallback(client):
    response = client.post(
        "/api/resume/analyze",
        files={"file": ("resume.pdf", _pdf_bytes(), "application/pdf")},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["engine"] == "fallback"
    assert "python" in body["skills_detected"]


def test_analyze_deepseek_failure_falls_back(client, monkeypatch):
    monkeypatch.setattr(settings, "deepseek_api_key", "fake-key")

    def _boom(text):
        raise RuntimeError("simulated API failure")

    monkeypatch.setattr("app.services.deepseek_client.analyze_resume", _boom)
    response = client.post(
        "/api/resume/analyze",
        files={"file": ("resume.docx", _docx_bytes(), DOCX_MIME)},
    )
    assert response.status_code == 200
    assert response.json()["engine"] == "fallback"


def test_analyze_rejects_bad_uploads(client):
    response = client.post(
        "/api/resume/analyze",
        files={"file": ("notes.txt", b"plain text", "text/plain")},
    )
    assert response.status_code == 400

    big = client.post(
        "/api/resume/analyze",
        files={"file": ("big.docx", b"x" * (5 * 1024 * 1024 + 1), DOCX_MIME)},
    )
    assert big.status_code == 413


def test_jd_match_shape_and_export_roundtrip(client):
    jd = "We need a python engineer with kubernetes, aws, docker and machine learning skills"
    response = client.post(
        "/api/resume/jd-match",
        files={"file": ("resume.docx", _docx_bytes(), DOCX_MIME)},
        data={"jd_text": jd},
    )
    assert response.status_code == 200
    body = response.json()
    assert set(body) == {
        "engine",
        "match_score",
        "matched_keywords",
        "missing_keywords",
        "tailored_bullets",
        "suggested_projects",
        "download_id",
    }
    assert body["engine"] == "fallback"
    assert 0 <= body["match_score"] <= 100
    assert "python" in body["matched_keywords"]
    assert "kubernetes" in body["missing_keywords"]
    for bullet in body["tailored_bullets"]:
        assert set(bullet) == {"original", "suggested"}
    for project in body["suggested_projects"]:
        assert set(project) == {"title", "stack", "why", "talking_points"}

    download_id = body["download_id"]
    assert len(download_id) == 32

    export = client.get(f"/api/resume/export/{download_id}")
    assert export.status_code == 200
    assert export.headers["content-type"].startswith(
        "application/vnd.openxmlformats-officedocument"
    )
    assert len(export.content) > 0


def test_export_rejects_invalid_ids(client):
    assert client.get("/api/resume/export/not-a-uuid").status_code == 404
    assert client.get("/api/resume/export/..%2F..%2Fsecret").status_code == 404
    assert client.get("/api/resume/export/" + "0" * 32).status_code == 404  # valid form, missing file


def test_jd_match_requires_jd_text(client):
    response = client.post(
        "/api/resume/jd-match",
        files={"file": ("resume.docx", _docx_bytes(), DOCX_MIME)},
        data={"jd_text": "   "},
    )
    assert response.status_code == 400
