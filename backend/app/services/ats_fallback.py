"""Deterministic, offline ATS resume scorer — pure Python, no network.

Same input always produces the same output. Used as the fallback engine when
DeepSeek is unavailable, and as the normalizer baseline for API results.
"""

from __future__ import annotations

import math
import re

from .resume_parser import split_sections

# ---------------------------------------------------------------------------
# Lexicons
# ---------------------------------------------------------------------------

ACTION_VERBS = frozenset(
    """
    achieved analyzed architected automated boosted built collaborated conceived
    configured coordinated created cut debugged delivered designed developed
    devised drove engineered enhanced established evaluated executed forecasted
    founded generated grew implemented improved increased initiated launched
    led maintained managed mentored migrated modeled modernized negotiated
    optimized orchestrated organized owned pioneered pitched planned presented
    programmed published quantified raised rebuilt redesigned reduced
    refactored researched resolved restructured revamped saved scaled secured
    shipped simplified solved spearheaded streamlined structured supervised
    supported tested trained transformed won wrote
    """.split()
)

# ~150 terms across tech, finance, and consulting. Keep lowercase; matching is
# case-insensitive with custom word boundaries (handles c++, c#, next.js).
SKILL_LEXICON: tuple[str, ...] = tuple(
    sorted(
        {
            # tech / engineering
            "python", "java", "c++", "c#", "javascript", "typescript", "go",
            "rust", "kotlin", "swift", "sql", "mysql", "postgresql", "sqlite",
            "mongodb", "redis", "elasticsearch", "html", "css", "react",
            "next.js", "angular", "vue", "node.js", "express", "django",
            "flask", "fastapi", "spring boot", "rest api", "graphql", "aws",
            "azure", "gcp", "docker", "kubernetes", "terraform", "ci/cd",
            "jenkins", "git", "github", "linux", "bash", "pandas", "numpy",
            "scikit-learn", "tensorflow", "pytorch", "keras",
            "machine learning", "deep learning", "nlp", "computer vision",
            "data analysis", "data engineering", "spark", "hadoop", "airflow",
            "tableau", "power bi", "excel", "statistics", "a/b testing",
            "microservices", "system design", "algorithms", "data structures",
            "oop", "api design", "websockets", "kafka", "rabbitmq", "llm",
            "prompt engineering", "rag", "matplotlib", "seaborn", "jupyter",
            "streamlit", "selenium", "pytest", "unit testing", "agile",
            "scrum", "jira", "figma",
            # finance
            "financial modeling", "valuation", "dcf", "equity research",
            "portfolio management", "risk analysis", "risk management",
            "derivatives", "options", "futures", "fixed income", "bloomberg",
            "accounting", "financial statements", "vba", "quantitative analysis",
            "trading", "investment banking", "private equity",
            "venture capital", "corporate finance", "budgeting", "forecasting",
            "audit", "taxation", "sap", "econometrics", "time series",
            # consulting / business
            "market research", "business analysis", "strategy", "consulting",
            "stakeholder management", "powerpoint", "presentation",
            "case study", "problem solving", "project management",
            "client management", "due diligence", "market sizing",
            "competitive analysis", "business development", "operations",
            "supply chain", "process improvement", "change management",
            "kpi", "dashboard", "negotiation", "communication", "leadership",
            "teamwork", "public speaking",
        }
    )
)

STANDARD_SECTIONS = ("summary", "education", "experience", "projects", "skills")

_STOPWORDS = frozenset(
    """
    a an the and or to of in for with on at is are was were be been being you
    your we our they their this that as by from will would can could should
    have has had not it its i me my he she his her them us who what when where
    how all any both each more most other some such no nor too very just but
    if then than so up out about into over after work working team role job
    candidate strong ability plus new etc including within across
    """.split()
)

EMAIL_RE = re.compile(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}")
PHONE_RE = re.compile(r"(?:\+?\d[\d\s().-]{7,}\d)")
LINK_RE = re.compile(r"(?:linkedin\.com|github\.com)", re.IGNORECASE)
BULLET_RE = re.compile(r"^\s*(?:[•\-\*\u25cf\u00b7\u2013\u2014\u25aa\u25e6]|\d+[.)])\s+")
WORD_RE = re.compile(r"[A-Za-z][A-Za-z0-9+#./-]*")

MIN_BULLET_WORDS, MAX_BULLET_WORDS = 8, 30
MIN_WORDS, MAX_WORDS = 200, 900  # ≈ 1 page ≈ 450-550 words


# ---------------------------------------------------------------------------
# Primitive extractors
# ---------------------------------------------------------------------------

def words(text: str) -> list[str]:
    return WORD_RE.findall(text)


def extract_bullets(text: str) -> list[str]:
    """Bullet-point lines (•, -, *, numbered) with the marker stripped."""
    return [
        BULLET_RE.sub("", line).strip()
        for line in text.splitlines()
        if BULLET_RE.match(line) and len(BULLET_RE.sub("", line).strip()) > 1
    ]


def _starts_with_action_verb(bullet: str) -> bool:
    tokens = WORD_RE.findall(bullet.lower())
    return bool(tokens) and tokens[0] in ACTION_VERBS


def _is_quantified(bullet: str) -> bool:
    return bool(re.search(r"\d", bullet) or "%" in bullet)


def _skill_pattern(term: str) -> re.Pattern:
    return re.compile(rf"(?<![\w+#]){re.escape(term)}(?![\w+#])", re.IGNORECASE)


def extract_skills(text: str) -> list[str]:
    """Sorted list of lexicon skills found in ``text``."""
    return [t for t in SKILL_LEXICON if _skill_pattern(t).search(text)]


# ---------------------------------------------------------------------------
# Section + ATS checks
# ---------------------------------------------------------------------------

def _ratio(flags: list[bool]) -> float:
    return sum(flags) / len(flags) if flags else 0.0


def _check(name: str, passed: bool, detail: str) -> dict:
    return {"name": name, "passed": bool(passed), "detail": detail}


def analyze(text: str) -> dict:
    """Score plain resume text. Returns the unified report minus ``engine``."""
    sections_map = split_sections(text)
    present = set(sections_map) - {"header"}
    bullets = extract_bullets(text)
    skills = extract_skills(text)
    all_words = words(text)
    word_count = len(all_words)
    page_estimate = max(1, round(word_count / 500)) if word_count else 0

    email = EMAIL_RE.search(text)
    phone = PHONE_RE.search(text)
    link = LINK_RE.search(text)

    verb_flags = [_starts_with_action_verb(b) for b in bullets]
    quant_flags = [_is_quantified(b) for b in bullets]
    len_flags = [
        MIN_BULLET_WORDS <= len(words(b)) <= MAX_BULLET_WORDS for b in bullets
    ]
    verb_ratio, quant_ratio, len_ratio = (
        _ratio(verb_flags),
        _ratio(quant_flags),
        _ratio(len_flags),
    )

    sections: list[dict] = []

    # --- contact (from header + anywhere) ---
    issues, suggestions = [], []
    contact_score = (40 if email else 0) + (30 if phone else 0) + (30 if link else 0)
    if not email:
        issues.append("No email address detected")
        suggestions.append("Add a professional email address at the top of the resume")
    if not phone:
        issues.append("No phone number detected")
        suggestions.append("Add a phone number with country code")
    if not link:
        issues.append("No LinkedIn/GitHub link detected")
        suggestions.append("Add LinkedIn and GitHub profile links")
    sections.append({"name": "contact", "score": contact_score,
                     "issues": issues, "suggestions": suggestions})

    # --- summary ---
    summary_text = sections_map.get("summary", "")
    issues, suggestions = [], []
    if not summary_text:
        score = 0
        issues.append("Missing summary/objective section")
        suggestions.append("Add a 2-3 line summary highlighting your strongest skills")
    else:
        n = len(words(summary_text))
        score = 100 if 15 <= n <= 80 else 70
        if not 15 <= n <= 80:
            issues.append("Summary length is off (aim for 15-80 words)")
            suggestions.append("Keep the summary concise: 2-3 impactful lines")
    sections.append({"name": "summary", "score": score,
                     "issues": issues, "suggestions": suggestions})

    # --- education ---
    edu_text = sections_map.get("education", "")
    issues, suggestions = [], []
    if not edu_text:
        score = 0
        issues.append("Missing education section")
        suggestions.append("Add degree, institute, graduation year and CGPA/percentage")
    else:
        has_year = bool(re.search(r"(19|20)\d{2}", edu_text))
        has_degree = bool(re.search(
            r"(?i)\b(b\.?e|b\.?tech|m\.?tech|b\.?sc|m\.?sc|mba|ph\.?d|degree|university|college|institute)\b",
            edu_text,
        ))
        score = 60 + 20 * has_year + 20 * has_degree
        if not has_year:
            issues.append("No graduation year found in education section")
            suggestions.append("Mention start/end years for each degree")
        if not has_degree:
            issues.append("No degree/institute keywords found in education section")
            suggestions.append("State your degree and institute explicitly")
    sections.append({"name": "education", "score": int(score),
                     "issues": issues, "suggestions": suggestions})

    # --- experience ---
    exp_text = sections_map.get("experience", "")
    issues, suggestions = [], []
    if not exp_text:
        score = 0
        issues.append("Missing experience/internships section")
        suggestions.append("Add internships or work experience with bullet points")
    else:
        exp_bullets = extract_bullets(exp_text)
        score = 50 + (20 if exp_bullets else 0)
        score += round(15 * _ratio([_starts_with_action_verb(b) for b in exp_bullets]))
        score += round(15 * _ratio([_is_quantified(b) for b in exp_bullets]))
        if not exp_bullets:
            issues.append("Experience section has no bullet points")
            suggestions.append("Rewrite experience as bullet points starting with action verbs")
        else:
            if _ratio([_starts_with_action_verb(b) for b in exp_bullets]) < 0.7:
                issues.append("Many experience bullets don't start with an action verb")
                suggestions.append("Start bullets with verbs like Built, Led, Improved, Designed")
            if _ratio([_is_quantified(b) for b in exp_bullets]) < 0.4:
                issues.append("Experience bullets lack numbers/quantified impact")
                suggestions.append("Quantify impact: percentages, users, revenue, time saved")
    sections.append({"name": "experience", "score": int(score),
                     "issues": issues, "suggestions": suggestions})

    # --- projects ---
    proj_text = sections_map.get("projects", "")
    issues, suggestions = [], []
    if not proj_text:
        score = 0
        issues.append("Missing projects section")
        suggestions.append("Add 2-3 projects with tech stack and measurable outcomes")
    else:
        proj_bullets = extract_bullets(proj_text)
        score = 60 + (20 if proj_bullets else 0)
        score += round(20 * _ratio([_is_quantified(b) for b in proj_bullets]))
        if not proj_bullets:
            issues.append("Projects section has no bullet points")
            suggestions.append("Describe each project with 2-3 bullets (stack + outcome)")
        elif _ratio([_is_quantified(b) for b in proj_bullets]) < 0.4:
            issues.append("Project bullets lack quantified outcomes")
            suggestions.append("Add metrics: users, accuracy, latency, scale")
    sections.append({"name": "projects", "score": int(score),
                     "issues": issues, "suggestions": suggestions})

    # --- skills ---
    issues, suggestions = [], []
    skill_score = min(100, len(skills) * 10) if "skills" in present or skills else 0
    if "skills" not in present:
        issues.append("Missing dedicated skills section")
        suggestions.append("Add a Skills section listing tools and technologies")
    if len(skills) < 5:
        issues.append("Few recognizable skill keywords detected")
        suggestions.append("List in-demand skills (languages, frameworks, tools) explicitly")
    sections.append({"name": "skills", "score": int(skill_score),
                     "issues": issues, "suggestions": suggestions})

    # --- overall (weighted) ---
    weights = {"contact": 0.10, "summary": 0.10, "education": 0.15,
               "experience": 0.30, "projects": 0.15, "skills": 0.20}
    overall = round(
        sum(s["score"] * weights[s["name"]] for s in sections)
    )
    overall = max(0, min(100, int(overall)))

    # --- flat ATS checks ---
    missing_std = [s for s in STANDARD_SECTIONS if s not in present]
    ats_checks = [
        _check("Contact email", bool(email),
               email.group(0) if email else "no email found"),
        _check("Contact phone", bool(phone),
               "phone number found" if phone else "no phone number found"),
        _check("Professional links", bool(link),
               "LinkedIn/GitHub link found" if link else "no LinkedIn/GitHub link found"),
        _check("Standard sections", len(missing_std) <= 1,
               f"{len(STANDARD_SECTIONS) - len(missing_std)}/{len(STANDARD_SECTIONS)} "
               f"standard sections present"
               + (f" (missing: {', '.join(missing_std)})" if missing_std else "")),
        _check("Action verbs", bool(bullets) and verb_ratio >= 0.7,
               f"{round(verb_ratio * 100)}% of {len(bullets)} bullets start with an action verb"),
        _check("Quantified impact", bool(bullets) and quant_ratio >= 0.4,
               f"{round(quant_ratio * 100)}% of {len(bullets)} bullets contain numbers"),
        _check("Bullet length", bool(bullets) and len_ratio >= 0.7,
               f"{round(len_ratio * 100)}% of {len(bullets)} bullets are {MIN_BULLET_WORDS}-{MAX_BULLET_WORDS} words"),
        _check("Word count", MIN_WORDS <= word_count <= MAX_WORDS,
               f"{word_count} words (≈{page_estimate} page{'s' if page_estimate != 1 else ''}); "
               f"aim for {MIN_WORDS}-{MAX_WORDS}"),
        _check("Skill keywords", len(skills) >= 5,
               f"{len(skills)} recognized skill keywords detected"),
    ]

    # --- summary sentence ---
    strong = [s["name"] for s in sections if s["score"] >= 80]
    top_fixes = [s["issues"][0] for s in sections if s["issues"]][:3]
    parts = [f"ATS score {overall}/100."]
    if strong:
        parts.append(f"Strong areas: {', '.join(strong)}.")
    if missing_std:
        parts.append(f"Missing sections: {', '.join(missing_std)}.")
    if top_fixes:
        parts.append("Top fixes: " + "; ".join(top_fixes) + ".")
    if not bullets:
        parts.append("No bullet points detected — use bullets for experience and projects.")
    summary = " ".join(parts)

    return {
        "overall_score": overall,
        "sections": sections,
        "skills_detected": skills,
        "ats_checks": ats_checks,
        "summary": summary,
    }


# ---------------------------------------------------------------------------
# JD matching (fallback): TF cosine + lexicon keyword gap
# ---------------------------------------------------------------------------

# Project idea bank keyed by skill clusters; used to close missing-skill gaps.
PROJECT_BANK: tuple[dict, ...] = (
    {
        "cluster": ("react", "next.js", "typescript", "node.js", "express",
                    "css", "html", "rest api", "mongodb", "postgresql"),
        "title": "Full-stack dashboard web app",
        "stack": ["next.js", "typescript", "node.js", "postgresql"],
        "why": "Closes full-stack gaps ({skills}); end-to-end ownership is a top signal for SDE roles.",
        "talking_points": [
            "Designed REST APIs with auth and pagination",
            "Optimized page load and database queries with measurable latency wins",
            "Deployed with CI and environment-based config",
        ],
    },
    {
        "cluster": ("python", "pandas", "numpy", "scikit-learn", "machine learning",
                    "tensorflow", "pytorch", "data analysis", "sql", "statistics"),
        "title": "End-to-end ML prediction pipeline",
        "stack": ["python", "pandas", "scikit-learn", "sql"],
        "why": "Shows applied ML/data skills ({skills}) from raw data to evaluated model.",
        "talking_points": [
            "Built feature pipeline and compared model baselines with cross-validation",
            "Reported accuracy/F1 improvements over baseline",
            "Packaged the model behind a small FastAPI endpoint",
        ],
    },
    {
        "cluster": ("docker", "kubernetes", "aws", "azure", "gcp", "ci/cd",
                    "terraform", "jenkins", "linux", "microservices"),
        "title": "Containerized microservice with CI/CD",
        "stack": ["docker", "ci/cd", "aws", "fastapi"],
        "why": "Demonstrates DevOps/cloud fluency ({skills}) that most student resumes lack.",
        "talking_points": [
            "Dockerized a service with health checks and structured logging",
            "Set up CI pipeline running tests on every push",
            "Deployed to a cloud VM with automated rollback",
        ],
    },
    {
        "cluster": ("financial modeling", "valuation", "dcf", "excel", "vba",
                    "equity research", "bloomberg", "accounting", "forecasting",
                    "risk analysis"),
        "title": "Equity research & DCF valuation model",
        "stack": ["excel", "financial modeling", "dcf", "python"],
        "why": "Directly evidences finance skills ({skills}) for analyst roles.",
        "talking_points": [
            "Built a 3-statement model and DCF for a listed company",
            "Ran sensitivity analysis on WACC and growth assumptions",
            "Automated data pulls with Python to cut manual work",
        ],
    },
    {
        "cluster": ("market research", "competitive analysis", "market sizing",
                    "strategy", "case study", "powerpoint", "due diligence",
                    "business analysis", "consulting"),
        "title": "Market-entry strategy case study",
        "stack": ["market research", "market sizing", "powerpoint", "excel"],
        "why": "Mirrors real consulting casework using the missing skills ({skills}).",
        "talking_points": [
            "Sized the market top-down and bottom-up with sourced assumptions",
            "Benchmarked 5+ competitors on pricing and positioning",
            "Presented a recommendation deck with a clear decision framework",
        ],
    },
    {
        "cluster": ("nlp", "llm", "prompt engineering", "rag", "fastapi",
                    "python", "openai"),
        "title": "RAG chatbot over custom documents",
        "stack": ["python", "llm", "rag", "fastapi"],
        "why": "Proves hands-on GenAI skills ({skills}) beyond tutorial level.",
        "talking_points": [
            "Chunked and embedded documents into a vector store",
            "Measured answer quality with an evaluation set",
            "Added caching and rate-limit handling for the LLM API",
        ],
    },
)


def _term_freq(text: str) -> dict[str, int]:
    tf: dict[str, int] = {}
    for tok in WORD_RE.findall(text.lower()):
        if len(tok) < 2 or tok in _STOPWORDS:
            continue
        tf[tok] = tf.get(tok, 0) + 1
    return tf


def _cosine(a: dict[str, int], b: dict[str, int]) -> float:
    if not a or not b:
        return 0.0
    dot = sum(count * b.get(tok, 0) for tok, count in a.items())
    norm_a = math.sqrt(sum(c * c for c in a.values()))
    norm_b = math.sqrt(sum(c * c for c in b.values()))
    return dot / (norm_a * norm_b) if norm_a and norm_b else 0.0


def jd_match(text: str, jd: str) -> dict:
    """Deterministic JD match. Returns the report minus ``engine``/``download_id``."""
    resume_skills = set(extract_skills(text))
    jd_skills = set(extract_skills(jd))
    matched = sorted(resume_skills & jd_skills)
    missing = sorted(jd_skills - resume_skills)

    overlap_ratio = len(matched) / len(jd_skills) if jd_skills else 0.0
    cosine = _cosine(_term_freq(text), _term_freq(jd))
    match_score = max(0, min(100, round(100 * (0.6 * overlap_ratio + 0.4 * cosine))))

    # Tailored bullets: weave top matched skills into the user's own bullets.
    bullets = extract_bullets(text)
    tailored: list[dict] = []
    if bullets and matched:
        for i, bullet in enumerate(bullets[:4]):
            skill = matched[i % len(matched)]
            if skill.lower() in bullet.lower():
                continue
            suggested = bullet.rstrip(". ") + f" using {skill}"
            tailored.append({"original": bullet, "suggested": suggested})
            if len(tailored) >= 3:
                break
    if not tailored and matched:
        for skill in matched[:3]:
            tailored.append({
                "original": "",
                "suggested": f"Built a project applying {skill} to deliver measurable, quantified results",
            })

    # Project suggestions from missing-keyword clusters.
    missing_set = set(missing)
    scored = sorted(
        (
            (len(set(p["cluster"]) & missing_set), p["title"], p)
            for p in PROJECT_BANK
        ),
        key=lambda t: (-t[0], t[1]),
    )
    projects = []
    for overlap, _title, proj in scored:
        if overlap == 0:
            continue
        gaps = sorted(set(proj["cluster"]) & missing_set)
        projects.append({
            "title": proj["title"],
            "stack": list(proj["stack"]),
            "why": proj["why"].format(skills=", ".join(gaps)),
            "talking_points": list(proj["talking_points"]),
        })
        if len(projects) >= 4:
            break

    return {
        "match_score": match_score,
        "matched_keywords": matched,
        "missing_keywords": missing,
        "tailored_bullets": tailored,
        "suggested_projects": projects,
    }
