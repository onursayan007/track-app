# ════════════════════════════════════════════════════════════════════
# FastAPI Dependencies — API-Key authentication guard
# ════════════════════════════════════════════════════════════════════

from fastapi import Depends, HTTPException, Security, status
from fastapi.security import APIKeyHeader

from app.config import Settings, get_settings

_api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)


async def verify_api_key(
    api_key: str | None = Security(_api_key_header),
    settings: Settings = Depends(get_settings),
) -> str:
    """
    Validate the ``X-API-Key`` header against the shared secret.
    Used to restrict access to internal endpoints called by the
    Node.js backend or other trusted services.
    """
    if not api_key or api_key != settings.ai_service_api_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing API key",
        )
    return api_key
