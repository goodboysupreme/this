"""Extract plain text and a rough section map from uploaded PDF/DOCX resumes.

Parsing happens fully in memory — uploaded bytes are never written to disk.
Section detection is heuristic: short standalone lines matching common resume
headings (case-insensitive) start a new section.
"""

from __future__ import annotations

import io
import re

import docx
import fitz  # PyMuPDF

# Canonical section name -> accepted heading spellings (lowercase, alpha-only).
SECTION_ALIASES: dict[str, tuple[str, ...]] = {
    "summary": ("summary", "objective", "profile", "professional summary", "about me"),
    "education": (
        "education",
        "academics",
        "academic background",
        "education qualifications",
        "qualifications",
    ),
    "experience": (
        "experience",
        "work experience",
        "professional experience",
        "employment history",
        "work history",
        "internships",
        "internship",
        "industrial experience",
    ),
    "projects": (
        "projects",
        "personal projects",
        "academic projects",
        "key projects",
        "selected projects",
    ),
    "skills": (
        "skills",
        "technical skills",
        "tech skills",
        "technologies",
        "tech stack",
        "competencies",
        "skills and tools",
    ),
    "achievements": (
        "achievements",
        "awards",
        "honors",
        "honours",
        "awards and achievements",
        "certifications",
        "certificates",
        "accomplishments",
    ),
    "positions": (
        "positions of responsibility",
        "position of responsibility",
        "leadership",
        "extracurricular",
        "extracurricular activities",
        "activities",
    ),
    "publications": ("publications", "research", "papers", "research work"),
}

_ALIAS_LOOKUP = {
    alias: canonical
    for canonical, aliases in SECTION_ALIASES.items()
    for alias in aliases
}

_HEADING_MAX_LEN = 45


def _extract_pdf_text(data: bytes) -> str:
    with fitz.open(stream=data, filetype="pdf") as pdf:
        return "\n".join(page.get_text() for page in pdf)


def _extract_docx_text(data: bytes) -> str:
    document = docx.Document(io.BytesIO(data))
    return "\n".join(p.text for p in document.paragraphs)


def _normalize_heading(line: str) -> str:
    """Lowercase alpha-only form used for heading comparison."""
    return re.sub(r"[^a-z ]", "", line.lower()).strip()


def match_heading(line: str) -> str | None:
    """Return the canonical section name if ``line`` looks like a heading."""
    stripped = line.strip().strip(":").strip()
    if not stripped or len(stripped) > _HEADING_MAX_LEN or stripped.endswith("."):
        return None
    return _ALIAS_LOOKUP.get(_normalize_heading(stripped))


def split_sections(text: str) -> dict[str, str]:
    """Split resume text into ``{section_name: section_text}``.

    Lines before the first recognized heading are kept under ``"header"``
    (typically name + contact info). Sections appear in document order.
    """
    sections: dict[str, list[str]] = {}
    current = "header"
    sections[current] = []
    for line in text.splitlines():
        heading = match_heading(line)
        if heading is not None:
            current = heading
            sections.setdefault(current, [])
            continue
        sections[current].append(line)
    return {
        name: "\n".join(lines).strip()
        for name, lines in sections.items()
        if "\n".join(lines).strip()
    }


def parse_resume(filename: str, data: bytes) -> dict:
    """Parse uploaded resume bytes.

    Returns ``{"text": str, "sections": {name: text}}``.
    Raises ``ValueError`` for unsupported extensions.
    """
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    if ext == "pdf":
        text = _extract_pdf_text(data)
    elif ext == "docx":
        text = _extract_docx_text(data)
    else:
        raise ValueError(f"unsupported file type '.{ext}' — upload a PDF or DOCX")
    return {"text": text, "sections": split_sections(text)}
