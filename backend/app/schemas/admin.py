"""관리자 콘솔 요청·응답."""

from typing import Literal

from pydantic import EmailStr

from app.schemas.base import CamelModel
from app.schemas.common import CharacterId
from app.schemas.content import CarouselSlide, Vote


class AdminLoginRequest(CamelModel):
    email: EmailStr
    password: str


class AdminLoginResponse(CamelModel):
    otp_required: bool = True
    otp_id: str


class OtpRequest(CamelModel):
    otp_id: str
    code: str


class OtpResponse(CamelModel):
    admin_token: str
    ip_verified: bool = True


class Kpi(CamelModel):
    label: str
    value: str
    delta: str


class Alert(CamelModel):
    level: Literal["info", "warning", "danger"]
    text: str


class DateCount(CamelModel):
    date: str
    count: int


class DateRate(CamelModel):
    date: str
    rate: float


class SystemCheck(CamelModel):
    name: str
    status: Literal["ok", "warning", "down"]
    detail: str


class AdminDashboard(CamelModel):
    kpis: list[Kpi]
    alerts: list[Alert]
    signups: list[DateCount]
    # v2 · F-02 최근 7일 DAU · 전환율 · 시스템 상태
    dau: list[DateCount] | None = None
    conversion: list[DateRate] | None = None  # 게스트 → 회원 전환율(%)
    system: list[SystemCheck] | None = None


class RadarCandidate(CamelModel):
    id: str
    keyword: str
    source: str
    score: float
    status: Literal["pending", "approved", "rejected", "merged"]
    # v2
    growth: float | None = None  # 상승률(%)
    linked_module: str | None = None  # 연결 모듈 "#003"
    merge_into: str | None = None  # 병합 제안 대상 후보 id
    warning: str | None = None  # "과장 · 출처 단일"


class RadarCandidates(CamelModel):
    candidates: list[RadarCandidate]


class RadarDecisionRequest(CamelModel):
    decision: Literal["approved", "rejected", "merged"]
    merge_into: str | None = None  # v2 · decision이 merged일 때 합칠 후보 id


ModuleStage = Literal["idea", "voting", "design", "build", "qa", "scheduled", "live"]


class Module(CamelModel):
    id: str
    code: str
    title: str
    stage: ModuleStage
    owner: str
    updated_at: str
    # v2 · F-05 카드 보조 문구
    progress: float | None = None  # 개발 중 진행률(%)
    vote_pct: float | None = None  # 투표 중 득표율
    d_day: int | None = None
    note: str | None = None  # "체크리스트 7/9" · "알림 신청 412명"


class ModulesResponse(CamelModel):
    modules: list[Module]


class ModuleStageRequest(CamelModel):
    stage: ModuleStage


class PublishRequest(CamelModel):
    visibility: Literal["public", "scheduled", "hidden"]
    open_at: str | None = None
    audience: str = "all"


class AdminHome(CamelModel):
    slides: list[CarouselSlide]
    vote: Vote


class AdminUser(CamelModel):
    id: str
    nickname: str
    email: str
    status: Literal["active", "dormant", "suspended", "withdrawing"]
    joined_at: str
    last_seen_at: str
    # v2
    level: int | None = None
    partner: CharacterId | None = None


class AdminUsers(CamelModel):
    users: list[AdminUser]


class UserActionRequest(CamelModel):
    action: Literal["suspend", "warn", "restore", "reset_password", "wipe", "unlock"]
    reason: str


class AdminInquiryItem(CamelModel):
    id: str
    kind: Literal["inquiry", "report"]
    title: str
    user: str
    status: str
    created_at: str
    # v2 · F-10 상세
    body: str | None = None
    category: str | None = None
    answer: str | None = None
    memo: str | None = None


class InquiryAnswerRequest(CamelModel):
    body: str
    memo: str | None = None


class InquiryAnswerResponse(CamelModel):
    ok: bool = True
    answered_at: str


class AdminInquiries(CamelModel):
    items: list[AdminInquiryItem]


class FunnelStep(CamelModel):
    step: str
    count: int


class Retention(CamelModel):
    week: str
    rate: float


class ExperimentAnalytics(CamelModel):
    code: str
    plays: int
    clear_rate: float


class Analytics(CamelModel):
    funnel: list[FunnelStep]
    retention: list[Retention]
    experiments: list[ExperimentAnalytics]


class AdminNotificationRequest(CamelModel):
    audience: str
    title: str
    body: str
    send_at: str | None = None


class ScheduledResponse(CamelModel):
    ok: bool = True
    scheduled: bool = True


class AdminAccount(CamelModel):
    id: str
    name: str
    role: str


class AuditLog(CamelModel):
    at: str
    admin: str
    action: str
    target: str
    ip: str


class AuditResponse(CamelModel):
    admins: list[AdminAccount]
    logs: list[AuditLog]


class AdminCardItem(CamelModel):
    id: str
    title: str
    experiment_id: str
    status: Literal["draft", "review", "approved", "published"]
    unlocked: bool
    author: str
    updated_at: str


class AdminCards(CamelModel):
    cards: list[AdminCardItem]


class AdminInviteRequest(CamelModel):
    email: EmailStr
    role: str


class AdminInviteResponse(CamelModel):
    ok: bool = True
    invited: AdminAccount


class SentNotification(CamelModel):
    id: str
    title: str
    audience: str
    recipients: int
    sent_at: str
    open_rate: float | None = None
    status: Literal["scheduled", "sent"]


class SentNotifications(CamelModel):
    items: list[SentNotification]
