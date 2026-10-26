"""알림·문의·시스템 상태."""

from app.schemas.base import CamelModel


class InquiryCreate(CamelModel):
    category: str
    title: str
    body: str
    # v2
    notify: bool | None = None  # 답변 알림 받기
    experiment_id: str | None = None
    trial: int | None = None


class SystemStatus(CamelModel):
    maintenance: bool
    message: str | None = None
    until: str | None = None
