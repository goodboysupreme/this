"""API smoke tests against a seeded test database."""

import seed_mock


def test_health(client):
    resp = client.get("/api/health")
    assert resp.status_code == 200
    assert resp.json() == {"status": "ok"}


def test_companies_list(client):
    resp = client.get("/api/companies")
    assert resp.status_code == 200
    companies = resp.json()
    assert len(companies) >= 25
    first = companies[0]
    assert {"id", "name", "slug", "sector", "offer_count"} <= set(first)
    assert first["offer_count"] > 0


def test_companies_search(client):
    resp = client.get("/api/companies", params={"search": "micro"})
    assert resp.status_code == 200
    names = [c["name"] for c in resp.json()]
    assert any("Microsoft" in n for n in names)


def test_companies_sector_filter(client):
    resp = client.get("/api/companies", params={"sector": "Finance"})
    assert resp.status_code == 200
    companies = resp.json()
    assert companies
    assert all(c["sector"] == "Finance" for c in companies)


def test_company_detail(client):
    resp = client.get("/api/companies/microsoft")
    assert resp.status_code == 200
    detail = resp.json()
    assert detail["slug"] == "microsoft"
    assert detail["offers"], "expected seeded offers"
    assert detail["cutoff_predictions"], "expected cutoff predictions"
    # Only approved experiences are exposed.
    assert detail["experiences"]
    prediction = detail["cutoff_predictions"][0]
    assert {"company", "type", "expected_cutoff", "band", "sample_size", "basis"} <= set(prediction)


def test_company_detail_404(client):
    assert client.get("/api/companies/does-not-exist").status_code == 404


def test_offers_filter_by_type_and_year(client):
    resp = client.get("/api/offers", params={"type": "placement", "year": 2024})
    assert resp.status_code == 200
    offers = resp.json()
    assert offers
    assert all(o["type"] == "placement" and o["year"] == 2024 for o in offers)
    assert all(o["company_name"] for o in offers)


def test_offers_filter_by_cg_range(client):
    resp = client.get("/api/offers", params={"min_cg": 9.0, "max_cg": 9.5})
    assert resp.status_code == 200
    for offer in resp.json():
        assert 9.0 <= offer["cgpa_cutoff"] <= 9.5


def test_cutoff_endpoint(client):
    resp = client.get("/api/companies/google/cutoff", params={"type": "placement"})
    assert resp.status_code == 200
    body = resp.json()
    assert body["company"] == "Google"
    assert body["type"] == "placement"
    assert body["basis"] in ("company_history", "sector_average", "insufficient_data")
    if body["expected_cutoff"] is not None:
        low, high = body["band"]
        assert low <= body["expected_cutoff"] <= high


def test_stats_summary(client):
    resp = client.get("/api/stats/summary")
    assert resp.status_code == 200
    stats = resp.json()
    assert stats["companies_count"] >= 25
    assert stats["offers_count"] > 0
    assert sum(stats["offers_by_type"].values()) == stats["offers_count"]
    assert stats["top_recruiters"]
    assert stats["cg_cutoff_distribution"]
    assert stats["branch_stats"]
    assert [p["year"] for p in stats["yearly_trend"]] == sorted(
        p["year"] for p in stats["yearly_trend"]
    )


def test_compare(client):
    resp = client.get("/api/compare", params={"slugs": "microsoft,google,not-a-company"})
    assert resp.status_code == 200
    body = resp.json()
    slugs = [c["company"]["slug"] for c in body["companies"]]
    assert slugs == ["microsoft", "google"]
    assert body["missing_slugs"] == ["not-a-company"]


def test_seed_is_deterministic():
    a = seed_mock.build_mock_data()
    b = seed_mock.build_mock_data()
    assert a == b
