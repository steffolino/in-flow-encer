from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_prefix="APP_", extra="ignore")

    database_url: str = "postgresql+psycopg://inflow:inflow@localhost:5432/inflow"
    environment: str = "development"
    dev_tenant_header: str = "X-Tenant-Slug"
    max_upload_bytes: int = 5 * 1024 * 1024
    allowed_upload_extensions: tuple[str, ...] = (".csv", ".geojson", ".json")
    # Comma-separated, e.g. APP_CORS_ORIGINS="https://in-flow-encer.pages.dev,https://inflowencer.example.com"
    cors_origins: str = "http://localhost:5173"

    @property
    def allowed_origins(self) -> tuple[str, ...]:
        return tuple(origin.strip() for origin in self.cors_origins.split(",") if origin.strip())


@lru_cache
def get_settings() -> Settings:
    return Settings()
