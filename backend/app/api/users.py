"""사용자·온보딩·마이페이지 API (`/api/me`). 모두 로그인이 필요하다."""

from fastapi import APIRouter

from app.core.auth import CurrentUser
from app.schemas.base import Ok
from app.schemas.common import Badge, DexEntry, ExperimentSummary, User
from app.schemas.users import (
    DashboardResponse,
    HistoryResponse,
    HomeResponse,
    OnboardingRequest,
    PartnerRecommendation,
    PartnerRequest,
    PasswordChangeRequest,
    ProfileRequest,
    Settings,
    WithdrawRequest,
    WithdrawResponse,
)
from app.services import users as service

router = APIRouter(prefix="/api/me", tags=["users"])


@router.get("/home", response_model=HomeResponse)
def home(user: CurrentUser):
    """TODO: 실제로는 사용자 기록으로 이어하기·파트너 메시지·주간 학습·추천·레이더·Tech Drop·팀 미션을 모은다."""
    return service.home(user)


@router.put("/onboarding", response_model=User)
def save_onboarding(body: OnboardingRequest, user: CurrentUser):
    """TODO: 실제로는 관심사와 수준을 사용자 정보에 저장한다."""
    return service.save_onboarding(user, body.interests, body.skill)


@router.get("/partner-recommendation", response_model=PartnerRecommendation)
def partner_recommendation(user: CurrentUser):
    """TODO: 실제로는 관심사·수준·만남 여부로 캐릭터 추천 점수를 계산한다."""
    return service.partner_recommendation(user)


@router.put("/partner", response_model=User)
def set_partner(body: PartnerRequest, user: CurrentUser):
    """TODO: 실제로는 파트너 캐릭터를 저장하고 도감에 등록한다."""
    return service.set_partner(user, body.character)


@router.get("/dashboard", response_model=DashboardResponse)
def dashboard(user: CurrentUser):
    """TODO: 실제로는 사용자 통계·최근 실험·학습 잔디·파트너 도감을 집계한다."""
    return service.dashboard(user)


@router.get("/experiments", response_model=list[ExperimentSummary])
def my_experiments(user: CurrentUser):
    """TODO: 실제로는 사용자가 참여했거나 알림을 신청한 실험을 읽는다."""
    return service.my_experiments(user)


@router.get("/characters", response_model=list[DexEntry])
def my_characters(user: CurrentUser):
    """TODO: 실제로는 사용자-캐릭터 기록과 캐릭터 정의를 합친다."""
    return service.my_characters(user)


@router.get("/badges", response_model=list[Badge])
def my_badges(user: CurrentUser):
    """TODO: 실제로는 전체 배지와 사용자 획득 기록을 합친다."""
    return service.my_badges(user)


@router.get("/history", response_model=HistoryResponse)
def history(user: CurrentUser):
    """TODO: 실제로는 기간별 학습 시간과 활동 로그를 읽는다."""
    return service.history(user)


@router.get("/settings", response_model=Settings)
def get_settings(user: CurrentUser):
    """TODO: 실제로는 사용자 설정을 DB에서 읽는다."""
    return service.get_settings(user)


@router.put("/settings", response_model=Settings)
def update_settings(body: Settings, user: CurrentUser):
    """TODO: 실제로는 사용자 설정을 DB에 저장한다."""
    return service.update_settings(user, body.model_dump())


@router.put("/profile", response_model=User)
def update_profile(body: ProfileRequest, user: CurrentUser):
    """TODO: 실제로는 닉네임 중복·금칙어를 확인하고 프로필을 저장한다."""
    return service.update_profile(user, body.nickname, body.avatar)


@router.put("/password", response_model=Ok)
def change_password(body: PasswordChangeRequest, user: CurrentUser):
    """TODO: 실제로는 현재 비밀번호를 검증하고 새 비밀번호를 저장한다."""
    return service.change_password(user, body.current, body.next)


@router.post("/withdraw", response_model=WithdrawResponse)
def withdraw(body: WithdrawRequest, user: CurrentUser):
    """TODO: 실제로는 비밀번호를 확인하고 30일 뒤 계정 삭제를 예약한다."""
    return service.withdraw(user, body.password, body.reason)
