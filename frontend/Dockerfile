FROM node:24-alpine

# package.json의 packageManager에 적힌 pnpm 버전을 corepack이 받아 쓴다
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable

WORKDIR /app

# 의존성 먼저 설치해 소스가 바뀌어도 캐시를 쓴다
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .

EXPOSE 5173
CMD ["pnpm", "dev", "--host", "0.0.0.0", "--port", "5173"]
