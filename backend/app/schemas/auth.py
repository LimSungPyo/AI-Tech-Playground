"""인증 요청·응답."""

from pydantic import EmailStr

from app.schemas.base import CamelModel
from app.schemas.common import CharacterId, User


class LoginRequest(CamelModel):
    email: EmailStr
    password: str
    remember: bool = False


class SocialLoginRequest(CamelModel):
    code: str


class AuthResponse(CamelModel):
    token: str
    user: User


class SignupRequest(CamelModel):
    email: EmailStr
    password: str
    nickname: str
    agree_terms: bool
    agree_marketing: bool = False


class SignupResponse(CamelModel):
    verification_id: str
    email: str


class VerifyEmailRequest(CamelModel):
    verification_id: str
    code: str


class VerifyEmailResponse(AuthResponse):
    imported_guest_trials: int


class EmailRequest(CamelModel):
    email: EmailStr


class ForgotPasswordResponse(CamelModel):
    ok: bool = True
    expires_in_min: int


class ResetPasswordRequest(CamelModel):
    reset_token: str
    password: str


class RestoreResponse(CamelModel):
    ok: bool = True
    deletion_scheduled_at: str


class GuestMergeRequest(CamelModel):
    trials: int


class MergedCharacter(CamelModel):
    id: CharacterId
    level: int
    state: str


class GuestMergeResponse(CamelModel):
    merged: int
    # v2 · E-02 가입 완료 화면
    experiment_id: str | None = None
    success_rate: float | None = None
    replays: int | None = None
    character: MergedCharacter | None = None
    predictions: list[str] | None = None  # 이어받은 예측 선택지 ("11 – 30회")


class ResendRequest(CamelModel):
    verification_id: str


class ResendResponse(CamelModel):
    ok: bool = True
    expires_in_sec: int
    cooldown_sec: int


class SocialLinkRequest(CamelModel):
    email: EmailStr
    password: str


class RestoreCounts(CamelModel):
    experiments: int
    characters: int
    cards: int
    badges: int


class RestorePreview(CamelModel):
    email: str
    deletion_scheduled_at: str
    days_left: int
    counts: RestoreCounts
