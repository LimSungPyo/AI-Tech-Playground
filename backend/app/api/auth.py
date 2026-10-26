"""인증 API (`/api/auth`)."""

from fastapi import APIRouter

from app.core.auth import CurrentUser
from app.schemas.auth import (
    AuthResponse,
    EmailRequest,
    ForgotPasswordResponse,
    GuestMergeRequest,
    GuestMergeResponse,
    LoginRequest,
    ResetPasswordRequest,
    RestoreResponse,
    SignupRequest,
    SignupResponse,
    SocialLoginRequest,
    VerifyEmailRequest,
    VerifyEmailResponse,
)
from app.schemas.base import Ok
from app.schemas.common import User
from app.services import auth as service

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/login", response_model=AuthResponse)
def login(body: LoginRequest):
    """TODO: 실제로는 비밀번호 해시를 검증하고 실패 횟수·잠금을 관리한 뒤 JWT를 발급한다."""
    return service.login(body.email, body.password, body.remember)


@router.post("/social/{provider}", response_model=AuthResponse)
def social_login(provider: str, body: SocialLoginRequest):
    """TODO: 실제로는 OAuth code를 교환해 계정을 찾거나 만들고, 이메일 충돌이면 409를 돌려준다."""
    return service.social_login(provider, body.code)


@router.post("/logout", response_model=Ok)
def logout():
    """TODO: 실제로는 현재 세션 토큰을 무효화한다."""
    return service.logout()


@router.get("/me", response_model=User)
def me(user: CurrentUser):
    """TODO: 실제로는 토큰을 검증하고 세션의 사용자를 DB에서 읽는다."""
    return user


@router.post("/signup", response_model=SignupResponse)
def signup(body: SignupRequest):
    """TODO: 실제로는 미인증 사용자를 만들고 이메일 인증 코드를 보낸다."""
    return service.signup(body.email, body.nickname)


@router.post("/verify-email", response_model=VerifyEmailResponse)
def verify_email(body: VerifyEmailRequest):
    """TODO: 실제로는 인증 코드를 검증해 계정을 활성화하고 게스트 기록을 옮긴다."""
    return service.verify_email(body.verification_id, body.code)


@router.post("/password/forgot", response_model=ForgotPasswordResponse)
def forgot_password(body: EmailRequest):
    """TODO: 실제로는 30분짜리 비밀번호 재설정 링크를 메일로 보낸다."""
    return service.forgot_password(body.email)


@router.post("/password/reset", response_model=Ok)
def reset_password(body: ResetPasswordRequest):
    """TODO: 실제로는 재설정 토큰을 검증하고 새 비밀번호를 저장한다."""
    return service.reset_password(body.reset_token, body.password)


@router.post("/restore", response_model=RestoreResponse)
def restore(body: EmailRequest):
    """TODO: 실제로는 탈퇴 유예 계정의 삭제 예약을 취소한다."""
    return service.restore(body.email)


@router.post("/guest/merge", response_model=GuestMergeResponse)
def merge_guest(body: GuestMergeRequest, user: CurrentUser):
    """TODO: 실제로는 게스트 체험 기록을 로그인한 계정으로 옮긴다."""
    return service.merge_guest(body.trials)
