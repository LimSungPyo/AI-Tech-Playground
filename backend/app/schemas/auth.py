"""인증 요청·응답."""

from pydantic import EmailStr

from app.schemas.base import CamelModel
from app.schemas.common import User


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


class GuestMergeResponse(CamelModel):
    merged: int
