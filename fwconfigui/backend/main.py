"""FastAPI application entrypoint."""

import logging
import uvicorn
from contextlib import asynccontextmanager
from pathlib import Path

try:
    from dotenv import load_dotenv

    load_dotenv()
except Exception:
    pass

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from backend.config.settings import settings
from backend.exceptions.handlers import register_exception_handlers
from backend.routers.business_purpose import router as business_purpose_router
from backend.routers.components import router as components_router
from backend.routers.env import router as env_router
from backend.routers.fwrules import router as fwrules_router
from backend.routers.keywords import router as keywords_router
from backend.routers.networkareas import router as networkareas_router
from backend.routers.port_protocol import router as port_protocol_router
from backend.routers.rule_files import router as rule_files_router
from backend.routers.sites import router as sites_router
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
app.include_router(fwrules_router)
app.include_router(keywords_router)
app.include_router(port_protocol_router)
app.include_router(env_router)
app.include_router(business_purpose_router)
app.include_router(components_router)
app.include_router(rule_files_router)
app.include_router(networkareas_router)
app.include_router(sites_router)

app.mount(
    "/static",
    StaticFiles(directory=str(FRONTEND_DIR), html=False),
    name="static",
)

INDEX_HTML = FRONTEND_DIR / "index.html"


@app.get("/", include_in_schema=False)
def frontend_index():
    return FileResponse(INDEX_HTML)


@app.get("/{full_path:path}", include_in_schema=False)
def frontend_spa_fallback(full_path: str):
    # Let API and static routes behave normally; everything else is a SPA route.
    if full_path.startswith("api") or full_path.startswith("static"):
        return FileResponse(INDEX_HTML)
    return FileResponse(INDEX_HTML)


if __name__ == "__main__":

    uvicorn.run(
        app,
        host="localhost",
        port=8099,
        reload=False,
        timeout_keep_alive=300,  # default 5s
        limit_concurrency=1000  # optional: don’t reject parallel requests
    ) 
