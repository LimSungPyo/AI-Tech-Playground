"""기술 카드·기술 트리·도감(사용자-캐릭터)·배지."""

from datetime import datetime

from sqlalchemy import JSON, Boolean, DateTime, Float, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base


class TechCard(Base):
    __tablename__ = "tech_cards"

    id: Mapped[str] = mapped_column(String(40), primary_key=True)  # "card-001"
    title: Mapped[str] = mapped_column(String(200))
    experiment_id: Mapped[str | None] = mapped_column(ForeignKey("experiments.id"))
    steps: Mapped[list] = mapped_column(JSON, default=list)
    biological_vs_designed: Mapped[dict] = mapped_column(JSON, default=dict)
    sources: Mapped[list] = mapped_column(JSON, default=list)
    reveal: Mapped[dict] = mapped_column(JSON, default=dict)
    stage: Mapped[str] = mapped_column(String(20), default="draft")  # draft | review | approved | published
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class TreeNode(Base):
    __tablename__ = "tree_nodes"

    id: Mapped[str] = mapped_column(String(40), primary_key=True)  # "node-rl"
    title: Mapped[str] = mapped_column(String(80))
    level: Mapped[str] = mapped_column(String(10))
    experiment_id: Mapped[str | None] = mapped_column(ForeignKey("experiments.id"))
    character: Mapped[str | None] = mapped_column(String(20))
    parents: Mapped[list] = mapped_column(JSON, default=list)
    position_x: Mapped[float] = mapped_column(Float)
    position_y: Mapped[float] = mapped_column(Float)
    description: Mapped[str] = mapped_column(Text, default="")
    unlock_condition: Mapped[str | None] = mapped_column(String(200))


class UserCharacter(Base):
    """도감: 사용자가 만난 캐릭터의 레벨·상태·기록."""

    __tablename__ = "user_characters"

    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), primary_key=True)
    character: Mapped[str] = mapped_column(String(20), primary_key=True)
    level: Mapped[int] = mapped_column(Integer, default=1)
    title: Mapped[str] = mapped_column(String(40), default="")
    state: Mapped[str] = mapped_column(String(10), default="baby")  # egg | baby | growing | master
    best_rate: Mapped[float | None] = mapped_column(Float)
    trials: Mapped[int] = mapped_column(Integer, default=0)
    reveal_watched: Mapped[bool] = mapped_column(Boolean, default=False)
    obtained_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))


class Badge(Base):
    __tablename__ = "badges"

    id: Mapped[str] = mapped_column(String(40), primary_key=True)
    name: Mapped[str] = mapped_column(String(80))
    description: Mapped[str] = mapped_column(String(200))
    icon: Mapped[str] = mapped_column(String(8))
    group: Mapped[str] = mapped_column(String(20), default="")  # 실험 · 이해 · 꾸준함 · 협업


class UserBadge(Base):
    __tablename__ = "user_badges"

    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), primary_key=True)
    badge_id: Mapped[str] = mapped_column(ForeignKey("badges.id"), primary_key=True)
    progress: Mapped[float] = mapped_column(Float, default=0)
    obtained_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    is_featured: Mapped[bool] = mapped_column(Boolean, default=False)
