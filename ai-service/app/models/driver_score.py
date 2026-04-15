# ════════════════════════════════════════════════════════════════════
# Pydantic Models — Driver Score
#
# Score formula:
#   S_d = 100 − (w₁·speeding_ratio + w₂·harsh_braking_ratio
#              + w₃·harsh_accel_ratio + w₄·idle_ratio
#              + w₅·night_driving_ratio)
#
# Each ratio is normalised to [0, 1] before weighting.
# Final score is clamped to [0, 100].
# ════════════════════════════════════════════════════════════════════

from __future__ import annotations

from pydantic import BaseModel, Field


# ─── Request ──────────────────────────────────────────────────────

class TelemetryPayload(BaseModel):
    """Aggregated telemetry metrics for one driver in a given period."""

    driver_id: str = Field(..., description="UUID of the driver")
    vehicle_id: str = Field(..., description="UUID of the vehicle")
    period_start: str = Field(
        ..., description="ISO-8601 start of the evaluation window"
    )
    period_end: str = Field(
        ..., description="ISO-8601 end of the evaluation window"
    )

    # Distances & time
    total_distance_km: float = Field(..., ge=0, description="Total distance driven (km)")
    total_driving_seconds: int = Field(..., ge=0, description="Total driving time (s)")

    # Speeding
    speeding_count: int = Field(0, ge=0, description="Number of speeding instances")
    speeding_seconds: int = Field(
        0, ge=0, description="Cumulative seconds spent speeding"
    )

    # Harsh events
    harsh_braking_count: int = Field(0, ge=0, description="Number of harsh braking events")
    harsh_acceleration_count: int = Field(
        0, ge=0, description="Number of harsh acceleration events"
    )

    # Idle
    idle_seconds: int = Field(0, ge=0, description="Cumulative idle time (s)")

    # Night driving (between 00:00-05:00)
    night_driving_seconds: int = Field(
        0, ge=0, description="Seconds driven between 00:00–05:00"
    )

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "driver_id": "d7a1e2f3-...",
                    "vehicle_id": "v9b8c7d6-...",
                    "period_start": "2026-03-01T00:00:00Z",
                    "period_end": "2026-03-07T23:59:59Z",
                    "total_distance_km": 842.5,
                    "total_driving_seconds": 36000,
                    "speeding_count": 12,
                    "speeding_seconds": 480,
                    "harsh_braking_count": 5,
                    "harsh_acceleration_count": 3,
                    "idle_seconds": 1800,
                    "night_driving_seconds": 3600,
                }
            ]
        }
    }


# ─── Component Breakdown ─────────────────────────────────────────

class ScoreComponent(BaseModel):
    """One weighted component of the driver score."""

    name: str = Field(..., description="Metric name")
    raw_ratio: float = Field(
        ...,
        ge=0.0,
        le=1.0,
        description="Normalised ratio before weighting",
    )
    weight: float = Field(..., description="Weight applied to ratio")
    penalty: float = Field(
        ...,
        ge=0.0,
        description="Weighted penalty = ratio × weight",
    )


# ─── Response ─────────────────────────────────────────────────────

class DriverScoreResponse(BaseModel):
    """Computed driver safety score with full breakdown."""

    driver_id: str
    vehicle_id: str
    period_start: str
    period_end: str
    score: float = Field(
        ...,
        ge=0.0,
        le=100.0,
        description="Final driver safety score (0–100, higher = safer)",
    )
    grade: str = Field(
        ..., description="Letter grade: A (≥90), B (≥75), C (≥60), D (≥40), F (<40)"
    )
    components: list[ScoreComponent] = Field(
        default_factory=list,
        description="Detailed breakdown of each penalty component",
    )
    recommendations: list[str] = Field(
        default_factory=list,
        description="Actionable improvement suggestions",
    )

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "driver_id": "d7a1e2f3-...",
                    "vehicle_id": "v9b8c7d6-...",
                    "period_start": "2026-03-01T00:00:00Z",
                    "period_end": "2026-03-07T23:59:59Z",
                    "score": 78.3,
                    "grade": "B",
                    "components": [
                        {
                            "name": "speeding",
                            "raw_ratio": 0.24,
                            "weight": 30.0,
                            "penalty": 7.2,
                        }
                    ],
                    "recommendations": [
                        "Speeding detected 12 times — consider enabling in-cab alerts."
                    ],
                }
            ]
        }
    }
