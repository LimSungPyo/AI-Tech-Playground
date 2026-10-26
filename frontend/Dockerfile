FROM node:24-alpine

WORKDIR /app

# 의존성 먼저 설치해 소스가 바뀌어도 캐시를 쓴다
COPY package.json package-lock.json ./
RUN npm ci

COPY . .

EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"]
