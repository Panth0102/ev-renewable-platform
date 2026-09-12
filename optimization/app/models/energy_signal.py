from datetime import datetime
from decimal import Decimal
from typing import Optional

from sqlalchemy import BigInteger, Column, DateTime, Enum, Numeric, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import TIMESTAMP

from app.db import Base


class EnergySignal(Base):
    """
    Read-only mirror of the energy_signals table managed by the Spring backend.
    The optimization service only SELECTs from this table.
    """

    __tablename__ = "energy_signals"
    __table_args__ = (
        UniqueConstraint("signal_time", "source", name="uq_energy_signals_time_source"),
    )

    id: int = Column(BigInteger, primary_key=True, autoincrement=True)
    signal_time: datetime = Column(TIMESTAMP(timezone=True), nullable=False, index=True)
    source: str = Column(
        Enum("SOLAR", "WIND", "HYDRO", "GRID", "BATTERY", "MIXED", name="energy_source_enum"),
        nullable=False,
        default="MIXED",
    )
    renewable_pct: Decimal = Column(Numeric(5, 2), nullable=False, default=Decimal("0"))
    carbon_intensity_gco2_kwh: Optional[Decimal] = Column(Numeric(8, 2))
    electricity_price_per_kwh: Optional[Decimal] = Column(Numeric(8, 4))
    grid_load_pct: Optional[Decimal] = Column(Numeric(5, 2))
    solar_forecast_kw: Optional[Decimal] = Column(Numeric(10, 2))
    wind_forecast_kw: Optional[Decimal] = Column(Numeric(10, 2))
    fetched_at: datetime = Column(TIMESTAMP(timezone=True), nullable=False)
