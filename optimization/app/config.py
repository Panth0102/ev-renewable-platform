from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # Server
    port: int = 8001
    host: str = "0.0.0.0"
    env: str = "development"
    workers: int = 1

    # Database (async)
    database_url: str = "postgresql+asyncpg://ev_user:ev_secure_pass_2026@localhost:5432/ev_renewable_db"
    database_sync_url: str = "postgresql://ev_user:ev_secure_pass_2026@localhost:5432/ev_renewable_db"

    # Algorithm
    optimization_max_iterations: int = 1000
    optimization_timeout_seconds: int = 30

    # CORS
    cors_origins: str = "http://localhost:5173,http://localhost:8080"

    # Logging
    log_level: str = "INFO"

    # Fallback electricity rate (₹/kWh) used when energy_signals table has no price data
    fallback_rate_inr_kwh: float = 8.5
    # Grid CO₂ intensity (kg CO₂ / kWh) — Indian average
    grid_co2_kg_kwh: float = 0.82

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    class Config:
        env_file = ".env"
        extra = "ignore"


@lru_cache
def get_settings() -> Settings:
    return Settings()
