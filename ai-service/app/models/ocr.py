# ════════════════════════════════════════════════════════════════════
# Pydantic Models — OCR (Vehicle Registration / Ruhsat)
# ════════════════════════════════════════════════════════════════════

from __future__ import annotations

from pydantic import BaseModel, Field


class OcrResultField(BaseModel):
    """A single extracted field with confidence score."""

    value: str | None = Field(None, description="Extracted text value")
    confidence: float = Field(
        0.0, ge=0.0, le=1.0, description="OCR confidence score 0–1"
    )


class OcrResponse(BaseModel):
    """Structured result from vehicle registration OCR."""

    plate: OcrResultField = Field(
        default_factory=OcrResultField,
        description="Vehicle licence plate (e.g. 34 ABC 123)",
    )
    vin: OcrResultField = Field(
        default_factory=OcrResultField,
        description="Vehicle Identification Number (17-char ISO 3779)",
    )
    model: OcrResultField = Field(
        default_factory=OcrResultField,
        description="Vehicle brand + model (e.g. Ford Transit)",
    )
    owner_name: OcrResultField = Field(
        default_factory=OcrResultField,
        description="Registered owner full name",
    )
    registration_date: OcrResultField = Field(
        default_factory=OcrResultField,
        description="First registration date",
    )
    raw_text: str = Field("", description="Full raw OCR text for debugging")
    processing_time_ms: float = Field(
        0.0, description="Total processing duration in milliseconds"
    )

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "plate": {"value": "34 ABC 1234", "confidence": 0.96},
                    "vin": {
                        "value": "WVWZZZ3CZWE123456",
                        "confidence": 0.91,
                    },
                    "model": {"value": "Volkswagen Crafter", "confidence": 0.88},
                    "owner_name": {"value": "AHMET YILMAZ", "confidence": 0.85},
                    "registration_date": {
                        "value": "15.03.2022",
                        "confidence": 0.80,
                    },
                    "raw_text": "...",
                    "processing_time_ms": 1230.5,
                }
            ]
        }
    }
