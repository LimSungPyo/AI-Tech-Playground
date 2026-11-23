# 베이스 이미지는 태그가 가리키는 내용이 바뀌지 않게 해시로 고정한다. 해시는 Dependabot이 올린다.
FROM python:3.12-slim@sha256:5e2bdb1b0d542d5039cffb8181c65930093949194a65c365dfb1b0fe13a4fa5b

# uv는 공식 이미지에서 실행 파일만 가져온다 (버전 고정). CI의 setup-uv version과 맞춘다.
COPY --from=ghcr.io/astral-sh/uv:0.13.8@sha256:5cc1805e2426484abca4ad46ea783bab281fdb225fd82d8ce6d66a81254bac85 /uv /bin/uv

# compose가 ./backend를 /app에 마운트하므로 가상환경은 /app 밖에 둔다
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    UV_PROJECT_ENVIRONMENT=/opt/venv \
    UV_PYTHON_DOWNLOADS=never \
    UV_LINK_MODE=copy \
    PATH="/opt/venv/bin:$PATH"

WORKDIR /app

# 의존성 먼저 설치해 소스가 바뀌어도 캐시를 쓴다. uv.lock과 pyproject.toml이 어긋나면 빌드를 멈춘다.
COPY pyproject.toml uv.lock .python-version ./
RUN uv sync --locked --no-dev --no-cache

COPY . .

EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
