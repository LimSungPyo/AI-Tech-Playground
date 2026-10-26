"""모든 스키마의 공용 베이스. JSON 필드는 camelCase."""

from typing import Any

from pydantic import BaseModel, ConfigDict, model_serializer
from pydantic.alias_generators import to_camel


class CamelModel(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
        serialize_by_alias=True,
    )

    @model_serializer(mode="wrap")
    def _omit_empty_optionals(self, handler: Any) -> Any:
        """TS의 `field?:`처럼 기본값이 있는 선택 필드는 값이 None이면 키를 뺀다.

        `partner: CharacterId | null`처럼 기본값 없이 선언한 필드는 null을 그대로 둔다.
        """
        data = handler(self)
        if not isinstance(data, dict):
            return data
        for name, field in type(self).model_fields.items():
            if not field.is_required() and getattr(self, name, None) is None:
                data.pop(field.alias or name, None)
                data.pop(name, None)
        return data


class Ok(CamelModel):
    ok: bool = True
