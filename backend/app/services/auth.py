"""인증 서비스. 지금은 샘플 사용자와 가짜 토큰을 돌려준다."""

import uuid
from copy import deepcopy

from app.core.errors import AppError
from app.fixtures import users as fx


def _sample_token(admin: bool = False) -> str:
    return f"{'admin' if admin else 'sample'}-{uuid.uuid4()}"


def login(email: str, password: str, remember: bool) -> dict:
    # TODO: 이메일로 사용자를 찾고 비밀번호 해시를 검증한다. 실패 횟수를 세어 5회면 10분 잠그고,
    #       remember면 만료가 긴 세션을 만든 뒤 JWT를 발급한다.
    if password == "wrong":
        raise AppError(401, "INVALID_PASSWORD", "비밀번호가 맞지 않아요.", remainingAttempts=4)
    if password == "locked":
        raise AppError(423, "ACCOUNT_LOCKED", "비밀번호를 5번 잘못 입력해서 계정이 잠겼어요.", unlockAt="2026-10-17T14:30:00+09:00")
    is_admin = email.lower().startswith("admin")
    user = fx.ADMIN_USER if is_admin else fx.HYEWON
    return {"token": _sample_token(is_admin), "user": deepcopy(user)}


def social_login(provider: str, code: str) -> dict:
    # TODO: provider(google·kakao·github)의 OAuth code를 토큰으로 교환해 이메일을 확인하고,
    #       같은 이메일의 기존 계정이 있으면 연결 확인(409)을, 없으면 가입·로그인을 처리한다.
    if code == "conflict":
        raise AppError(409, "SOCIAL_CONFLICT", "이미 이메일로 가입된 계정이에요.", email="hyewon@gmail.com", provider=provider)
    return {"token": _sample_token(), "user": deepcopy(fx.HYEWON)}


def logout() -> dict:
    # TODO: 현재 세션(토큰)을 무효화한다.
    return {"ok": True}


def signup(email: str, nickname: str) -> dict:
    # TODO: 이메일 중복을 확인하고 비밀번호를 해시해 미인증 사용자를 만든 뒤 6자리 코드를 메일로 보낸다.
    return {"verification_id": f"v-{uuid.uuid4().hex[:12]}", "email": email}


def verify_email(verification_id: str, code: str) -> dict:
    # TODO: 코드와 만료(10분)·시도 횟수(5회)를 확인하고 계정을 활성화한 뒤 게스트 체험 기록을 옮긴다.
    if code == "000000":
        raise AppError(400, "INVALID_CODE", "코드가 맞지 않아요.", attempts=2, maxAttempts=5)
    return {"token": _sample_token(), "user": deepcopy(fx.NEW_USER), "imported_guest_trials": 3}


def forgot_password(email: str) -> dict:
    # TODO: 가입 여부와 상관없이 같은 응답을 주고, 가입된 이메일이면 30분짜리 재설정 링크를 보낸다.
    return {"ok": True, "expires_in_min": 30}


def reset_password(reset_token: str, password: str) -> dict:
    # TODO: 재설정 토큰을 검증하고 새 비밀번호를 해시해 저장한 뒤 다른 기기 세션을 모두 끊는다.
    return {"ok": True}


def restore(email: str) -> dict:
    # TODO: 탈퇴 유예 중인 계정의 삭제 예약을 취소하고 상태를 활성으로 되돌린다.
    return {"ok": True, "deletion_scheduled_at": "2026-10-29T00:00:00+09:00"}


def merge_guest(trials: int) -> dict:
    # TODO: 브라우저에 저장된 게스트 체험 기록을 현재 사용자 계정의 트라이얼 기록으로 옮긴다.
    return {"merged": trials}
