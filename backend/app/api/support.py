"""알림·문의·시스템 상태 API."""

from fastapi import APIRouter, Request
from pydantic import ValidationError

from app.core.auth import CurrentUser
from app.core.errors import AppError
from app.schemas.base import Ok
from app.schemas.common import Inquiry, Notification
from app.schemas.support import InquiryCreate, SystemStatus
from app.services import support as service

router = APIRouter(prefix="/api", tags=["support"])

# 문의 등록은 JSON과 multipart(첨부 포함) 둘 다 받는다
INQUIRY_BODY_DOC = {
    "requestBody": {
        "required": True,
        "content": {
            "application/json": {"schema": InquiryCreate.model_json_schema(by_alias=True)},
            "multipart/form-data": {
                "schema": {
                    "type": "object",
                    "required": ["category", "title", "body"],
                    "properties": {
                        "category": {"type": "string"},
                        "title": {"type": "string"},
                        "body": {"type": "string"},
                        "attachments": {"type": "array", "items": {"type": "string", "format": "binary"}},
                    },
                }
            },
        },
    }
}


@router.get("/notifications", response_model=list[Notification])
def notifications(user: CurrentUser):
    """TODO: 실제로는 사용자 알림을 최신순으로 읽는다."""
    return service.notifications(user)


@router.post("/notifications/read-all", response_model=Ok)
def read_all(user: CurrentUser):
    """TODO: 실제로는 안 읽은 알림을 모두 읽음으로 바꾼다."""
    return service.read_all(user)


@router.get("/inquiries", response_model=list[Inquiry])
def inquiries(user: CurrentUser):
    """TODO: 실제로는 사용자의 문의 내역과 답변을 읽는다."""
    return service.inquiries(user)


@router.post("/inquiries", response_model=Inquiry, openapi_extra=INQUIRY_BODY_DOC)
async def create_inquiry(request: Request, user: CurrentUser):
    """TODO: 실제로는 문의와 첨부 파일(최대 3장)을 저장하고 관리자 문의 큐에 넣는다."""
    attachments = 0
    if request.headers.get("content-type", "").startswith("multipart/form-data"):
        form = await request.form()
        attachments = len([f for f in form.getlist("attachments") if hasattr(f, "filename")])
        raw = {k: form.get(k) for k in ("category", "title", "body")}
    else:
        try:
            raw = await request.json()
        except ValueError:
            raise AppError(400, "BAD_REQUEST", "JSON 본문을 읽을 수 없어요.")
    try:
        body = InquiryCreate.model_validate(raw)
    except ValidationError as exc:
        details = [{"loc": ["body", *e["loc"]], "msg": e["msg"]} for e in exc.errors()]
        raise AppError(422, "VALIDATION_ERROR", "요청 값이 올바르지 않아요.", details=details)
    return service.create_inquiry(user, body.category, body.title, body.body, attachments)


@router.get("/system/status", response_model=SystemStatus)
def system_status():
    """TODO: 실제로는 점검 일정 설정을 읽는다."""
    return service.system_status()
