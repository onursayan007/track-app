# ════════════════════════════════════════════════════════════════════
# Router — Driver Score
# ════════════════════════════════════════════════════════════════════

from fastapi import APIRouter, Depends, status

from app.dependencies import verify_api_key
from app.models.driver_score import DriverScoreResponse, TelemetryPayload
from app.services.score_service import compute_driver_score

router = APIRouter(
    prefix="/driver-score",
    tags=["Driver Score"],
    dependencies=[Depends(verify_api_key)],
)


@router.post(
    "/compute",
    response_model=DriverScoreResponse,
    status_code=status.HTTP_200_OK,
    summary="Compute Driver Safety Score from telemetry metrics",
    description=(
        "Accepts aggregated telemetry data for a driver over a time period "
        "and returns a safety score **S_d ∈ [0, 100]** with a full "
        "component breakdown and actionable recommendations.\n\n"
        "**Formula:** `S_d = 100 − Σ(wᵢ · ratioᵢ)`\n\n"
        "Components: speeding, harsh braking, harsh acceleration, "
        "idle time, night driving."
    ),
)
async def calculate_driver_score(
    payload: TelemetryPayload,
) -> DriverScoreResponse:
    return compute_driver_score(payload)
