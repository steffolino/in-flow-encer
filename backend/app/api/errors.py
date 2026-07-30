from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from app.domain.shared.exceptions import DomainError, DuplicateResourceError, NotFoundError, ValidationFailedError


def _error_body(code: str, message: str, details: list[str] | None = None) -> dict:
    return {"error": {"code": code, "message": message, "details": details}}


def register_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(NotFoundError)
    async def _not_found(request: Request, exc: NotFoundError) -> JSONResponse:
        return JSONResponse(status_code=404, content=_error_body("not_found", str(exc)))

    @app.exception_handler(ValidationFailedError)
    async def _validation_failed(request: Request, exc: ValidationFailedError) -> JSONResponse:
        return JSONResponse(
            status_code=422, content=_error_body("validation_failed", str(exc), exc.details)
        )

    @app.exception_handler(DuplicateResourceError)
    async def _duplicate(request: Request, exc: DuplicateResourceError) -> JSONResponse:
        return JSONResponse(status_code=409, content=_error_body("duplicate_resource", str(exc)))

    @app.exception_handler(DomainError)
    async def _domain_error(request: Request, exc: DomainError) -> JSONResponse:
        return JSONResponse(status_code=400, content=_error_body("domain_error", str(exc)))
