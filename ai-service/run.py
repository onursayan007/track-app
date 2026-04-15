"""
Uvicorn entry-point — run with:

    python -m uvicorn app.main:app --reload --port 8000

Or simply:

    python run.py
"""

import uvicorn
from app.config import get_settings


def main() -> None:
    settings = get_settings()
    uvicorn.run(
        "app.main:app",
        host=settings.host,
        port=settings.port,
        reload=True,
        log_level=settings.log_level,
    )


if __name__ == "__main__":
    main()
