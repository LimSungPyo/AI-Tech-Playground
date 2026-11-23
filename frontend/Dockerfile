# 베이스 이미지는 태그가 가리키는 내용이 바뀌지 않게 해시로 고정한다. 해시는 Dependabot이 올린다.
FROM node:24-alpine@sha256:116b800c3754b440ee0aa3ed2f20f5bf3d99a554bfd9adeea09ea8017f6e85f5

# package.json의 packageManager에 적힌 pnpm 버전을 corepack이 받아 쓴다
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable

WORKDIR /app

# 의존성 먼저 설치해 소스가 바뀌어도 캐시를 쓴다. pnpm-workspace.yaml에 설치 제한 설정이 있다.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .

EXPOSE 5173
CMD ["pnpm", "dev", "--host", "0.0.0.0", "--port", "5173"]
