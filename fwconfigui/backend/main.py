"""FastAPI application entrypoint."""

import logging
import uvicorn
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from backend.config.settings import settings
from backend.exceptions.handlers import register_exception_handlers
from backend.routers.fwconfig import router as fwconfig_router
from backend.utils.yaml_utils import write_yaml_dict
from backend.utils.workspace import ensure_fwconfigfiles_root

logger = logging.getLogger("uvicorn.error")

BASE_DIR = Path(__file__).resolve().parents[1]
FRONTEND_DIR = BASE_DIR / "frontend"


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("=" * 80)
    logger.info("🚀 %s v%s", settings.api_title, settings.api_version)
    logger.info("=" * 80)

    ws_root = ensure_fwconfigfiles_root()

    env_dir = ws_root / "env"
    env_dir.mkdir(parents=True, exist_ok=True)
    env_file = env_dir / "env-1.yaml"
    if not env_file.exists():
        write_yaml_dict(
            env_file,
            {
                "env-list": [
                    {"name": "lab"},
                    {"name": "dev"},
                    {"name": "ent"},
                    {"name": "pac"},
                    {"name": "rtb"},
                    {"name": "prd"},
                ]
            },
            sort_keys=False,
        )

    keywords_dir = ws_root / "keywords"
    keywords_dir.mkdir(parents=True, exist_ok=True)
    keywords_file = keywords_dir / "keywords-1.yaml"
    if not keywords_file.exists():
        write_yaml_dict(
            keywords_file,
            {
                "keywords-list": [
                    {"name": "pii"},
                    {"name": "pci"},
                    {"name": "sox"},
                ]
            },
            sort_keys=False,
        )
    yield

    logger.info("=" * 80)
    logger.info("👋 Shutting down %s", settings.api_title)
    logger.info("=" * 80)


app = FastAPI(
    title=settings.api_title,
    version=settings.api_version,
    lifespan=lifespan,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

register_exception_handlers(app)

app.include_router(fwconfig_router)

app.mount(
    "/static",
    StaticFiles(directory=str(FRONTEND_DIR), html=False),
    name="static",
)

# Serve frontend entry
app.mount(
    "/",
    StaticFiles(directory=str(FRONTEND_DIR), html=True),
    name="frontend",
)


if __name__ == "__main__":

    uvicorn.run(
        app,
        host="localhost",
        port=8099,
        reload=False,
        timeout_keep_alive=300,  # default 5s
        limit_concurrency=1000  # optional: don’t reject parallel requests
    ) 
