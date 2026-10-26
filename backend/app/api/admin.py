"""관리자 콘솔 API (`/api/admin`). login·otp 외에는 `admin…` 토큰이 필요하다."""

from fastapi import APIRouter

from app.core.auth import CurrentAdmin
from app.schemas.admin import (
    AdminDashboard,
    AdminHome,
    AdminInquiries,
    AdminLoginRequest,
    AdminLoginResponse,
    AdminNotificationRequest,
    AdminUsers,
    Analytics,
    AuditResponse,
    ModulesResponse,
    OtpRequest,
    OtpResponse,
    PublishRequest,
    RadarCandidates,
    RadarDecisionRequest,
    ScheduledResponse,
    UserActionRequest,
)
from app.schemas.base import Ok
from app.schemas.common import TechCard
from app.services import admin as service

router = APIRouter(prefix="/api/admin", tags=["admin"])


@router.post("/login", response_model=AdminLoginResponse)
def login(body: AdminLoginRequest):
    """TODO: 실제로는 관리자 비밀번호를 검증하고 OTP 챌린지를 만든다."""
    return service.login(body.email, body.password)


@router.post("/otp", response_model=OtpResponse)
def verify_otp(body: OtpRequest):
    """TODO: 실제로는 OTP와 접속 IP를 검증하고 관리자 토큰을 발급한다."""
    return service.verify_otp(body.otp_id, body.code)


@router.get("/dashboard", response_model=AdminDashboard)
def dashboard(admin: CurrentAdmin):
    """TODO: 실제로는 KPI·할 일·가입 추이를 집계한다."""
    return service.dashboard()


@router.get("/radar", response_model=RadarCandidates)
def radar_candidates(admin: CurrentAdmin):
    """TODO: 실제로는 이번 주 크롤링 키워드 후보를 읽는다."""
    return service.radar_candidates()


@router.post("/radar/{candidate_id}/decision", response_model=Ok)
def radar_decision(candidate_id: str, body: RadarDecisionRequest, admin: CurrentAdmin):
    """TODO: 실제로는 후보를 승인·제외·병합하고 감사 로그를 남긴다."""
    return service.radar_decision(candidate_id, body.decision)


@router.get("/cards/{card_id}", response_model=TechCard)
def get_card(card_id: str, admin: CurrentAdmin):
    """TODO: 실제로는 기술 카드 초안과 검토 상태를 읽는다."""
    return service.get_card(card_id)


@router.put("/cards/{card_id}", response_model=TechCard)
def save_card(card_id: str, body: TechCard, admin: CurrentAdmin):
    """TODO: 실제로는 카드를 저장하고 체크리스트를 검사한 뒤 감사 로그를 남긴다."""
    return service.save_card(card_id, body.model_dump())


@router.get("/modules", response_model=ModulesResponse)
def modules(admin: CurrentAdmin):
    """TODO: 실제로는 실험 모듈 파이프라인 단계를 읽는다."""
    return service.modules()


@router.put("/modules/{module_id}/publish", response_model=Ok)
def publish_module(module_id: str, body: PublishRequest, admin: CurrentAdmin):
    """TODO: 실제로는 공개 설정을 저장하고 캐러셀·오픈 알림을 예약한다."""
    return service.publish_module(module_id, body.visibility, body.open_at, body.audience)


@router.get("/home", response_model=AdminHome)
def get_home(admin: CurrentAdmin):
    """TODO: 실제로는 홈 캐러셀 설정과 이번 주 투표를 읽는다."""
    return service.get_home()


@router.put("/home", response_model=AdminHome)
def save_home(body: AdminHome, admin: CurrentAdmin):
    """TODO: 실제로는 캐러셀 순서·노출과 투표 후보를 저장한다."""
    return service.save_home(body.model_dump())


@router.get("/users", response_model=AdminUsers)
def users(admin: CurrentAdmin, q: str | None = None):
    """TODO: 실제로는 사용자를 검색하고 개인정보를 마스킹한다."""
    return service.users(q)


@router.post("/users/{user_id}/action", response_model=Ok)
def user_action(user_id: str, body: UserActionRequest, admin: CurrentAdmin):
    """TODO: 실제로는 2차 인증 후 계정 상태를 바꾸고 감사 로그를 남긴다."""
    return service.user_action(user_id, body.action, body.reason)


@router.get("/inquiries", response_model=AdminInquiries)
def inquiries(admin: CurrentAdmin):
    """TODO: 실제로는 미답변 문의와 신고를 우선순위 순으로 읽는다."""
    return service.inquiries()


@router.get("/analytics", response_model=Analytics)
def analytics(admin: CurrentAdmin):
    """TODO: 실제로는 퍼널·리텐션·실험별 지표를 집계한다."""
    return service.analytics()


@router.post("/notifications", response_model=ScheduledResponse)
def send_notification(body: AdminNotificationRequest, admin: CurrentAdmin):
    """TODO: 실제로는 가드레일을 적용해 대상을 고르고 발송을 예약한다."""
    return service.send_notification(body.audience, body.title, body.body, body.send_at)


@router.get("/audit", response_model=AuditResponse)
def audit(admin: CurrentAdmin):
    """TODO: 실제로는 관리자 계정·역할과 감사 로그를 읽는다."""
    return service.audit()
