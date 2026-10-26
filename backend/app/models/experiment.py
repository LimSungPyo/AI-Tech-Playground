"""실험·미션·트라이얼 기록·훈련 작업."""

from datetime import datetime

from sqlalchemy import JSON, Boolean, DateTime, Float, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base


class Experiment(Base):
    __tablename__ = "experiments"

    id: Mapped[str] = mapped_column(String(8), primary_key=True)  # "001"
    code: Mapped[str] = mapped_column(String(8))  # "#001"
    title: Mapped[str] = mapped_column(String(120))
    subtitle: Mapped[str] = mapped_column(String(120))
    level: Mapped[str] = mapped_column(String(10))  # intro | basic | advanced | frontier
    character: Mapped[str] = mapped_column(String(20))
    tags: Mapped[list] = mapped_column(JSON, default=list)
    duration_min: Mapped[int] = mapped_column(Integer)
    status: Mapped[str] = mapped_column(String(20))  # open | locked | coming_soon (사용자별 진행은 trial_records에서)
    unlock_condition: Mapped[str | None] = mapped_column(String(200))
    max_trial: Mapped[int] = mapped_column(Integer, default=100)
    thumbnail_color: Mapped[str] = mapped_column(String(16))
    description: Mapped[str] = mapped_column(Text, default="")
    principle: Mapped[str] = mapped_column(Text, default="")
    card_id: Mapped[str | None] = mapped_column(String(40))
    open_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    missions: Mapped[list["Mission"]] = relationship(back_populates="experiment")


class Mission(Base):
    __tablename__ = "missions"

    experiment_id: Mapped[str] = mapped_column(ForeignKey("experiments.id"), primary_key=True)
    id: Mapped[str] = mapped_column(String(8), primary_key=True)  # "m1"
    order: Mapped[int] = mapped_column(Integer)
    title: Mapped[str] = mapped_column(String(120))
    goal: Mapped[str] = mapped_column(String(200))
    success_threshold: Mapped[float] = mapped_column(Float, default=60)
    briefing: Mapped[dict] = mapped_column(JSON, default=dict)  # story · objectives · prediction · tips

    experiment: Mapped[Experiment] = relationship(back_populates="missions")


class TrialRecord(Base):
    """한 번의 플레이(트라이얼) 결과. WHY? 설명과 리포트가 여기서 나온다."""

    __tablename__ = "trial_records"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), index=True)
    experiment_id: Mapped[str] = mapped_column(ForeignKey("experiments.id"), index=True)
    mission_id: Mapped[str] = mapped_column(String(8))
    trial: Mapped[int] = mapped_column(Integer)
    success: Mapped[bool] = mapped_column(Boolean)
    success_rate: Mapped[float] = mapped_column(Float)
    time_sec: Mapped[float] = mapped_column(Float)
    collisions: Mapped[int] = mapped_column(Integer)
    path: Mapped[list] = mapped_column(JSON, default=list)
    neurons: Mapped[list] = mapped_column(JSON, default=list)
    why: Mapped[dict] = mapped_column(JSON, default=dict)
    journal: Mapped[str] = mapped_column(Text, default="")
    prediction: Mapped[str | None] = mapped_column(String(40))
    training_job_id: Mapped[str | None] = mapped_column(ForeignKey("training_jobs.id"))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class TrainingJob(Base):
    """×10 훈련 같은 묶음 훈련 작업."""

    __tablename__ = "training_jobs"

    id: Mapped[str] = mapped_column(String(40), primary_key=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), index=True)
    experiment_id: Mapped[str] = mapped_column(ForeignKey("experiments.id"))
    mission_id: Mapped[str] = mapped_column(String(8))
    from_trial: Mapped[int] = mapped_column(Integer)
    to_trial: Mapped[int] = mapped_column(Integer)
    status: Mapped[str] = mapped_column(String(10), default="running")  # running | done
    progress: Mapped[float] = mapped_column(Float, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
