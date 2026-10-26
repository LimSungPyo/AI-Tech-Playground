"""FastAPI 앱 진입점."""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app import models  # noqa: F401  (create_all 전에 모든 모델을 등록)
from app.api import admin, auth, content, experiments, support, users
from app.core.config import get_settings
from app.core.errors import error_body, register_error_handlers
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


@app.middleware("http")
async def sample_expired_session(request: Request, call_next):
    """샘플 규칙: `expired`로 시작하는 토큰은 만료된 세션으로 보고 모든 /api 요청에 401을 준다(세션 만료 화면 확인용).

    TODO: 실제로는 JWT 만료 · 세션 무효화를 get_optional_user에서 검증한다.
    """
    auth = request.headers.get("authorization", "")
    if request.url.path.startswith("/api") and auth.lower().startswith("bearer expired"):
        return JSONResponse(error_body("SESSION_EXPIRED", "로그인이 만료됐어요. 다시 로그인해 주세요."), status_code=401)
    return await call_next(request)

for module in (auth, users, experiments, content, support, admin):
    app.include_router(module.router)


@app.get("/health")
def health():
    return {"status": "ok"}
