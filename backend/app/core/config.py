"""환경 변수 설정. 레포 루트의 `.env` 하나에서만 읽는다. 필수 값이 없으면 시작하지 않는다."""

from functools import lru_cache
from pathlib import Path
from typing import Literal

from pydantic_settings import BaseSettings, SettingsConfigDict

DEFAULT_CORS_ORIGINS = ["http://localhost:5173", "http://127.0.0.1:5173"]
# backend/app/core/config.py → 레포 루트. Docker에서는 이 파일이 없고 compose가 값을 넘긴다.
ROOT_ENV_FILE = Path(__file__).resolve().parents[3] / ".env"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=ROOT_ENV_FILE, env_ignore_empty=True, extra="ignore")

    database_url: str
    jwt_secret: str
    # 쉼표로 구분한 추가 허용 출처. 기본 5173 출처에 더해진다.
    cors_origins: str = ""
    # Claude API 키. 비어 있으면 AI 기능을 쓸 수 없다.
    anthropic_api_key: str = ""
    # Claude 모델과 effort는 .env에서만 정한다. 모델이 비어 있으면 AI 기능을 쓸 수 없고,
    # effort가 비어 있으면 요청에서 빼서 모델 기본값을 쓴다.
    anthropic_model: str = ""
    anthropic_effort: Literal["low", "medium", "high", "xhigh", "max"] | None = None

    @property
    def cors_origin_list(self) -> list[str]:
        extra = [o.strip() for o in self.cors_origins.split(",") if o.strip()]
        return list(dict.fromkeys(DEFAULT_CORS_ORIGINS + extra))


@lru_cache
def get_settings() -> Settings:
    return Settings()
