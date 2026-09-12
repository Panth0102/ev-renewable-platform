"""
OptimizeService: fetches energy signals from PostgreSQL, then delegates
to the greedy optimizer algorithm.
"""

from __future__ import annotations

import asyncio
import logging
from datetime import datetime, timezone
from functools import partial

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.algorithms.greedy_optimizer import SignalRow, run_greedy_optimizer
from app.config import get_settings
from app.models.energy_signal import EnergySignal
from app.schemas.optimize import OptimizeRequest, OptimizeResponse

logger = logging.getLogger(__name__)
settings = get_settings()


class OptimizeService:
    def __init__(self, db: AsyncSession) -> None:
        self._db = db

    async def optimize(self, request: OptimizeRequest) -> OptimizeResponse:
        now = datetime.now(tz=timezone.utc)
        dep = request.departure_time
        if dep.tzinfo is None:
            dep = dep.replace(tzinfo=timezone.utc)

        signals = await self._fetch_signals(now, dep)
        logger.info(
            "Optimizing vehicle=%s | signals=%d | departure=%s",
            request.vehicle_id, len(signals), dep.isoformat(),
        )

        # Run CPU-bound optimizer in a thread so we don't block asyncio
        loop = asyncio.get_running_loop()
        result: OptimizeResponse = await loop.run_in_executor(
            None,
            partial(
                run_greedy_optimizer,
                request,
                signals,
                settings.fallback_rate_inr_kwh,
                settings.grid_co2_kg_kwh,
            ),
        )
        return result

    async def _fetch_signals(
        self, from_time: datetime, to_time: datetime
    ) -> list[SignalRow]:
        stmt = (
            select(EnergySignal)
            .where(EnergySignal.signal_time >= from_time)
            .where(EnergySignal.signal_time < to_time)
            .order_by(EnergySignal.signal_time.asc())
        )
        result = await self._db.execute(stmt)
        rows = result.scalars().all()
        return [
            SignalRow(
                signal_time=r.signal_time,
                renewable_pct=r.renewable_pct,
                electricity_price_per_kwh=r.electricity_price_per_kwh,
            )
            for r in rows
        ]
