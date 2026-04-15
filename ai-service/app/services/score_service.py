# ════════════════════════════════════════════════════════════════════
# Driver Score Service
#
# Formula:
#   S_d = 100 − Σ(wᵢ · ratio_i)       (clamped to [0, 100])
#
# Components (each normalised to 0–1):
#   speeding_ratio        = speeding_seconds / total_driving_seconds
#   harsh_braking_ratio   = min(harsh_braking_count / expected, 1)
#   harsh_accel_ratio     = min(harsh_accel_count / expected, 1)
#   idle_ratio            = idle_seconds / total_driving_seconds
#   night_driving_ratio   = night_driving_seconds / total_driving_seconds
#
# "expected" thresholds are per-100 km benchmarks.
# ════════════════════════════════════════════════════════════════════

from __future__ import annotations

from app.config import get_settings
from app.models.driver_score import (
    DriverScoreResponse,
    ScoreComponent,
    TelemetryPayload,
)

# ── Benchmark constants (events per 100 km for "typical bad" driver) ─
_HARSH_BRAKE_PER_100KM = 20.0
_HARSH_ACCEL_PER_100KM = 15.0


def _safe_ratio(numerator: float, denominator: float) -> float:
    """Compute ratio clamped to [0, 1]; returns 0 if denominator is zero."""
    if denominator <= 0:
        return 0.0
    return min(numerator / denominator, 1.0)


def _grade(score: float) -> str:
    if score >= 90:
        return "A"
    if score >= 75:
        return "B"
    if score >= 60:
        return "C"
    if score >= 40:
        return "D"
    return "F"


def _recommendations(components: list[ScoreComponent], payload: TelemetryPayload) -> list[str]:
    """Generate actionable improvement suggestions based on dominant penalties."""
    tips: list[str] = []
    sorted_c = sorted(components, key=lambda c: c.penalty, reverse=True)

    for c in sorted_c:
        if c.penalty < 1.0:
            continue  # negligible

        if c.name == "speeding":
            tips.append(
                f"Speeding detected {payload.speeding_count} times "
                f"({payload.speeding_seconds}s total) — consider enabling "
                "in-cab speed alerts or reducing route speed limits."
            )
        elif c.name == "harsh_braking":
            tips.append(
                f"Harsh braking occurred {payload.harsh_braking_count} times — "
                "maintain greater following distance and anticipate stops."
            )
        elif c.name == "harsh_acceleration":
            tips.append(
                f"Harsh acceleration occurred {payload.harsh_acceleration_count} "
                "times — adopt smoother throttle control for passenger comfort."
            )
        elif c.name == "idle":
            idle_min = payload.idle_seconds / 60
            tips.append(
                f"Excessive idle time ({idle_min:.0f} min) — "
                "implement automatic engine-off policy after 3 minutes."
            )
        elif c.name == "night_driving":
            night_min = payload.night_driving_seconds / 60
            tips.append(
                f"Night driving ({night_min:.0f} min between 00:00–05:00) — "
                "ensure adequate rest periods and consider shift rotation."
            )

    return tips


# ─── Public API ──────────────────────────────────────────────────

def compute_driver_score(payload: TelemetryPayload) -> DriverScoreResponse:
    """
    Compute the driver safety score from aggregated telemetry metrics.
    """
    settings = get_settings()

    driving_secs = payload.total_driving_seconds
    dist_km = payload.total_distance_km

    # ── Normalised ratios ────────────────────────────────────────
    speeding_ratio = _safe_ratio(payload.speeding_seconds, driving_secs)

    expected_brakes = (dist_km / 100.0) * _HARSH_BRAKE_PER_100KM if dist_km else 1
    harsh_braking_ratio = _safe_ratio(payload.harsh_braking_count, expected_brakes)

    expected_accel = (dist_km / 100.0) * _HARSH_ACCEL_PER_100KM if dist_km else 1
    harsh_accel_ratio = _safe_ratio(payload.harsh_acceleration_count, expected_accel)

    idle_ratio = _safe_ratio(payload.idle_seconds, driving_secs)
    night_ratio = _safe_ratio(payload.night_driving_seconds, driving_secs)

    # ── Weighted penalties ───────────────────────────────────────
    components = [
        ScoreComponent(
            name="speeding",
            raw_ratio=round(speeding_ratio, 4),
            weight=settings.weight_speeding,
            penalty=round(speeding_ratio * settings.weight_speeding, 2),
        ),
        ScoreComponent(
            name="harsh_braking",
            raw_ratio=round(harsh_braking_ratio, 4),
            weight=settings.weight_harsh_braking,
            penalty=round(harsh_braking_ratio * settings.weight_harsh_braking, 2),
        ),
        ScoreComponent(
            name="harsh_acceleration",
            raw_ratio=round(harsh_accel_ratio, 4),
            weight=settings.weight_harsh_accel,
            penalty=round(harsh_accel_ratio * settings.weight_harsh_accel, 2),
        ),
        ScoreComponent(
            name="idle",
            raw_ratio=round(idle_ratio, 4),
            weight=settings.weight_idle,
            penalty=round(idle_ratio * settings.weight_idle, 2),
        ),
        ScoreComponent(
            name="night_driving",
            raw_ratio=round(night_ratio, 4),
            weight=settings.weight_night_driving,
            penalty=round(night_ratio * settings.weight_night_driving, 2),
        ),
    ]

    total_penalty = sum(c.penalty for c in components)
    score = max(0.0, min(100.0, 100.0 - total_penalty))
    score = round(score, 1)

    return DriverScoreResponse(
        driver_id=payload.driver_id,
        vehicle_id=payload.vehicle_id,
        period_start=payload.period_start,
        period_end=payload.period_end,
        score=score,
        grade=_grade(score),
        components=components,
        recommendations=_recommendations(components, payload),
    )
