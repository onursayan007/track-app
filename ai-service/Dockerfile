# ════════════════════════════════════════════════════════════════════
# Dockerfile — Fleet AI Microservice
# Multi-stage: slim Python 3.12 + Tesseract OCR
# ════════════════════════════════════════════════════════════════════

FROM python:3.12-slim AS base

# ── System dependencies (Tesseract + OpenCV headless deps) ───────
RUN apt-get update && apt-get install -y --no-install-recommends \
        tesseract-ocr \
        tesseract-ocr-tur \
        tesseract-ocr-eng \
        libglib2.0-0 \
        libsm6 \
        libxext6 \
        libxrender1 \
        libgl1-mesa-glx \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# ── Python dependencies ──────────────────────────────────────────
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# ── Application code ─────────────────────────────────────────────
COPY . .

# ── Runtime ──────────────────────────────────────────────────────
ENV HOST=0.0.0.0
ENV PORT=8000

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "2"]
