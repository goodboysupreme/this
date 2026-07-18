"""Unit tests for the deterministic offline ATS scorer."""

from app.services import ats_fallback

GOOD_RESUME = """\
Jane Doe
jane@example.com | +91 98765 43210 | linkedin.com/in/janedoe | github.com/janedoe

Summary
Final-year CS student with experience in python and sql.

Education
B.E. Computer Science, BITS Pilani, 2022-2026

Experience
• Built a fastapi backend serving 10000 requests per day using python and sql
• Improved the data analysis pipeline with pandas, cutting runtime by 40%
• Led a team of 4 developers to ship a react dashboard for 200 students

Projects
• Developed a dockerized ml model achieving 92% accuracy on test data

Skills
python, sql, react, fastapi, pandas, docker, git, machine learning
"""

WEAK_RESUME = """\
John Smith

Experience
I worked on stuff.
Did some things with code.
Helped the team.
"""


def _checks(report):
    return {c["name"]: c for c in report["ats_checks"]}


def _sections(report):
    return {s["name"]: s for s in report["sections"]}


def test_section_detection_present_and_missing():
    report = ats_fallback.analyze(GOOD_RESUME)
    sections = _sections(report)
    assert sections["experience"]["score"] > 0
    assert sections["education"]["score"] == 100
    assert sections["skills"]["score"] > 0
    assert sections["summary"]["score"] > 0
    assert "4/5" in _checks(report)["Standard sections"]["detail"] or "5/5" in _checks(report)["Standard sections"]["detail"]

    weak = ats_fallback.analyze(WEAK_RESUME)
    weak_sections = _sections(weak)
    assert weak_sections["education"]["score"] == 0
    assert "Missing education section" in weak_sections["education"]["issues"]
    assert weak_sections["projects"]["score"] == 0


def test_bullet_lint_action_verbs_quantification_length():
    report = ats_fallback.analyze(GOOD_RESUME)
    checks = _checks(report)
    assert checks["Action verbs"]["passed"] is True
    assert checks["Quantified impact"]["passed"] is True
    assert checks["Bullet length"]["passed"] is True

    weak = ats_fallback.analyze(WEAK_RESUME)
    weak_checks = _checks(weak)
    assert weak_checks["Action verbs"]["passed"] is False
    assert weak_checks["Quantified impact"]["passed"] is False


def test_contact_and_links_checks():
    report = ats_fallback.analyze(GOOD_RESUME)
    checks = _checks(report)
    assert checks["Contact email"]["passed"] is True
    assert checks["Contact phone"]["passed"] is True
    assert checks["Professional links"]["passed"] is True

    weak = ats_fallback.analyze(WEAK_RESUME)
    assert _checks(weak)["Contact email"]["passed"] is False


def test_determinism_same_input_same_output():
    first = ats_fallback.analyze(GOOD_RESUME)
    second = ats_fallback.analyze(GOOD_RESUME)
    assert first == second
    jd_first = ats_fallback.jd_match(GOOD_RESUME, "python sql docker kubernetes engineer")
    jd_second = ats_fallback.jd_match(GOOD_RESUME, "python sql docker kubernetes engineer")
    assert jd_first == jd_second


def test_score_bounds_and_types():
    for text in ("", "hello", GOOD_RESUME, WEAK_RESUME):
        report = ats_fallback.analyze(text)
        assert isinstance(report["overall_score"], int)
        assert 0 <= report["overall_score"] <= 100
        for section in report["sections"]:
            assert 0 <= section["score"] <= 100
            assert isinstance(section["issues"], list)
            assert isinstance(section["suggestions"], list)
        assert isinstance(report["skills_detected"], list)
        assert isinstance(report["summary"], str)


def test_skill_extraction_lexicon():
    skills = ats_fallback.extract_skills(GOOD_RESUME)
    for expected in ("python", "sql", "react", "docker", "machine learning"):
        assert expected in skills
    assert "kubernetes" not in skills
    assert skills == sorted(skills)


def test_jd_match_fallback_keywords_and_shape():
    result = ats_fallback.jd_match(
        GOOD_RESUME,
        "Seeking a python engineer with docker, kubernetes, aws and machine learning skills",
    )
    assert set(result) == {
        "match_score",
        "matched_keywords",
        "missing_keywords",
        "tailored_bullets",
        "suggested_projects",
    }
    assert 0 <= result["match_score"] <= 100
    assert "python" in result["matched_keywords"]
    assert "kubernetes" in result["missing_keywords"]
    assert "aws" in result["missing_keywords"]
    assert result["tailored_bullets"]
    assert all(set(b) == {"original", "suggested"} for b in result["tailored_bullets"])
    assert result["suggested_projects"]
    project = result["suggested_projects"][0]
    assert set(project) == {"title", "stack", "why", "talking_points"}
    assert isinstance(project["stack"], list)
    assert isinstance(project["talking_points"], list)
