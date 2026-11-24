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
├── .env.example         # 환경 변수 목록 (복사해서 .env로 사용)
├── docker-compose.yml   # db + backend + frontend 한 번에 실행
├── frontend/            # React + Vite
│   ├── Dockerfile
│   ├── package.json     # 의존성 목록 · pnpm 버전 (packageManager)
│   ├── pnpm-lock.yaml
│   └── src/
│       ├── pages/
│       ├── components/
│       └── api/
└── backend/             # FastAPI
    ├── Dockerfile
    ├── pyproject.toml   # 의존성 목록 (uv)
    ├── uv.lock          # 하위 의존성까지 고정한 버전
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
cp .env.example .env         # 처음 한 번: 환경 변수 파일 만들기 (아래 환경 변수 참고)
docker compose up --build    # 처음 한 번: 이미지를 만들고 실행
docker compose up            # 그다음부터: 만들어 둔 이미지로 실행
```

`--build`는 아래 파일을 바꿨을 때만 다시 붙이면 됩니다. 소스 코드만 고쳤다면 필요 없습니다.

| 바꾼 파일 | 실행 명령 |
| --- | --- |
| `backend/pyproject.toml`, `uv.lock`, `backend/Dockerfile` | `docker compose up --build` |
| `frontend/package.json`, `pnpm-lock.yaml`, `frontend/Dockerfile` | `docker compose up --build -V` |

프론트의 `node_modules`는 별도 볼륨에 있어서, 이미지만 새로 만들면 예전 패키지가 남습니다. `-V`를 붙이면 이 볼륨을 새 이미지 기준으로 다시 만듭니다.

`.env.example` 값 그대로 쓸 때의 주소입니다.

| 서비스 | 주소 |
| --- | --- |
| 웹 (Vite) | http://localhost:5173 |
| API 문서 | http://localhost:8000/docs |
| PostgreSQL | localhost:5432 (`playground` / `playground`, DB `ai_playground`) |

- `backend/`, `frontend/` 소스가 컨테이너에 마운트돼 있어 저장하면 바로 다시 로드됩니다.
- 포트가 겹치면 `.env`의 `FRONTEND_PORT` · `BACKEND_PORT` · `DB_PORT`를 바꿉니다.
- DB와 API 포트는 이 컴퓨터(`127.0.0.1`)에서만 열립니다. 웹(5173)은 휴대폰 확인용으로 같은 와이파이에도 열려 있으니 공용 와이파이에서는 주의합니다.
- 종료는 `docker compose down`, DB 데이터까지 지우려면 `docker compose down -v`.
- 지금 API는 DB를 읽지 않고 Figma 화면과 같은 샘플 데이터를 돌려줍니다. 시작할 때 테이블만 만듭니다.

### **로컬에서 직접 실행**

루트에 `.env`가 있어야 합니다. (`cp .env.example .env`)

필요한 도구와 버전입니다. 버전은 저장소의 파일에 적혀 있습니다.

| 도구 | 버전 | 정해 둔 곳 |
| --- | --- | --- |
| Python | 3.12 | `backend/.python-version`, `pyproject.toml` |
| uv | 0.10 이상 | |
| Node.js | 24 | `frontend/.nvmrc`, `package.json`의 `engines` |
| pnpm | 12.21.0 | `package.json`의 `packageManager` |

**처음 한 번: 도구 설치**

```
# Node 24 (nvm 기준, .nvmrc를 읽습니다)
cd frontend
nvm install                # Node 24 설치
nvm use                    # 이 터미널에서 Node 24 사용
nvm alias default 24       # 새 터미널도 24로 시작 (선택)

# pnpm: Node 24로 바꾼 다음에 켭니다. corepack은 Node 버전마다 따로 켜야 합니다.
corepack enable            # packageManager에 적힌 pnpm 12.21.0을 알아서 받아 씀

# uv: Python 3.12가 없으면 uv sync가 알아서 받습니다
brew install uv
```

**실행**

```
# Backend (DB 없이도 뜨고, 테이블 생성만 건너뜁니다)
cd backend
uv sync                                # .venv를 만들고 uv.lock 그대로 설치
uv run uvicorn app.main:app --reload   # http://localhost:8000/docs
uv run python scripts/smoke_test.py http://127.0.0.1:8000   # 다른 터미널에서 API 확인

# Frontend
cd frontend
pnpm install
pnpm dev                               # http://localhost:5173
```

- uv는 0.10 이상이어야 합니다(`uv --version`). 0.9 이하는 `uv.lock`을 예전 형식으로 다시 써 버려서 그대로 커밋하면 CI가 실패합니다. `brew upgrade uv`로 올립니다.
- `source .venv/bin/activate`는 하지 않아도 됩니다. `uv run`이 `backend/.venv`를 알아서 씁니다.
- IDE에서 Python 인터프리터는 `backend/.venv/bin/python`을 고릅니다.
- `uv.lock`이나 `pnpm-lock.yaml`이 바뀐 코드를 받았다면 `uv sync`, `pnpm install`을 다시 실행합니다.

**npm · pip로 세팅해 둔 환경에서 옮겨 오는 경우**

예전 방식으로 깔린 폴더가 남아 있으면 지우고 다시 설치합니다.

```
rm -rf frontend/node_modules && (cd frontend && pnpm install)
rm -rf backend/.venv && (cd backend && uv sync)   # pip로 만든 .venv가 있었다면
docker compose up --build -V                      # Docker: 이미지와 node_modules 볼륨을 새로 만듦
```

npm · pip를 쓰던 브랜치와 오가며 작업하면 브랜치를 바꿀 때마다 위처럼 다시 설치해야 할 수 있습니다.

패키지를 추가하거나 뺄 때는 lock 파일이 같이 바뀌도록 명령으로 합니다. 파일을 직접 고쳤다면 backend는 `uv lock`, frontend는 `pnpm install`을 한 번 실행합니다.

```
cd backend  && uv add <패키지>    # 빼기: uv remove <패키지>
cd frontend && pnpm add <패키지>  # 개발용은 pnpm add -D, 빼기: pnpm remove <패키지>
```

나온 지 3일이 안 된 버전은 설치되지 않습니다. 공급망 공격으로 올라온 악성 버전은 보통 며칠 안에 발견돼 내려가기 때문입니다. 설정은 `frontend/pnpm-workspace.yaml`의 `minimumReleaseAge`, `backend/pyproject.toml`의 `exclude-newer`에 있고, 의존성 업데이트 PR(`.github/dependabot.yml`)도 같은 기준으로 3일을 기다립니다. 급한 보안 패치처럼 바로 받아야 하면 frontend는 `minimumReleaseAgeExclude`에 패키지 이름을, backend는 `exclude-newer-package`에 `패키지 = false`를 넣습니다.

Dependabot은 매주 dev로 업데이트 PR을 올립니다. 마이너·패치는 생태계마다 PR 하나로 묶고, 메이저는 패키지마다 따로 올리니 하나씩 보고 받거나 닫습니다(닫으면 그 버전은 다시 올라오지 않습니다). Python·Node·PostgreSQL 버전을 올리는 PR은 오지 않습니다. 이 셋은 직접 정해서 관련 파일을 같이 바꿉니다. PR마다 CI가 돌고, 결과는 Discord가 아니라 PR 화면에서 봅니다. Dependabot 설정은 기본 브랜치(main)에 있는 파일을 읽으므로 바꾼 설정은 main에 들어가야 적용됩니다.

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

환경 변수는 레포 루트의 `.env` 하나로만 관리합니다. 코드에는 기본값이 없어서, 실행하기 전에 먼저 `.env`를 만들어야 합니다.

```
cp .env.example .env
```

docker compose, backend(로컬 uvicorn), frontend(로컬 Vite)가 모두 이 파일을 읽습니다. 변수 목록과 설명은 `.env.example`에 있습니다.
