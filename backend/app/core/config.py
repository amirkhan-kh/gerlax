from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "postgresql+asyncpg://gerlax:gerlax@localhost:5435/gerlax"
    secret_key: str = "gerlax-dev-secret-change-me"
    access_token_minutes: int = 60 * 24 * 7
    refresh_token_minutes: int = 60 * 24 * 14
    cors_origins: str = "http://localhost:3000"

    @property
    def cors_origin_list(self) -> list[str]:
        return [item.strip() for item in self.cors_origins.split(",") if item.strip()]


settings = Settings()
