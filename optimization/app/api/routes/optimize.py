"""
POST /optimize — main endpoint called by AsyncOptimisationRunner in Spring.

Request body matches what Spring sends:
  vehicle_id, current_soc, target_soc, battery_capacity_kwh,
  charger_limit_kw, departure_time

Response matches what Spring's applyFastApiResult() reads:
  green_score, renewable_alignment_pct, estimated_cost_inr,
  estimated_co2_kg, total_energy_kwh, best_window_start,
  best_window_end, slots[]
"""

import logging

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db
from app.schemas.optimize import OptimizeRequest, OptimizeResponse
from app.services.optimize_service import OptimizeService

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post(
    "/optimize",
    response_model=OptimizeResponse,
    summary="Compute an optimised charging schedule for a single EV",
    status_code=status.HTTP_200_OK,
)
async def optimize(
    request: OptimizeRequest,
    db: AsyncSession = Depends(get_db),
) -> OptimizeResponse:
    try:
        service = OptimizeService(db)
        return await service.optimize(request)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc))
    except Exception as exc:
        logger.exception("Optimization failed: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Optimization engine error. The Spring built-in solver will be used as fallback.",
        )
