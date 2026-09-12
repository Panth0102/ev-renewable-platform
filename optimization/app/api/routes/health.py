from fastapi import APIRouter
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import Depends

from app.db import get_db

router = APIRouter()


@router.get("/health", summary="Liveness probe", tags=["Health"])
async def health():
    return {"status": "ok", "service": "optimization"}


@router.get("/health/db", summary="DB connectivity check", tags=["Health"])
async def health_db(db: AsyncSession = Depends(get_db)):
    try:
        await db.execute(text("SELECT 1"))
        return {"status": "ok", "db": "connected"}
    except Exception as exc:
        return {"status": "error", "db": str(exc)}
