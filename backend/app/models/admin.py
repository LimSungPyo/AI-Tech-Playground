"""기술 레이더 키워드·후보, 관리자 감사 로그."""

from datetime import date, datetime

from sqlalchemy import JSON, Date, DateTime, Float, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base


class RadarKeyword(Base):
    """사용자에게 공개된 주간 레이더 키워드."""

    __tablename__ = "radar_keywords"

    id: Mapped[str] = mapped_column(String(60), primary_key=True)
    week: Mapped[date] = mapped_column(Date, primary_key=True)
    name: Mapped[str] = mapped_column(String(80))
    change_pct: Mapped[float] = mapped_column(Float)
    weeks: Mapped[list] = mapped_column(JSON, default=list)
    summary: Mapped[str] = mapped_column(Text, default="")
    related_experiment_id: Mapped[str | None] = mapped_column(ForeignKey("experiments.id"))
    sources: Mapped[list] = mapped_column(JSON, default=list)


class RadarCandidate(Base):
    """크롤링으로 뽑은 키워드 후보. 관리자가 검수한다."""

    __tablename__ = "radar_candidates"

    id: Mapped[str] = mapped_column(String(60), primary_key=True)
    week: Mapped[date] = mapped_column(Date, index=True)
    keyword: Mapped[str] = mapped_column(String(80))
    source: Mapped[str] = mapped_column(String(200))
    score: Mapped[float] = mapped_column(Float)
    status: Mapped[str] = mapped_column(String(10), default="pending")  # pending | approved | rejected
    merged_into: Mapped[str | None] = mapped_column(String(60))


class AdminAuditLog(Base):
    __tablename__ = "admin_audit_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    admin_id: Mapped[str] = mapped_column(ForeignKey("users.id"), index=True)
    action: Mapped[str] = mapped_column(String(200))
    target: Mapped[str] = mapped_column(String(200))
    reason: Mapped[str] = mapped_column(Text, default="")
    ip: Mapped[str] = mapped_column(String(64))
    at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
