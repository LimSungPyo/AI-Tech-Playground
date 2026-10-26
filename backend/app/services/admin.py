"""관리자 콘솔 서비스. 지금은 샘플을 돌려준다."""

import uuid
from copy import deepcopy

from app.core.errors import AppError
from app.fixtures import admin as fx
from app.fixtures import content as content_fx


def login(email: str, password: str) -> dict:
    # TODO: 관리자 계정의 비밀번호를 검증하고 OTP 챌린지를 만든다(5회 실패 시 잠금 + 슈퍼관리자 알림).
    return {"otp_required": True, "otp_id": f"otp-{uuid.uuid4().hex[:12]}"}


def verify_otp(otp_id: str, code: str) -> dict:
    # TODO: Authenticator 6자리를 검증하고 접속 IP가 허용 목록(사내 VPN)인지 확인한 뒤 관리자 토큰을 발급한다.
    if code == "999999":
        raise AppError(403, "IP_BLOCKED", "허용되지 않은 IP에서 접속했어요. 사내 VPN에서 다시 시도해 주세요.")
    return {"admin_token": f"admin-{uuid.uuid4()}", "ip_verified": True}


def dashboard() -> dict:
    # TODO: KPI·오늘 할 일·최근 가입 추이를 집계한다.
    return deepcopy(fx.DASHBOARD)


def radar_candidates() -> dict:
    # TODO: 이번 주 크롤링으로 추출한 키워드 후보와 점수를 읽는다.
    return deepcopy({"candidates": fx.RADAR_CANDIDATES})


def radar_decision(candidate_id: str, decision: str) -> dict:
    # TODO: 후보를 승인·제외·병합하고 감사 로그를 남긴다.
    if not any(c["id"] == candidate_id for c in fx.RADAR_CANDIDATES):
        raise AppError(404, "CANDIDATE_NOT_FOUND", f"키워드 후보 {candidate_id}을(를) 찾을 수 없어요.")
    return {"ok": True}


def get_card(card_id: str) -> dict:
    # TODO: 카드 초안(작성·검토·승인·게시 단계 포함)을 읽는다.
    if card_id not in content_fx.CARDS_BY_ID:
        raise AppError(404, "CARD_NOT_FOUND", f"기술 카드 {card_id}을(를) 찾을 수 없어요.")
    return deepcopy(content_fx.CARDS_BY_ID[card_id])


def save_card(card_id: str, card: dict) -> dict:
    # TODO: 카드를 저장하고 과장 표현·출처 체크리스트를 검사한 뒤 감사 로그를 남긴다.
    get_card(card_id)
    return {**card, "id": card_id}


def modules() -> dict:
    # TODO: 실험 모듈의 파이프라인 단계와 담당자를 읽는다.
    return deepcopy({"modules": fx.MODULES})


def publish_module(module_id: str, visibility: str, open_at: str | None, audience: str) -> dict:
    # TODO: 공개 설정을 저장하고 캐러셀 슬라이드·오픈 알림을 예약한다.
    if not any(m["id"] == module_id for m in fx.MODULES):
        raise AppError(404, "MODULE_NOT_FOUND", f"모듈 {module_id}을(를) 찾을 수 없어요.")
    return {"ok": True}


def get_home() -> dict:
    # TODO: 홈 캐러셀 슬라이드 순서·노출 기간과 이번 주 투표를 읽는다.
    return deepcopy({"slides": content_fx.CAROUSEL, "vote": content_fx.VOTE})


def save_home(data: dict) -> dict:
    # TODO: 슬라이드 순서·노출과 투표 후보를 저장한다.
    return data


def users(q: str | None) -> dict:
    # TODO: 닉네임·이메일로 사용자를 검색한다(개인정보는 마스킹).
    items = fx.USERS
    if q:
        needle = q.lower()
        items = [u for u in items if needle in u["nickname"].lower() or needle in u["email"].lower()]
    return deepcopy({"users": items})


def user_action(user_id: str, action: str, reason: str) -> dict:
    # TODO: 2차 인증 후 계정 상태를 바꾸고 사용자에게 메일을 보낸 뒤 감사 로그를 남긴다.
    if not any(u["id"] == user_id for u in fx.USERS):
        raise AppError(404, "USER_NOT_FOUND", f"사용자 {user_id}을(를) 찾을 수 없어요.")
    return {"ok": True}


def inquiries() -> dict:
    # TODO: 미답변 문의와 신고를 우선순위 순으로 읽는다.
    return deepcopy({"items": fx.INQUIRY_ITEMS})


def analytics() -> dict:
    # TODO: 최근 30일 퍼널·리텐션·실험별 지표를 집계한다.
    return deepcopy(fx.ANALYTICS)


def send_notification(audience: str, title: str, body: str, send_at: str | None) -> dict:
    # TODO: 가드레일(주 3회·24시간 중복·야간 금지)을 적용해 대상을 고르고 발송을 예약한다.
    return {"ok": True, "scheduled": True}


def audit() -> dict:
    # TODO: 관리자 계정·역할과 최근 감사 로그를 읽는다.
    return deepcopy({"admins": fx.ADMINS, "logs": fx.AUDIT_LOGS})
