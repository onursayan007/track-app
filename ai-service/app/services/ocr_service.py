# ════════════════════════════════════════════════════════════════════
# OCR Service — Vehicle Registration / Ruhsat Image → Structured Data
#
# Pipeline:
#   1. Receive raw image bytes
#   2. OpenCV pre-processing (greyscale, adaptive threshold, denoise)
#   3. Tesseract OCR (Turkish + English)
#   4. Regex-based field extraction (plate, VIN, model, owner, date)
#   5. Confidence estimation per field
# ════════════════════════════════════════════════════════════════════

from __future__ import annotations

import io
import re
import time
from typing import Tuple

import cv2
import numpy as np
import pytesseract
from PIL import Image

from app.config import get_settings
from app.models.ocr import OcrResponse, OcrResultField

# ── Configure Tesseract path if provided ────────────────────────
_settings = get_settings()
if _settings.tesseract_cmd:
    pytesseract.pytesseract.tesseract_cmd = _settings.tesseract_cmd


# ─── Image Pre-Processing ────────────────────────────────────────

def _preprocess(raw_bytes: bytes) -> np.ndarray:
    """
    Convert raw image bytes to an OpenCV matrix optimised for OCR:
    greyscale → resize → bilateral filter → adaptive threshold.
    """
    # Decode image
    nparr = np.frombuffer(raw_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if img is None:
        raise ValueError("Could not decode image — unsupported format")

    # Convert to greyscale
    grey = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    # Upscale small images for better OCR  (target ≥ 1500 px width)
    h, w = grey.shape[:2]
    if w < 1500:
        scale = 1500 / w
        grey = cv2.resize(
            grey, None, fx=scale, fy=scale, interpolation=cv2.INTER_CUBIC
        )

    # Noise reduction while preserving edges
    grey = cv2.bilateralFilter(grey, 11, 17, 17)

    # Adaptive thresholding for varying lighting conditions
    binary = cv2.adaptiveThreshold(
        grey, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 31, 7
    )

    return binary


# ─── Field Extraction Patterns ───────────────────────────────────

# Turkish vehicle plate: 01 A 0001 .. 81 ZZZ 9999
_PLATE_RE = re.compile(
    r"\b(\d{2})\s*([A-Z]{1,3})\s*(\d{2,4})\b"
)

# ISO 3779 VIN: exactly 17 alphanumeric (excluding I, O, Q)
_VIN_RE = re.compile(
    r"\b([A-HJ-NPR-Z0-9]{17})\b"
)

# Registration date: DD.MM.YYYY or DD/MM/YYYY
_DATE_RE = re.compile(
    r"\b(\d{2}[./]\d{2}[./]\d{4})\b"
)

# Common Turkish "Ruhsat" labels adjacent to values
_LABEL_PATTERNS: dict[str, list[str]] = {
    "plate": ["PLAKA", "TESCIL PLAKASI", "PLAKASI"],
    "model": ["MARKASI", "MARKA", "MODEL", "TICARI ADI", "TİCARİ ADI"],
    "owner": ["ADI SOYADI", "SAHIBI", "ADI VE SOYADI"],
    "vin": ["ŞASI NO", "SASI NO", "VIN", "ŞASI NUMARASI"],
    "date": ["TESCİL TARİHİ", "TESCIL TARIHI", "İLK TESCİL"],
}


def _extract_near_label(
    text: str, labels: list[str], fallback_re: re.Pattern | None = None
) -> Tuple[str | None, float]:
    """
    Search for a value adjacent to a known label in the OCR text.
    Returns (value, confidence).
    """
    lines = text.upper().splitlines()
    for idx, line in enumerate(lines):
        for label in labels:
            if label in line:
                # Try to grab value from same line after the colon / label
                after = line.split(label, 1)[1].strip(" :;-–—")
                if after:
                    return after.strip(), 0.85

                # Try next line
                if idx + 1 < len(lines):
                    next_line = lines[idx + 1].strip()
                    if next_line:
                        return next_line, 0.75

    # Fallback: regex search across full text
    if fallback_re:
        m = fallback_re.search(text.upper())
        if m:
            return m.group(0).strip(), 0.60

    return None, 0.0


# ─── Public API ──────────────────────────────────────────────────

async def process_registration_image(raw_bytes: bytes) -> OcrResponse:
    """
    Run the full OCR pipeline on a vehicle registration (Ruhsat) image.
    """
    t0 = time.perf_counter()

    # 1. Pre-process
    processed = _preprocess(raw_bytes)

    # 2. Tesseract OCR  (Turkish + English)
    pil_img = Image.fromarray(processed)
    raw_text: str = pytesseract.image_to_string(pil_img, lang="tur+eng")

    # Build per-character confidence data
    data = pytesseract.image_to_data(pil_img, lang="tur+eng", output_type=pytesseract.Output.DICT)
    confidences = [int(c) for c in data["conf"] if int(c) > 0]
    avg_conf = (sum(confidences) / len(confidences) / 100.0) if confidences else 0.0

    # 3. Extract fields
    plate_val, plate_conf = _extract_near_label(
        raw_text, _LABEL_PATTERNS["plate"], _PLATE_RE
    )
    vin_val, vin_conf = _extract_near_label(
        raw_text, _LABEL_PATTERNS["vin"], _VIN_RE
    )
    model_val, model_conf = _extract_near_label(
        raw_text, _LABEL_PATTERNS["model"]
    )
    owner_val, owner_conf = _extract_near_label(
        raw_text, _LABEL_PATTERNS["owner"]
    )
    date_val, date_conf = _extract_near_label(
        raw_text, _LABEL_PATTERNS["date"], _DATE_RE
    )

    # Clean plate format:  "34 ABC 1234" normalisation
    if plate_val:
        m = _PLATE_RE.search(plate_val)
        if m:
            plate_val = f"{m.group(1)} {m.group(2)} {m.group(3)}"
            plate_conf = max(plate_conf, 0.70)

    elapsed_ms = (time.perf_counter() - t0) * 1000.0

    return OcrResponse(
        plate=OcrResultField(value=plate_val, confidence=round(plate_conf, 3)),
        vin=OcrResultField(value=vin_val, confidence=round(vin_conf, 3)),
        model=OcrResultField(value=model_val, confidence=round(model_conf, 3)),
        owner_name=OcrResultField(value=owner_val, confidence=round(owner_conf, 3)),
        registration_date=OcrResultField(value=date_val, confidence=round(date_conf, 3)),
        raw_text=raw_text,
        processing_time_ms=round(elapsed_ms, 1),
    )
