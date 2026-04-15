# ════════════════════════════════════════════════════════════════════
# Centralized Configuration — pydantic-settings
# ════════════════════════════════════════════════════════════════════

from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """Application settings loaded from environment / .env file."""

    # ── Auth ────────────────────────────────────────────────────
    ai_service_api_key: str = "change-me-in-production"

    # ── Node.js Backend ─────────────────────────────────────────
    backend_url: str = "http://localhost:3000"

    # ── Tesseract ───────────────────────────────────────────────
    tesseract_cmd: str | None = None  # e.g. /usr/bin/tesseract

    # ── Server ──────────────────────────────────────────────────
    host: str = "0.0.0.0"
    port: int = 8000
    log_level: str = "info"

    # ── Driver Score Weights ────────────────────────────────────
    weight_speeding: float = 30.0
    weight_harsh_braking: float = 25.0
    weight_harsh_accel: float = 20.0
    weight_idle: float = 15.0
    weight_night_driving: float = 10.0

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


@lru_cache()
def get_settings() -> Settings:
    return Settings()
