class DomainError(Exception):
    """Base class for all domain-level errors."""


class NotFoundError(DomainError):
    """Raised when a requested entity does not exist within the caller's tenant scope."""


class ValidationFailedError(DomainError):
    """Raised when input fails domain-level validation (distinct from schema validation)."""

    def __init__(self, message: str, details: list[str] | None = None) -> None:
        super().__init__(message)
        self.details = details or []


class DuplicateResourceError(DomainError):
    """Raised when an operation would violate an idempotency/uniqueness guarantee."""
