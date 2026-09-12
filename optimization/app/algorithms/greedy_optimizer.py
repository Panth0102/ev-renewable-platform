"""
Greedy renewable-first charging optimizer.

Strategy
--------
1. Fetch hourly EnergySignal rows between now and the departure time.
2. Sort slots by renewable_pct descending (charge when the grid is greenest).
3. Allocate charger power greedily until the required energy is filled.
4. Compute summary metrics and return an OptimizeResponse.

This runs synchronously inside a threadpool executor so it doesn't block
the asyncio event loop.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timezone, timedelta
from decimal import Decimal, ROUND_HALF_UP
from typing import Optional

from app.schemas.optimize import OptimizeRequest, OptimizeResponse, ScheduleSlot


TWO   = Decimal("0.01")
THREE = Decimal("0.001")


@dataclass
class SignalRow:
    signal_time: datetime
    renewable_pct: Decimal
    electricity_price_per_kwh: Optional[Decimal]


def run_greedy_optimizer(
    request: OptimizeRequest,
    signals: list[SignalRow],
    fallback_rate: float = 8.5,
    grid_co2_kg_kwh: float = 0.82,
) -> OptimizeResponse:
    """
    Pure function — no I/O. Receives pre-fetched signal rows.

    Parameters
    ----------
    request         : validated OptimizeRequest from the HTTP layer
    signals         : EnergySignal rows between now and departure, ordered by signal_time ASC
    fallback_rate   : ₹/kWh used when signal has no price data
    grid_co2_kg_kwh : kg CO₂ per kWh of non-renewable grid energy
    """
    now = datetime.now(tz=timezone.utc)

    soc_needed   = float(request.target_soc - request.current_soc)
    battery_kwh  = (soc_needed / 100.0) * float(request.battery_capacity_kwh)
    charger_kw   = float(request.charger_limit_kw)
    dep_time     = request.departure_time.replace(tzinfo=timezone.utc) \
                   if request.departure_time.tzinfo is None \
                   else request.departure_time

    hours_until_departure = max(0.0, (dep_time - now).total_seconds() / 3600.0)

    # ── Sort by renewable % descending (greedy: charge when greenest) ──
    ranked = sorted(signals, key=lambda s: float(s.renewable_pct), reverse=True)

    slots: list[ScheduleSlot] = []
    # Keep original index so we can sort by time at the end
    ranked_with_idx = [(s, signals.index(s)) for s in ranked]

    remaining      = battery_kwh
    total_energy   = 0.0
    total_renewable = 0.0
    total_cost     = 0.0
    best_start: Optional[datetime] = None
    best_end:   Optional[datetime] = None
    best_renew = -1.0

    for signal, orig_idx in ranked_with_idx:
        if remaining <= 0:
            break

        power = min(charger_kw, remaining)
        remaining       -= power
        total_energy    += power
        renew_pct        = float(signal.renewable_pct)
        total_renewable += power * renew_pct

        rate = float(signal.electricity_price_per_kwh) \
               if signal.electricity_price_per_kwh else fallback_rate
        total_cost += power * rate

        if renew_pct > best_renew:
            best_renew = renew_pct
            best_start = signal.signal_time
            best_end   = signal.signal_time + timedelta(hours=1)

        slots.append(
            _make_slot(signal, power, orig_idx)
        )

    # ── Fallback: no signals available, schedule immediately ─────────
    if not slots and hours_until_departure > 0:
        power = min(charger_kw, battery_kwh)
        slots.append(ScheduleSlot(
            slot_start=now,
            slot_end=now + timedelta(hours=1),
            power_kw=Decimal(power).quantize(TWO, rounding=ROUND_HALF_UP),
            renewable_pct=Decimal("0"),
        ))
        total_energy = battery_kwh
        total_cost   = battery_kwh * fallback_rate
        best_start   = now
        best_end     = now + timedelta(hours=1)

    # Sort output slots by wall-clock time
    slots.sort(key=lambda s: s.slot_start)

    # ── Metrics ──────────────────────────────────────────────────────
    renew_align  = (total_renewable / total_energy) if total_energy > 0 else 0.0
    co2_kg       = total_energy * (1.0 - renew_align / 100.0) * grid_co2_kg_kwh

    # Green score:
    #   60% from renewable alignment (0–100 scale → 0–60 pts)
    #   20 pts time buffer bonus (>3 h to departure)
    #   10 pts base
    #   capped at 100
    time_bonus = 20 if hours_until_departure > 3 else 10
    green_score = min(100, int(renew_align * 0.6 + time_bonus + 10))

    return OptimizeResponse(
        green_score=green_score,
        renewable_alignment_pct=Decimal(renew_align).quantize(TWO,  rounding=ROUND_HALF_UP),
        estimated_cost_inr=     Decimal(total_cost).quantize(TWO,   rounding=ROUND_HALF_UP),
        estimated_co2_kg=       Decimal(co2_kg).quantize(THREE,     rounding=ROUND_HALF_UP),
        total_energy_kwh=       Decimal(total_energy).quantize(THREE, rounding=ROUND_HALF_UP),
        best_window_start=best_start,
        best_window_end=best_end,
        slots=slots,
    )


def _make_slot(signal: SignalRow, power: float, order: int) -> ScheduleSlot:
    return ScheduleSlot(
        slot_start=signal.signal_time,
        slot_end=signal.signal_time + timedelta(hours=1),
        power_kw=Decimal(power).quantize(TWO, rounding=ROUND_HALF_UP),
        renewable_pct=signal.renewable_pct,
    )
