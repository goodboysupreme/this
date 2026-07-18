"""DeepSeek API client (OpenAI-compatible), JSON-mode prompts.

Every function raises on any failure (missing key, timeout, bad JSON) —
callers are expected to catch and fall back to the offline engine.
"""

from __future__ import annotations

import json
from pathlib import Path

from openai import OpenAI

from ..config import settings

PROMPTS_DIR = Path(__file__).resolve().parents[1] / "prompts"
MODEL = "deepseek-chat"
TIMEOUT_SECONDS = 10


def _load_prompt(name: str) -> str:
    return (PROMPTS_DIR / name).read_text(encoding="utf-8")


def _client() -> OpenAI:
    if not settings.deepseek_api_key:
        raise RuntimeError("DEEPSEEK_API_KEY is not configured")
    return OpenAI(
        api_key=settings.deepseek_api_key,
        base_url=settings.deepseek_base_url,
        timeout=TIMEOUT_SECONDS,
        max_retries=0,
    )


def _chat_json(system_prompt: str, user_content: str) -> dict:
    response = _client().chat.completions.create(
        model=MODEL,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_content},
        ],
        response_format={"type": "json_object"},
        temperature=0,
    )
    content = response.choices[0].message.content
    if not content:
        raise RuntimeError("DeepSeek returned an empty completion")
    return json.loads(content)


def analyze_resume(text: str) -> dict:
    """DeepSeek resume analysis. Raises on any failure."""
    return _chat_json(_load_prompt("resume_analyze_v1.txt"), text[:15000])


def jd_match(text: str, jd: str) -> dict:
    """DeepSeek resume↔JD match. Raises on any failure."""
    user = f"RESUME:\n{text[:10000]}\n\nJOB DESCRIPTION:\n{jd[:5000]}"
    return _chat_json(_load_prompt("jd_match_v1.txt"), user)


def personalize_opening(blurb: str, template_body: str) -> dict:
    """DeepSeek-personalized outreach opening line. Raises on any failure."""
    user = f"CONTACT BLURB:\n{blurb[:2000]}\n\nTEMPLATE:\n{template_body[:4000]}"
    return _chat_json(_load_prompt("personalize_v1.txt"), user)
