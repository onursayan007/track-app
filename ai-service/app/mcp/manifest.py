# ════════════════════════════════════════════════════════════════════
# Model Context Protocol (MCP) — Tool Manifest & Discovery Router
#
# Exposes a /.well-known/mcp.json manifest that external AI agents
# can fetch to discover available tools, their input/output schemas,
# and authentication requirements.
#
# Spec reference: https://modelcontextprotocol.io/specification
# ════════════════════════════════════════════════════════════════════

from __future__ import annotations

from fastapi import APIRouter
from fastapi.responses import JSONResponse

router = APIRouter(tags=["MCP"])

# ─── Tool Definitions ────────────────────────────────────────────

_MCP_MANIFEST = {
    "schema_version": "v1",
    "name_for_human": "Fleet AI Service",
    "name_for_model": "fleet_ai_service",
    "description_for_human": (
        "AI-powered analytics for fleet management: vehicle registration OCR "
        "and driver safety scoring from telemetry data."
    ),
    "description_for_model": (
        "Provides two analytical tools for a fleet-tracking SaaS platform. "
        "Tool 1: OCR on Turkish vehicle registration images returning plate, "
        "VIN, model. Tool 2: Driver safety score computed from telemetry "
        "metrics (speeding, harsh braking, acceleration, idle, night driving). "
        "Both tools require an X-API-Key header for authentication."
    ),
    "auth": {
        "type": "service_http",
        "authorization_type": "api_key",
        "api_key_header": "X-API-Key",
        "instructions": (
            "Include the shared API key in the X-API-Key header. "
            "Obtain the key from the platform administrator."
        ),
    },
    "api": {
        "type": "openapi",
        "url": "/openapi.json",
        "is_user_authenticated": False,
    },
    "tools": [
        {
            "name": "ocr_vehicle_registration",
            "description": (
                "Extract structured data (plate, VIN, model, owner, date) "
                "from a Turkish vehicle registration (Ruhsat) image using "
                "computer vision and OCR. Returns per-field confidence scores."
            ),
            "endpoint": "/api/v1/ocr/vehicle-registration",
            "method": "POST",
            "content_type": "multipart/form-data",
            "parameters": {
                "type": "object",
                "required": ["file"],
                "properties": {
                    "file": {
                        "type": "string",
                        "format": "binary",
                        "description": (
                            "Image file of a vehicle registration document. "
                            "Accepted formats: JPEG, PNG, WebP, TIFF, BMP. Max 10 MB."
                        ),
                    }
                },
            },
            "returns": {
                "type": "object",
                "properties": {
                    "plate": {
                        "type": "object",
                        "properties": {
                            "value": {"type": "string", "description": "Licence plate e.g. 34 ABC 1234"},
                            "confidence": {"type": "number", "description": "0–1 confidence"},
                        },
                    },
                    "vin": {
                        "type": "object",
                        "properties": {
                            "value": {"type": "string", "description": "17-char VIN"},
                            "confidence": {"type": "number"},
                        },
                    },
                    "model": {
                        "type": "object",
                        "properties": {
                            "value": {"type": "string", "description": "Brand + model"},
                            "confidence": {"type": "number"},
                        },
                    },
                    "owner_name": {
                        "type": "object",
                        "properties": {
                            "value": {"type": "string"},
                            "confidence": {"type": "number"},
                        },
                    },
                    "registration_date": {
                        "type": "object",
                        "properties": {
                            "value": {"type": "string"},
                            "confidence": {"type": "number"},
                        },
                    },
                    "raw_text": {"type": "string"},
                    "processing_time_ms": {"type": "number"},
                },
            },
        },
        {
            "name": "compute_driver_score",
            "description": (
                "Compute a driver safety score S_d ∈ [0,100] from aggregated "
                "telemetry metrics. Higher = safer. Includes component breakdown "
                "(speeding, harsh braking, harsh acceleration, idle time, "
                "night driving) and actionable recommendations."
            ),
            "endpoint": "/api/v1/driver-score/compute",
            "method": "POST",
            "content_type": "application/json",
            "parameters": {
                "type": "object",
                "required": [
                    "driver_id",
                    "vehicle_id",
                    "period_start",
                    "period_end",
                    "total_distance_km",
                    "total_driving_seconds",
                ],
                "properties": {
                    "driver_id": {"type": "string", "description": "UUID of the driver"},
                    "vehicle_id": {"type": "string", "description": "UUID of the vehicle"},
                    "period_start": {"type": "string", "format": "date-time"},
                    "period_end": {"type": "string", "format": "date-time"},
                    "total_distance_km": {"type": "number", "minimum": 0},
                    "total_driving_seconds": {"type": "integer", "minimum": 0},
                    "speeding_count": {"type": "integer", "minimum": 0, "default": 0},
                    "speeding_seconds": {"type": "integer", "minimum": 0, "default": 0},
                    "harsh_braking_count": {"type": "integer", "minimum": 0, "default": 0},
                    "harsh_acceleration_count": {"type": "integer", "minimum": 0, "default": 0},
                    "idle_seconds": {"type": "integer", "minimum": 0, "default": 0},
                    "night_driving_seconds": {"type": "integer", "minimum": 0, "default": 0},
                },
            },
            "returns": {
                "type": "object",
                "properties": {
                    "score": {"type": "number", "description": "Safety score 0–100"},
                    "grade": {"type": "string", "description": "A/B/C/D/F"},
                    "components": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "properties": {
                                "name": {"type": "string"},
                                "raw_ratio": {"type": "number"},
                                "weight": {"type": "number"},
                                "penalty": {"type": "number"},
                            },
                        },
                    },
                    "recommendations": {
                        "type": "array",
                        "items": {"type": "string"},
                    },
                },
            },
        },
    ],
    "logo_url": None,
    "contact_email": "admin@servisimgeliyor.com",
    "legal_info_url": None,
}


# ─── Endpoints ───────────────────────────────────────────────────

@router.get(
    "/.well-known/mcp.json",
    summary="MCP Tool Manifest",
    description=(
        "Model Context Protocol discovery endpoint. AI agents fetch this "
        "manifest to learn about available tools, their schemas, and auth."
    ),
    response_class=JSONResponse,
)
async def mcp_manifest():
    return JSONResponse(
        content=_MCP_MANIFEST,
        headers={"Cache-Control": "public, max-age=3600"},
    )


@router.get(
    "/.well-known/mcp/tools",
    summary="List MCP Tools",
    description="Returns only the tools array for agents that query tools separately.",
    response_class=JSONResponse,
)
async def mcp_tools():
    return JSONResponse(content={"tools": _MCP_MANIFEST["tools"]})
