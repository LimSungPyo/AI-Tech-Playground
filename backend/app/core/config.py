"""환경 변수 설정. `.env` 없이도 기본값으로 뜬다."""

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict

DEFAULT_CORS_ORIGINS = ["http://localhost:5173", "http://127.0.0.1:5173"]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "postgresql+psycopg://playground:playground@localhost:5432/ai_playground"
    jwt_secret: str = "dev-secret-change-me"
    # 쉼표로 구분한 추가 허용 출처. 기본 5173 출처에 더해진다.
    cors_origins: str = ""

    @property
    def cors_origin_list(self) -> list[str]:
        extra = [o.strip() for o in self.cors_origins.split(",") if o.strip()]
        return list(dict.fromkeys(DEFAULT_CORS_ORIGINS + extra))


@lru_cache
def get_settings() -> Settings:
    return Settings()
