"""FastAPI 앱 진입점."""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app import models  # noqa: F401  (create_all 전에 모든 모델을 등록)
from app.api import admin, auth, content, experiments, support, users
from app.core.config import get_settings
from app.core.errors import register_error_handlers
from app.db import Base, engine

logger = logging.getLogger("uvicorn.error")


@asynccontextmanager
async def lifespan(_: FastAPI):
    try:
        Base.metadata.create_all(bind=engine)
    except Exception as exc:  # DB가 없어도 샘플 API는 뜨게 한다
        logger.warning("DB 테이블 생성을 건너뜀 (연결 실패): %s", exc)
    yield


app = FastAPI(title="AI Tech Playground API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=get_settings().cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

register_error_handlers(app)

for module in (auth, users, experiments, content, support, admin):
    app.include_router(module.router)


@app.get("/health")
def health():
    return {"status": "ok"}
