# ════════════════════════════════════════════════════════════════════
# AI / Analytics Microservice — FastAPI Application
# ════════════════════════════════════════════════════════════════════

from contextlib import asynccontextmanager

import structlog
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import get_settings
from app.routers import health, ocr, driver_score
from app.mcp.manifest import router as mcp_router

logger = structlog.get_logger()


# ─── Lifespan (startup / shutdown) ───────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = get_settings()
    logger.info(
        "ai-service starting",
        host=settings.host,
        port=settings.port,
        backend_url=settings.backend_url,
    )
    yield
    logger.info("ai-service shutting down")


# ─── App Factory ─────────────────────────────────────────────────

app = FastAPI(
    title="Fleet AI Service",
    description=(
        "Python micro-service for heavy AI / analytical processing, "
        "decoupled from the main Node.js backend.\n\n"
        "**Capabilities:**\n"
        "- Vehicle Registration (Ruhsat) OCR → Plate, VIN, Model\n"
        "- Driver Safety Score computation from telemetry metrics\n\n"
        "**Auth:** Include `X-API-Key` header with the shared secret.\n\n"
        "**MCP:** AI agents can discover tools at `/.well-known/mcp.json`."
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan,
)


# ─── Middleware ───────────────────────────────────────────────────

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],           # lock down in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── Global Exception Handler ────────────────────────────────────

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error("unhandled_exception", path=request.url.path, error=str(exc))
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "Internal server error"},
    )


# ─── Register Routers ────────────────────────────────────────────

# Public
app.include_router(health.router, prefix="/api/v1")
app.include_router(mcp_router)  # /.well-known/mcp.json  (no prefix)

# Protected (X-API-Key guarded)
app.include_router(ocr.router, prefix="/api/v1")
app.include_router(driver_score.router, prefix="/api/v1")


# ─── Root ─────────────────────────────────────────────────────────

@app.get("/", include_in_schema=False)
async def root():
    return {
        "service": "fleet-ai-service",
        "docs": "/docs",
        "mcp": "/.well-known/mcp.json",
    }
