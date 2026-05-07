"""FastAPI exception handlers for custom exceptions."""

import logging

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from backend.exceptions.custom import (
    AlreadyExistsError,
    AppError,
    ConfigurationError,
    NotFoundError,
    NotInitializedError,
    ResourceInUseError,
    ValidationError,
    ReadOnlyModeError,
)

logger = logging.getLogger("uvicorn.error")


def register_exception_handlers(app: FastAPI) -> None:
    """Register all custom exception handlers with the FastAPI app."""

    app.add_exception_handler(NotFoundError, not_found_error_handler)
    app.add_exception_handler(AlreadyExistsError, already_exists_error_handler)
    app.add_exception_handler(ValidationError, validation_error_handler)
    app.add_exception_handler(NotInitializedError, not_initialized_error_handler)
    app.add_exception_handler(ResourceInUseError, resource_in_use_error_handler)
    app.add_exception_handler(ConfigurationError, configuration_error_handler)
    app.add_exception_handler(ReadOnlyModeError, readonly_mode_error_handler)
    app.add_exception_handler(AppError, app_error_handler)


async def app_error_handler(request: Request, exc: AppError) -> JSONResponse:
    logger.error("Application error: %s - Path: %s", exc.message, request.url.path, exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "detail": exc.message,
            "type": "app_error",
            **exc.details,
        },
    )


async def not_found_error_handler(request: Request, exc: NotFoundError) -> JSONResponse:
    logger.warning("Resource not found: %s '%s' - Path: %s", exc.resource_type, exc.identifier, request.url.path)
    return JSONResponse(
        status_code=404,
        content={
            "detail": exc.message,
            "type": "not_found",
            "resource_type": exc.resource_type,
            "identifier": exc.identifier,
        },
    )


async def already_exists_error_handler(request: Request, exc: AlreadyExistsError) -> JSONResponse:
    logger.warning(
        "Resource already exists: %s '%s' - Path: %s",
        exc.resource_type,
        exc.identifier,
        request.url.path,
    )
    return JSONResponse(
        status_code=409,
        content={
            "detail": exc.message,
            "type": "already_exists",
            "resource_type": exc.resource_type,
            "identifier": exc.identifier,
        },
    )


async def validation_error_handler(request: Request, exc: ValidationError) -> JSONResponse:
    logger.warning("Validation error on field '%s': %s - Path: %s", exc.field, exc.message, request.url.path)
    return JSONResponse(
        status_code=400,
        content={
            "detail": exc.message,
            "type": "validation_error",
            "field": exc.field,
        },
    )


async def not_initialized_error_handler(request: Request, exc: NotInitializedError) -> JSONResponse:
    logger.warning("Component not initialized: %s - Path: %s", exc.component, request.url.path)
    return JSONResponse(
        status_code=400,
        content={
            "detail": exc.message,
            "type": "not_initialized",
            "component": exc.component,
        },
    )


async def resource_in_use_error_handler(request: Request, exc: ResourceInUseError) -> JSONResponse:
    logger.warning(
        "Resource in use: %s '%s' used by %s - Path: %s",
        exc.resource_type,
        exc.identifier,
        exc.used_by,
        request.url.path,
    )
    return JSONResponse(
        status_code=409,
        content={
            "detail": exc.message,
            "type": "resource_in_use",
            "resource_type": exc.resource_type,
            "identifier": exc.identifier,
            "used_by": exc.used_by,
        },
    )


async def configuration_error_handler(request: Request, exc: ConfigurationError) -> JSONResponse:
    logger.error("Configuration error for key '%s': %s - Path: %s", exc.config_key, exc.message, request.url.path)
    return JSONResponse(
        status_code=500,
        content={
            "detail": exc.message,
            "type": "configuration_error",
            "config_key": exc.config_key,
        },
    )


async def readonly_mode_error_handler(request: Request, exc: ReadOnlyModeError) -> JSONResponse:
    logger.warning("Read-only mode blocked operation '%s' - Path: %s", exc.operation, request.url.path)
    return JSONResponse(
        status_code=403,
        content={
            "detail": exc.message,
            "type": "readonly_mode",
            "operation": exc.operation,
        },
    )
