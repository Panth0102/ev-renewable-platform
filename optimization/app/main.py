"""
GreenCharge — Optimization Service
FastAPI application entry point.

Runs on port 8001 (configurable via $PORT).
Called by Spring's AsyncOptimisationRunner at POST /optimize.
"""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.api.routes import optimize as optimize_router
from app.api.routes import health as health_router

settings = get_settings()

logging.basicConfig(
    level=getattr(logging, settings.log_level.upper(), logging.INFO),
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("GreenCharge Optimization Service starting on %s:%s", settings.host, settings.port)
    yield
    logger.info("GreenCharge Optimization Service shutting down")


app = FastAPI(
    title="GreenCharge Optimization Service",
    description="Renewable-aware EV charging scheduler. Called internally by the Spring backend.",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# ── CORS ─────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type", "Authorization"],
)

# ── Routes ───────────────────────────────────────────────────────────────────
app.include_router(health_router.router, tags=["Health"])
app.include_router(optimize_router.router, tags=["Optimization"])


@app.get("/", include_in_schema=False)
async def root():
    return {"service": "GreenCharge Optimization", "version": "1.0.0", "docs": "/docs"}
