"""
Schemas that match exactly what AsyncOptimisationRunner sends and expects back.

Spring sends:
  vehicle_id, current_soc, target_soc, battery_capacity_kwh,
  charger_limit_kw, departure_time (ISO-8601 string)

Spring expects back:
  green_score, renewable_alignment_pct, estimated_cost_inr,
  estimated_co2_kg, total_energy_kwh, best_window_start,
  best_window_end, slots[]
"""

from datetime import datetime
from decimal import Decimal
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field


class OptimizeRequest(BaseModel):
    vehicle_id: UUID
    current_soc: Decimal = Field(..., ge=0, le=100)
    target_soc: Decimal = Field(..., ge=0, le=100)
    battery_capacity_kwh: Decimal = Field(..., gt=0)
    charger_limit_kw: Decimal = Field(..., gt=0)
    departure_time: datetime  # ISO-8601 sent by Spring as Instant.toString()


class ScheduleSlot(BaseModel):
    slot_start: datetime
    slot_end: datetime
    power_kw: Decimal
    renewable_pct: Optional[Decimal] = None
    # slot_order is added by the caller when building the list


class OptimizeResponse(BaseModel):
    green_score: int = Field(..., ge=0, le=100)
    renewable_alignment_pct: Decimal
    estimated_cost_inr: Decimal
    estimated_co2_kg: Decimal
    total_energy_kwh: Decimal
    best_window_start: Optional[datetime] = None
    best_window_end: Optional[datetime] = None
    slots: list[ScheduleSlot] = []

    model_config = {"populate_by_name": True}
