# AI_Tech_Playground

> AI 기술을 **게임처럼 직접 실험해 보며** 배우는 인터랙티브 플랫폼
> 

AI 기술을 글로 읽기만 하지 않고, 직접 훈련하고 결과를 확인하며 배웁니다. 
결과를 보다가 궁금하면 **WHY?** 로 "AI가 왜 그렇게 판단했는지" 물어볼 수 있습니다. 실험은 강화학습 · 언어 모델 · 비전 · RAG · 에이전트 등 다양한 주제를 다룹니다.

---

## **핵심 기능**

- **실험 플레이**: 1회 실행, ×10 훈련을 하며 회차별 성공률과 결과를 시각화
- **WHY? 설명**: AI의 판단 근거를 사용자 수준(입문 / 중급 / 고급)에 맞춰 설명
- **예측하기**: 실험 전에 결과를 예측하고 실제 결과와 비교
- **기술 트리 · 기술 카드**: 실험을 완료하면 다음 기술 노드와 기술 카드가 해금
- **실험 추천**: 관심사 · 수준 · 플레이 기록을 바탕으로 다음 실험 추천
- **랭킹 · 공유**: 실험별 랭킹, 결과 공유 이미지 및 링크
- **기술 레이더**: 매주 월요일 기술 트렌드를 수집해 키워드 제공
- **관리자 콘솔**: 실험 · 사용자 · 문의/신고 · 레이더 운영 (별도 URL + 재인증)

---

## **사용자 흐름**

```
비회원   홈 → 게스트 체험 → 가입 유도
첫 로그인 가입 → 온보딩(관심사 · 수준) → 실험 추천 → 첫 실험
메인     홈 → 실험실 → 실험 상세 → 예측 → 플레이 ⇄ WHY? → 결과 리포트 → 기술 카드 / 기술 트리
마이     대시보드 · 내 실험 · 학습 기록 · 설정 · 알림 · 문의
관리자   관리자 URL 또는 프로필 메뉴 → 재인증(OTP + IP 확인) → 관리자 콘솔
```

---

## **기술 스택**

| **영역** | **기술** |
| --- | --- |
| Frontend | React 19 · TypeScript · Vite · React Router 7 · CSS Modules |
| Backend | FastAPI · Pydantic v2 · SQLAlchemy 2 (psycopg 3) |
| DB | PostgreSQL 16 |
| 실행 환경 | Docker Compose |

---

## **현재 구현 상태**

| **영역** | **상태** |
| --- | --- |
| 화면 | Figma 기획안의 화면 구현 완료 (관리자 콘솔 포함). 장기 컨셉 2개(Create Your AI, RAG 탐정)는 "준비 중" 화면 |
| API | 모든 엔드포인트와 요청 · 응답 스키마 완성. 응답은 `backend/app/fixtures/`의 샘플 데이터 |
| DB | 테이블만 생성. 아직 읽기 · 쓰기 없음 (저장 동작은 성공 응답만 돌려주고 새로고침하면 원래 값) |
| 인증 | 가짜 로그인. 어떤 계정으로 들어가도 샘플 사용자 "혜원"으로 처리 (비밀번호 검증 · JWT 없음) |
| AI · 학습 | 미연동. 플레이 결과 · ×10 훈련 · WHY? 설명 · 성장 곡선은 모두 샘플 값 (학습 시뮬레이션 · Claude API 없음) |

실제 로직이 들어갈 자리는 `backend/app/services/`의 각 함수에 `TODO`로 적어 두었습니다. 응답 형태는 고정돼 있어서 서비스 함수 안만 바꾸면 프론트는 그대로 동작합니다.

---

## **폴더 구조**

```
ai-tech-playground/
├── docker-compose.yml   # db + backend + frontend 한 번에 실행
├── frontend/            # React + Vite
│   ├── Dockerfile
│   └── src/
│       ├── pages/
│       ├── components/
│       └── api/
└── backend/             # FastAPI
    ├── Dockerfile
    ├── requirements.txt
    ├── scripts/
    │   └── smoke_test.py    # 전체 API 스모크 테스트
    └── app/
        ├── main.py          # 앱 · CORS · /health · 라우터 등록
        ├── db.py            # SQLAlchemy 엔진 · 세션
        ├── core/            # 설정 · 인증 의존성 · 오류 형식
        ├── api/             # 라우터 (auth · users · experiments · content · support · admin)
        ├── schemas/         # Pydantic 스키마 (camelCase JSON)
        ├── models/          # SQLAlchemy 모델
        ├── services/        # 도메인 로직 (지금은 샘플 반환)
        └── fixtures/        # Figma 화면과 같은 샘플 데이터
```

---

## **시작하기**

### **Docker로 한 번에 실행 (권장)**

Docker Desktop을 켠 뒤 저장소 루트에서:

```
docker compose up --build    # 처음 한 번: 이미지를 만들고 실행
docker compose up            # 그다음부터: 만들어 둔 이미지로 실행
```

`--build`는 아래 파일을 바꿨을 때만 다시 붙이면 됩니다. 소스 코드만 고쳤다면 필요 없습니다.

| 바꾼 파일 | 실행 명령 |
| --- | --- |
| `backend/requirements.txt`, `backend/Dockerfile` | `docker compose up --build` |
| `frontend/package.json`, `package-lock.json`, `frontend/Dockerfile` | `docker compose up --build -V` |

프론트의 `node_modules`는 별도 볼륨에 있어서, 이미지만 새로 만들면 예전 패키지가 남습니다. `-V`를 붙이면 이 볼륨을 새 이미지 기준으로 다시 만듭니다.

| 서비스 | 주소 |
| --- | --- |
| 웹 (Vite) | http://localhost:5173 |
| API 문서 | http://localhost:8000/docs |
| PostgreSQL | localhost:5432 (`playground` / `playground`, DB `ai_playground`) |

- `backend/`, `frontend/` 소스가 컨테이너에 마운트돼 있어 저장하면 바로 다시 로드됩니다.
- 포트가 겹치면 `FRONTEND_PORT=5174 BACKEND_PORT=8001 DB_PORT=5433 docker compose up`처럼 바꿀 수 있습니다.
- 종료는 `docker compose down`, DB 데이터까지 지우려면 `docker compose down -v`.
- 지금 API는 DB를 읽지 않고 Figma 화면과 같은 샘플 데이터를 돌려줍니다. 시작할 때 테이블만 만듭니다.

### **로컬에서 직접 실행**

```
# Backend (DB 없이도 뜨고, 테이블 생성만 건너뜁니다)
cd backend
python3.12 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload          # http://localhost:8000/docs
python scripts/smoke_test.py http://127.0.0.1:8000   # 다른 터미널에서 API 확인

# Frontend
cd frontend
npm install
npm run dev                            # http://localhost:5173
```

### **개발용 테스트 입력**

인증이 가짜라서 아래 입력으로 오류 · 관리자 화면을 확인할 수 있습니다.

| 입력 | 결과 |
| --- | --- |
| 아무 이메일 · 비밀번호 | 샘플 사용자 "혜원"으로 로그인 |
| `admin`으로 시작하는 이메일 | 관리자 계정 (프로필 메뉴 → 관리자 콘솔) |
| 비밀번호 `wrong` | 비밀번호 오류 (401) |
| 비밀번호 `locked` | 계정 잠김 (423) |
| 인증 코드 `000000` | 인증 코드 오류 |
| 관리자 OTP `999999` | IP 차단 화면 |

공통 UI 컴포넌트와 팝업은 http://localhost:5173/_kit 에서 한눈에 볼 수 있습니다 (메뉴에는 없음).

### **환경 변수**

backend (기본값이 있어 `.env` 없이도 실행됩니다)

```
DATABASE_URL=postgresql+psycopg://playground:playground@localhost:5432/ai_playground
JWT_SECRET=<랜덤 문자열>
CORS_ORIGINS=http://localhost:3000     # 쉼표로 구분. 5173은 기본 허용
```

frontend

```
VITE_API_PROXY=http://localhost:8000   # Vite 개발 서버가 /api 요청을 넘길 주소
```
