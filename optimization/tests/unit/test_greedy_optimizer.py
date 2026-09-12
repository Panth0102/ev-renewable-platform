"""Unit tests for the greedy optimizer algorithm (no DB required)."""

from datetime import datetime, timezone, timedelta
from decimal import Decimal

import pytest

from app.algorithms.greedy_optimizer import SignalRow, run_greedy_optimizer
from app.schemas.optimize import OptimizeRequest


def _req(**overrides) -> OptimizeRequest:
    defaults = dict(
        vehicle_id="00000000-0000-0000-0000-000000000001",
        current_soc=Decimal("20"),
        target_soc=Decimal("80"),
        battery_capacity_kwh=Decimal("60"),
        charger_limit_kw=Decimal("22"),
        departure_time=datetime.now(tz=timezone.utc) + timedelta(hours=6),
    )
    defaults.update(overrides)
    return OptimizeRequest(**defaults)


def _signals(n: int = 4, base_renewable: float = 50.0) -> list[SignalRow]:
    now = datetime.now(tz=timezone.utc).replace(minute=0, second=0, microsecond=0)
    return [
        SignalRow(
            signal_time=now + timedelta(hours=i),
            renewable_pct=Decimal(str(base_renewable + i * 5)),
            electricity_price_per_kwh=Decimal("8.00"),
        )
        for i in range(n)
    ]


class TestGreedyOptimizer:
    def test_returns_response(self):
        result = run_greedy_optimizer(_req(), _signals())
        assert result is not None

    def test_green_score_in_range(self):
        result = run_greedy_optimizer(_req(), _signals())
        assert 0 <= result.green_score <= 100

    def test_total_energy_positive(self):
        result = run_greedy_optimizer(_req(), _signals())
        assert result.total_energy_kwh > 0

    def test_cost_positive(self):
        result = run_greedy_optimizer(_req(), _signals())
        assert result.estimated_cost_inr > 0

    def test_slots_cover_energy_needed(self):
        req = _req(current_soc=Decimal("20"), target_soc=Decimal("40"),
                   battery_capacity_kwh=Decimal("60"), charger_limit_kw=Decimal("22"))
        # 20% of 60 kWh = 12 kWh needed
        result = run_greedy_optimizer(req, _signals(8))
        total_slot_energy = sum(float(s.power_kw) for s in result.slots)
        assert abs(total_slot_energy - 12.0) < 0.5  # within 0.5 kWh tolerance

    def test_high_renewable_gives_good_score(self):
        result = run_greedy_optimizer(_req(), _signals(6, base_renewable=90.0))
        assert result.green_score >= 60

    def test_fallback_when_no_signals(self):
        """With no signals, should still return a valid result (immediate schedule)."""
        result = run_greedy_optimizer(_req(), [])
        assert result.total_energy_kwh > 0
        assert len(result.slots) >= 1

    def test_best_window_is_set(self):
        result = run_greedy_optimizer(_req(), _signals(4))
        assert result.best_window_start is not None
        assert result.best_window_end is not None

    def test_slots_sorted_by_time(self):
        result = run_greedy_optimizer(_req(), _signals(6))
        times = [s.slot_start for s in result.slots]
        assert times == sorted(times)

    def test_fallback_rate_used_when_no_price(self):
        signals_no_price = [
            SignalRow(
                signal_time=datetime.now(tz=timezone.utc) + timedelta(hours=i),
                renewable_pct=Decimal("60"),
                electricity_price_per_kwh=None,
            )
            for i in range(4)
        ]
        result = run_greedy_optimizer(_req(), signals_no_price, fallback_rate=10.0)
        # With rate 10 and some energy, cost should be > 0
        assert result.estimated_cost_inr > 0
