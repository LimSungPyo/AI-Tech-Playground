"""Bearer 토큰에서 현재 사용자를 꺼내는 의존성.

지금은 토큰을 검증하지 않는다. 토큰이 있으면 샘플 회원 혜원,
`admin`으로 시작하면 관리자 권한의 혜원으로 본다.
"""

from typing import Annotated

from fastapi import Depends, Header

from app.core.errors import AppError
from app.fixtures import users as user_fx


def read_bearer_token(authorization: Annotated[str | None, Header()] = None) -> str | None:
    if not authorization:
        return None
    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or not token.strip():
        return None
    return token.strip()


def get_optional_user(token: Annotated[str | None, Depends(read_bearer_token)]) -> dict | None:
    """토큰이 없으면 None(비회원)."""
    # TODO: 실제로는 JWT 서명·만료를 검증하고 세션 테이블에서 사용자를 읽어야 한다.
    if token is None:
        return None
    return user_fx.ADMIN_USER if token.startswith("admin") else user_fx.HYEWON


def get_current_user(user: Annotated[dict | None, Depends(get_optional_user)]) -> dict:
    """로그인한 사용자. 토큰이 없으면 401."""
    if user is None:
        raise AppError(401, "UNAUTHORIZED", "로그인이 필요해요.")
    return user


def get_current_admin(token: Annotated[str | None, Depends(read_bearer_token)]) -> dict:
    """관리자 재인증 토큰(`admin…`)을 가진 사용자. 없으면 401, 일반 토큰이면 403."""
    # TODO: 실제로는 관리자 토큰의 OTP·IP 재인증 여부와 역할 권한을 검증해야 한다.
    if token is None:
        raise AppError(401, "UNAUTHORIZED", "관리자 로그인이 필요해요.")
    if not token.startswith("admin"):
        raise AppError(403, "FORBIDDEN", "관리자 권한이 없어요.")
    return user_fx.ADMIN_USER


CurrentUser = Annotated[dict, Depends(get_current_user)]
OptionalUser = Annotated[dict | None, Depends(get_optional_user)]
CurrentAdmin = Annotated[dict, Depends(get_current_admin)]
