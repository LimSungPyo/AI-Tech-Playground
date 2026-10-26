"""알림·문의·시스템 상태."""

from app.schemas.base import CamelModel


class InquiryCreate(CamelModel):
    category: str
    title: str
    body: str


class SystemStatus(CamelModel):
    maintenance: bool
    message: str | None = None
    until: str | None = None
