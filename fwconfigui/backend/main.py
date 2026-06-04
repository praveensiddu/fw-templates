"""FastAPI application entrypoint."""

import copy
import logging
import os
import uvicorn
from contextlib import asynccontextmanager
from pathlib import Path

try:
    from dotenv import load_dotenv

    load_dotenv()
except Exception:
    pass
from backend.swaggerui import attach_local_swagger

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from starlette.routing import Match
from uvicorn.config import LOGGING_CONFIG

from backend.config.settings import settings
from backend.exceptions.handlers import register_exception_handlers
from backend.routers.business_purpose import router as business_purpose_router
from backend.routers.components import router as components_router
from backend.routers.env import router as env_router
from backend.routers.fwrules import router as fwrules_router
from backend.routers.groups import router as groups_router
from backend.routers.keywords import router as keywords_router
from backend.routers.networkareas import router as networkareas_router
from backend.routers.addrs import router as addrs_router
from backend.routers.ip_inventory import router as ip_inventory_router
from backend.routers.rules import router as rules_router
from backend.routers.port_protocol import router as port_protocol_router
from backend.routers.products import router as products_router
from backend.routers.rule_files import router as rule_files_router
from backend.routers.sicg import router as sicg_router
from backend.routers.sites import router as sites_router
from backend.routers.role_mgmt_api import create_rolemgmt_router
from backend.auth.rbac import enforce_request, get_current_user_context
from backend.utils.workspace import ensure_fwconfigfiles_root

logger = logging.getLogger("uvicorn.error")

BASE_DIR = Path(__file__).resolve().parents[1]
FRONTEND_DIR = BASE_DIR / "frontend"


def _require_env_vars() -> None:
    required = ["FORTIMGR_EXTRACT_REPO", "PFC_REPO", "GENERATED_FOLDER_PREFIX"]
    missing = [k for k in required if not str(os.getenv(k, "") or "").strip()]
    if missing:
        raise RuntimeError(f"Missing required environment variable(s): {', '.join(missing)}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("=" * 80)
    logger.info("🚀 %s v%s", settings.api_title, settings.api_version)
    logger.info("=" * 80)

    _require_env_vars()
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


@app.middleware("http")
async def log_started_completed(request: Request, call_next):
    endpoint = request.scope.get("endpoint")

    if endpoint is None:
        for route in request.app.router.routes:
            match, child_scope = route.matches(request.scope)
            if match == Match.FULL:
                endpoint = child_scope.get("endpoint")
                break

    if endpoint is not None:
        endpoint_name = getattr(endpoint, "__qualname__", getattr(endpoint, "__name__", "<unknown>"))
        endpoint_mod = str(getattr(endpoint, "__module__", "") or "").strip() or "<unknown_module>"
        endpoint_filename = getattr(getattr(endpoint, "__code__", None), "co_filename", "")
        endpoint_file_label = (
            endpoint_filename.rsplit("/", 1)[-1]
            if isinstance(endpoint_filename, str) and endpoint_filename
            else "<unknown_file>"
        )
        name = f"{endpoint_mod}.{endpoint_name} [{endpoint_file_label}]"
    else:
        name = "<unknown>"

    logger.info("started %s", name)
    try:
        return await call_next(request)
    finally:
        logger.info("completed %s", name)

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
app.include_router(groups_router)
app.include_router(addrs_router)
app.include_router(ip_inventory_router)
app.include_router(rules_router)
app.include_router(networkareas_router)
app.include_router(sites_router)
app.include_router(products_router)
app.include_router(sicg_router)
app.include_router(
    create_rolemgmt_router(enforce=enforce_request, get_current_user_context=get_current_user_context),
    prefix="/api/v1",
)

app.mount(
    "/static",
    StaticFiles(directory=str(FRONTEND_DIR), html=False),
    name="static",
)

attach_local_swagger(app, route="/docs")

INDEX_HTML = FRONTEND_DIR / "index.html"


@app.get("/", include_in_schema=False)
def frontend_index():
    return FileResponse(INDEX_HTML)


@app.get("/{full_path:path}", include_in_schema=False)
def frontend_spa_fallback(full_path: str):
    # Let API and static routes behave normally; everything else is a SPA route.
    if (
        full_path.startswith("api")
        or full_path.startswith("static")
        or full_path.startswith("docs")
    ):
        raise HTTPException(status_code=404)
    return FileResponse(INDEX_HTML)


def _build_log_config() -> dict:
    cfg = copy.deepcopy(LOGGING_CONFIG)
    formatters = cfg.get("formatters") if isinstance(cfg.get("formatters"), dict) else {}

    default_fmt = "%(asctime)s %(levelprefix)s %(message)s"
    access_fmt = "%(asctime)s %(levelprefix)s %(client_addr)s - \"%(request_line)s\" %(status_code)s"
    datefmt = "%Y-%m-%d %H:%M:%S"

    if "default" in formatters and isinstance(formatters.get("default"), dict):
        formatters["default"]["fmt"] = default_fmt
        formatters["default"]["datefmt"] = datefmt
        formatters["default"].pop("use_colors", None)

    if "access" in formatters and isinstance(formatters.get("access"), dict):
        formatters["access"]["fmt"] = access_fmt
        formatters["access"]["datefmt"] = datefmt
        formatters["access"].pop("use_colors", None)

    cfg["formatters"] = formatters
    return cfg


if __name__ == "__main__":

    uvicorn.run(
        app,
        host="localhost",
        port=8099,
        log_config=_build_log_config(),
        reload=False,
        timeout_keep_alive=300,  # default 5s
        limit_concurrency=1000  # optional: don’t reject parallel requests
    ) 
