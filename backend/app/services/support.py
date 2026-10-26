"""알림·문의·시스템 상태 서비스. 지금은 샘플을 돌려준다."""

from copy import deepcopy

from app.fixtures import support as fx
from app.schemas.support import InquiryCreate


def notifications(user: dict) -> list[dict]:
    # TODO: 사용자 알림을 최신순으로 읽는다.
    return deepcopy(fx.NOTIFICATIONS)


def read_all(user: dict) -> dict:
    # TODO: 사용자의 안 읽은 알림을 모두 읽음으로 바꾼다.
    return {"ok": True}


def inquiries(user: dict) -> list[dict]:
    # TODO: 사용자의 문의 내역과 답변을 읽는다.
    return deepcopy(fx.INQUIRIES)


def create_inquiry(user: dict, inquiry: InquiryCreate, attachments: int) -> dict:
    # TODO: 문의를 저장하고 첨부(최대 3장)를 파일 저장소에 올린 뒤 관리자 문의 큐에 넣는다.
    return {
        "id": fx.NEW_INQUIRY_ID,
        "category": inquiry.category,
        "title": inquiry.title,
        "body": inquiry.body,
        "status": "received",
        "created_at": "2026-10-17T15:00:00+09:00",
        "experiment_id": inquiry.experiment_id,
        "trial": inquiry.trial,
        "notify": inquiry.notify if inquiry.notify is not None else True,
    }


def system_status() -> dict:
    # TODO: 점검 일정 설정을 읽는다.
    return {"maintenance": False}
