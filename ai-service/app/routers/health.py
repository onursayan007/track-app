# ════════════════════════════════════════════════════════════════════
# Router — Health Check
# ════════════════════════════════════════════════════════════════════

from fastapi import APIRouter
import shutil

router = APIRouter(tags=["Health"])


@router.get(
    "/health",
    summary="Liveness / readiness probe",
    response_model=dict,
)
async def health_check():
    """
    Returns service health including Tesseract availability.
    Suitable as a Kubernetes / Docker health-check endpoint.
    """
    tesseract_ok = shutil.which("tesseract") is not None

    return {
        "status": "ok",
        "service": "ai-service",
        "tesseract_available": tesseract_ok,
    }
