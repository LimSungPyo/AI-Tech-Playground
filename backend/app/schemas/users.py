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


class Dormant(CamelModel):
    """v2 · 07:M-07 휴면 복귀 웰컴. 휴면 계정이 아니면 키가 빠진다."""

    days_away: int
    highlights: list[str]
    continue_to: str | None = None


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
    dormant: Dormant | None = None  # v2


class OnboardingRequest(CamelModel):
    interests: list[str]
    skill: Skill


class PrimaryPartner(CamelModel):
    character: CharacterId
    reason: str
    score: float
    greeting: str | None = None  # v2 · 캐릭터 첫 인사


class AlternativePartner(CamelModel):
    character: CharacterId
    reason: str
    # v2
    score: float | None = None
    greeting: str | None = None


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
    # v2
    best: int | None = None  # 최고 기록 9일
    protections_left: int | None = None  # 쉬는 날 보호권 이번 달 남은 개수


class Xp(CamelModel):
    current: int
    next: int
    next_level: int


class DashboardResponse(CamelModel):
    user: User
    stats: DashboardStats
    recent: list[ExperimentSummary]
    streak: Streak
    partner: DexEntry
    # v2
    xp: Xp | None = None
    total_minutes: int | None = None  # 총 실험 시간
    week_minutes_delta: int | None = None  # 이번 주 +48m
    best_streak: int | None = None


class HistoryLog(CamelModel):
    date: str
    experiment_id: str
    text: str
    kind: Literal["training", "why", "achievement"] | None = None  # v2


class HistoryDay(DateMinutes):
    success_rate: float | None = None  # v2 · 그날 마지막 성공률


class HistoryStats(CamelModel):
    minutes: int
    minutes_delta: int  # 지난 기간 대비
    trials: int
    batch_runs: int
    why_views: int
    why_peak_date: str | None = None
    rate_change: float
    rate_change_label: str  # "#001 44% → 58%"


class WeeklySummary(CamelModel):
    text: str
    suggestion: str


class HistoryRecord(CamelModel):
    experiment_id: str
    mission_id: str
    trial: int
    best_rate: float
    status: Literal["in_progress", "cleared", "locked"]
    last_played_at: str


class HistoryResponse(CamelModel):
    days: list[HistoryDay]
    logs: list[HistoryLog]
    # v2
    period: Literal["week", "month", "all"] | None = None
    range_label: str | None = None  # "2026.10.11 – 10.17 · 이번 주"
    stats: HistoryStats | None = None
    weekly_summary: WeeklySummary | None = None
    records: list[HistoryRecord] | None = None  # 내 실험 기록 표(B-11)


class NotificationSettings(CamelModel):
    email: bool
    push: bool
    marketing: bool


class A11ySettings(CamelModel):
    reduce_motion: bool
    high_contrast: bool
    large_text: bool
    captions: bool


class PrivacySettings(CamelModel):
    public_profile: bool
    show_in_ranking: bool
    share_records: bool


class SocialConnection(CamelModel):
    provider: Literal["google", "kakao", "github"]
    connected: bool
    email: str | None = None


class Settings(CamelModel):
    notifications: NotificationSettings
    theme: Literal["light", "dark", "system"]
    why_level: Skill
    # v2 (PUT에서 빼고 보내면 저장된 값을 유지)
    ranking_alert: bool | None = None
    training_speed: Literal[1, 2, 4] | None = None
    language: Literal["ko", "en"] | None = None
    # to_camel이 "a11Y"로 바꾸지 않게 이름을 그대로 쓴다
    a11y: A11ySettings | None = Field(default=None, alias="a11y")
    privacy: PrivacySettings | None = None
    connections: list[SocialConnection] | None = None  # 읽기 전용
    password_changed_at: str | None = None  # 읽기 전용
    email: str | None = None  # 읽기 전용


class FeaturedBadgeRequest(CamelModel):
    badge_id: str


class FeaturedBadgeResponse(CamelModel):
    ok: bool = True
    featured_badge_id: str


class SocialConnectRequest(CamelModel):
    code: str


class SocialConnectResponse(CamelModel):
    ok: bool = True
    provider: str
    connected: bool


class EmailChangeRequest(CamelModel):
    email: str
    password: str


class EmailChangeResponse(CamelModel):
    ok: bool = True
    email: str
    verification_required: bool = True


class ExportResponse(CamelModel):
    ok: bool = True
    requested_at: str
    ready_in_min: int
    email: str


class ResetRequest(CamelModel):
    password: str
    scope: Literal["experiments", "all"] = "experiments"


class ProfileRequest(CamelModel):
    nickname: str
    avatar: CharacterId
    bio: str | None = None  # v2


class PasswordChangeRequest(CamelModel):
    current: str
    next: str


class WithdrawRequest(CamelModel):
    password: str
    reason: str = ""


class WithdrawResponse(CamelModel):
    ok: bool = True
    grace_days: int
