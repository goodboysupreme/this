"""Unit tests for the cutoff predictor math (pure Python, no DB)."""

import pytest

from app.services.cutoff_predictor import (
    _weighted_median,
    predict_cutoff,
    sector_average,
)


def test_weighted_median_simple():
    # Equal weights -> ordinary median behaviour on sorted midpoints.
    assert _weighted_median([7.0, 8.0, 9.0], [1, 1, 1]) == 8.0


def test_weighted_median_skews_to_heavy_value():
    # The heavy weight on 9.0 pulls the median up to it.
    assert _weighted_median([7.0, 9.0], [1, 3]) == 9.0


def test_weighted_median_empty_raises():
    with pytest.raises(ValueError):
        _weighted_median([], [])


def test_recent_years_weigh_more():
    records = [
        {"year": 2021, "median_cg": 7.0},
        {"year": 2022, "median_cg": 7.2},
        {"year": 2023, "median_cg": 7.4},
        {"year": 2024, "median_cg": 7.6},
        {"year": 2025, "median_cg": 9.0},  # most recent -> highest weight
    ]
    result = predict_cutoff(records, current_year=2025, company="Acme", offer_type="placement")
    assert result["basis"] == "company_history"
    assert result["sample_size"] == 5
    # Weighted median must sit above the unweighted median (7.4),
    # pulled toward the recent 9.0.
    assert result["expected_cutoff"] > 7.4


def test_band_brackets_expected_and_is_sane():
    records = [
        {"year": 2022, "median_cg": 7.0, "p25": 6.8, "p75": 7.3},
        {"year": 2023, "median_cg": 7.5, "p25": 7.2, "p75": 7.8},
        {"year": 2024, "median_cg": 8.0, "p25": 7.7, "p75": 8.2},
    ]
    result = predict_cutoff(records, current_year=2025, company="Acme", offer_type="ps2")
    low, high = result["band"]
    assert low <= result["expected_cutoff"] <= high
    assert 0.0 <= low <= 10.0
    assert 0.0 <= high <= 10.0


def test_single_record_still_gives_band():
    result = predict_cutoff(
        [{"year": 2024, "median_cg": 8.0}],
        current_year=2025,
        company="Acme",
        offer_type="si",
    )
    assert result["expected_cutoff"] == 8.0
    low, high = result["band"]
    assert low < 8.0 < high  # default spread kicks in


def test_cold_start_uses_sector_fallback():
    fallback = {"median_cg": 7.5, "p25": 7.0, "p75": 8.0, "sample_size": 12}
    result = predict_cutoff(
        [], current_year=2025, company="NewCo", offer_type="placement", sector_fallback=fallback
    )
    assert result["basis"] == "sector_average"
    assert result["expected_cutoff"] == 7.5
    assert result["band"] == [7.0, 8.0]
    assert result["sample_size"] == 12


def test_no_data_no_fallback_is_insufficient():
    result = predict_cutoff([], current_year=2025, company="NewCo", offer_type="ps1")
    assert result["basis"] == "insufficient_data"
    assert result["expected_cutoff"] is None
    assert result["band"] is None
    assert result["sample_size"] == 0


def test_records_missing_values_are_ignored():
    records = [
        {"year": 2023, "median_cg": None},
        {"year": None, "median_cg": 7.0},
        {"year": 2024, "median_cg": 8.0},
    ]
    result = predict_cutoff(records, current_year=2025, company="Acme", offer_type="placement")
    assert result["sample_size"] == 1
    assert result["expected_cutoff"] == 8.0


def test_sector_average_aggregation():
    rows = [
        {"median_cg": 7.0, "p25": 6.8, "p75": 7.2},
        {"median_cg": 8.0, "p25": 7.8, "p75": 8.2},
        {"median_cg": None},
    ]
    agg = sector_average(rows)
    assert agg["median_cg"] == 7.5
    assert agg["p25"] == pytest.approx(7.3)
    assert agg["p75"] == pytest.approx(7.7)
    assert agg["sample_size"] == 2
