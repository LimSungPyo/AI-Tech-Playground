"""사용자·온보딩·마이페이지 요청·응답."""

from typing import Literal

from pydantic import Field

from app.schemas.base import CamelModel
from app.schemas.common import (
    CharacterId,
    DexEntry,
    ExperimentSummary,
    Mission,
    RadarKeyword,
    Recommendation,
    Skill,
    User,
)


class ContinueBlock(CamelModel):
    experiment: ExperimentSummary
    mission: Mission
    last_played_at: str
    delta_pct: float
    last_why: str


class PartnerBlock(CamelModel):
    character: CharacterId
    level: int
    title: str
    message: str


class DayMinutes(CamelModel):
    day: str
    minutes: int


class WeekBlock(CamelModel):
    total_minutes: int
    days: list[DayMinutes]


class TechDropBlock(CamelModel):
    code: str
    title: str
    d_day: int
    subscribed: bool


class TeamBlock(CamelModel):
    ready: bool
    text: str
    mission_id: str


class HomeResponse(CamelModel):
    user: User
    # `continue`는 파이썬 예약어라 필드 이름은 continue_
    continue_: ContinueBlock = Field(alias="continue")
    partner: PartnerBlock
    week: WeekBlock
    recommendations: list[Recommendation]
    radar: list[RadarKeyword]
    tech_drop: TechDropBlock
    team: TeamBlock


class OnboardingRequest(CamelModel):
    interests: list[str]
    skill: Skill


class PrimaryPartner(CamelModel):
    character: CharacterId
    reason: str
    score: float


class AlternativePartner(CamelModel):
    character: CharacterId
    reason: str


class PartnerRecommendation(CamelModel):
    primary: PrimaryPartner
    alternatives: list[AlternativePartner]


class PartnerRequest(CamelModel):
    character: CharacterId


class DashboardStats(CamelModel):
    experiments: int
    trials: int
    cards: int
    badges: int


class DateMinutes(CamelModel):
    date: str
    minutes: int


class Streak(CamelModel):
    days: int
    calendar: list[DateMinutes]


class DashboardResponse(CamelModel):
    user: User
    stats: DashboardStats
    recent: list[ExperimentSummary]
    streak: Streak
    partner: DexEntry


class HistoryLog(CamelModel):
    date: str
    experiment_id: str
    text: str


class HistoryResponse(CamelModel):
    days: list[DateMinutes]
    logs: list[HistoryLog]


class NotificationSettings(CamelModel):
    email: bool
    push: bool
    marketing: bool


class Settings(CamelModel):
    notifications: NotificationSettings
    theme: Literal["light", "dark", "system"]
    why_level: Skill


class ProfileRequest(CamelModel):
    nickname: str
    avatar: CharacterId


class PasswordChangeRequest(CamelModel):
    current: str
    next: str


class WithdrawRequest(CamelModel):
    password: str
    reason: str = ""


class WithdrawResponse(CamelModel):
    ok: bool = True
    grace_days: int
