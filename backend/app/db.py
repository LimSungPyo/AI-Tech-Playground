"""SQLAlchemy 2.0 엔진과 세션. 지금은 시작 시 테이블 생성에만 쓴다."""

from collections.abc import Iterator

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.core.config import get_settings


class Base(DeclarativeBase):
    pass


_url = get_settings().database_url
# DB가 없을 때 시작이 오래 멈추지 않도록 연결 대기를 짧게 둔다
_connect_args = {"connect_timeout": 5} if _url.startswith("postgresql") else {}
engine = create_engine(_url, pool_pre_ping=True, connect_args=_connect_args)
SessionLocal = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)


def get_db() -> Iterator[Session]:
    """요청마다 DB 세션을 열고 끝나면 닫는 의존성."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
