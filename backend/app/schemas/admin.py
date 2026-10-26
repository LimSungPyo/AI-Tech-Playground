"""관리자 콘솔 요청·응답."""

from typing import Literal

from pydantic import EmailStr

from app.schemas.base import CamelModel
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


class AdminDashboard(CamelModel):
    kpis: list[Kpi]
    alerts: list[Alert]
    signups: list[DateCount]


class RadarCandidate(CamelModel):
    id: str
    keyword: str
    source: str
    score: float
    status: Literal["pending", "approved", "rejected"]


class RadarCandidates(CamelModel):
    candidates: list[RadarCandidate]


class RadarDecisionRequest(CamelModel):
    decision: Literal["approved", "rejected", "merged"]


class Module(CamelModel):
    id: str
    code: str
    title: str
    stage: Literal["idea", "design", "build", "qa", "live"]
    owner: str
    updated_at: str


class ModulesResponse(CamelModel):
    modules: list[Module]


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


class AdminUsers(CamelModel):
    users: list[AdminUser]


class UserActionRequest(CamelModel):
    action: Literal["suspend", "warn", "restore"]
    reason: str


class AdminInquiryItem(CamelModel):
    id: str
    kind: Literal["inquiry", "report"]
    title: str
    user: str
    status: str
    created_at: str


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
