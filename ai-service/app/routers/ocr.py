# ════════════════════════════════════════════════════════════════════
# Router — OCR (Vehicle Registration / Ruhsat)
# ════════════════════════════════════════════════════════════════════

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status

from app.dependencies import verify_api_key
from app.models.ocr import OcrResponse
from app.services.ocr_service import process_registration_image

router = APIRouter(
    prefix="/ocr",
    tags=["OCR"],
    dependencies=[Depends(verify_api_key)],
)

# 10 MB upload limit
_MAX_SIZE = 10 * 1024 * 1024

_ALLOWED_TYPES = {
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/tiff",
    "image/bmp",
}


@router.post(
    "/vehicle-registration",
    response_model=OcrResponse,
    status_code=status.HTTP_200_OK,
    summary="Extract structured data from a vehicle registration (Ruhsat) image",
    description=(
        "Upload an image of a Turkish vehicle registration document (Ruhsat). "
        "The service pre-processes the image, runs Tesseract OCR, and "
        "extracts **Plate**, **VIN**, **Model**, owner name, and registration "
        "date with per-field confidence scores."
    ),
)
async def ocr_vehicle_registration(
    file: UploadFile = File(
        ...,
        description="Image file (JPEG, PNG, WebP, TIFF, BMP) — max 10 MB",
    ),
) -> OcrResponse:
    # ── Validate content type ────────────────────────────────────
    if file.content_type not in _ALLOWED_TYPES:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"Unsupported file type: {file.content_type}. "
            f"Allowed: {', '.join(sorted(_ALLOWED_TYPES))}",
        )

    # ── Read & size-guard ────────────────────────────────────────
    raw_bytes = await file.read()
    if len(raw_bytes) > _MAX_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File too large ({len(raw_bytes)} bytes). Max: {_MAX_SIZE} bytes.",
        )

    if len(raw_bytes) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Empty file uploaded",
        )

    # ── Process ──────────────────────────────────────────────────
    try:
        result = await process_registration_image(raw_bytes)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(exc),
        )

    return result
