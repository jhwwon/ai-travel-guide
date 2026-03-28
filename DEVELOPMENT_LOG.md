# AI 여행 가이드 개발 과정 기록

## 1단계: 프로젝트 기획 및 환경 설정

### 주요 작업
- 프로젝트 구조 설계
- Python 가상환경 생성 및 패키지 설치
- 환경변수 설정
- LLM 선택 (Gemini → Groq 변경)

### 실행 명령어
```bash
# Python 가상환경 생성
python -m venv .venv

# 가상환경 활성화 (Windows)
.venv\Scripts\activate

# 패키지 설치
pip install -r requirements.txt

# 환경변수 파일 생성 (.env)
GROQ_API_KEY=...
OPENWEATHER_API_KEY=...
```

### 설치 패키지 (requirements.txt)
```
fastapi
uvicorn
langchain
langchain-groq
langchain-community
langchain-huggingface
chromadb
sentence-transformers
python-dotenv
requests
```

### 트러블슈팅
- Windows App execution aliases에서 `python.exe` 별칭 비활성화 필요
- PowerShell 실행 정책 변경: `Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned`

---

## 2단계: LangChain + RAG 백엔드 구현

### 주요 작업
- FastAPI 서버 구현 (`app/main.py`)
- LangChain + Groq LLM 연동 (`app/chain.py`)
- Chroma 벡터DB 구성 (`app/vector_store.py`)
- Wikipedia API로 국내 91개 + 해외 210개 = 301개 여행지 데이터 수집 (`app/data_loader.py`)
- SSE 스트리밍 응답 구현
- 실시간 날씨 API 연동 (OpenWeatherMap)

### 실행 명령어
```bash
# 데이터 수집 및 벡터DB 구축 (최초 1회)
python app/data_loader.py

# 백엔드 서버 실행
uvicorn app.main:app --reload

# API 문서 확인
# http://127.0.0.1:8000/docs
```

### API 엔드포인트
| 엔드포인트 | 메서드 | 설명 |
|-----------|--------|------|
| `/chat` | POST | 일반 채팅 응답 |
| `/chat/stream` | POST | SSE 스트리밍 응답 |
| `/weather/{city}` | GET | 실시간 날씨 조회 |
| `/health` | GET | 서버 상태 확인 |

### 트러블슈팅
- LangChain 1.x 버전 모듈 경로 변경 → LCEL 방식으로 체인 재구성
- Gemini API 무료 할당량 초과 → Groq (LLaMA 3.3 70B)으로 교체
- Wikipedia API 403 오류 → User-Agent 헤더 추가
- SSE 스트리밍 줄바꿈 손실 → `json.dumps()`로 청크 직렬화

---

## 3단계: React 프론트엔드 구현

### 주요 작업
- React 18 + TypeScript 프로젝트 생성
- Tailwind CSS 다크 글래스모피즘 UI 디자인
- SSE 스트리밍 수신 및 실시간 렌더링
- 실시간 날씨 카드 (OpenWeatherMap)
- Leaflet + OpenStreetMap 인터랙티브 지도
- 여행 일정표 자동 파싱 + PDF 다운로드 (jspdf + html2canvas)
- 파비콘 ✈️ 이모지 + 제목 "AI 여행 가이드"
- 대화 기록 저장/불러오기 (sessionStorage)
- 사이드바: 지역별 카테고리 + 추천 질문

### 실행 명령어
```bash
cd frontend

# 패키지 설치
npm install --legacy-peer-deps

# 개발 서버 실행
npm start

# 프로덕션 빌드
npm run build

# 서비스 접속
# http://localhost:3000
```

### 트러블슈팅
- 스트리밍 중 화면 깜빡임 → `streamingContent` state 분리로 해결
- LLM 답변 한자/외래어 혼용 → 시스템 프롬프트에 한국어 전용 규칙 추가
- 일정표 카드 `**` 아티팩트 → 정규식 파싱 개선 (bullet-only 필터)

---

## 4단계: Docker 컨테이너화

### 주요 작업
- 백엔드 Dockerfile 생성 (python:3.10-slim)
- 프론트엔드 Dockerfile 생성 (Node 18 멀티스테이지 → nginx:alpine)
- nginx.conf 생성 (SSE 프록시 설정 포함)
- docker-compose.yml 생성 (backend + frontend 서비스)
- .dockerignore 파일 생성
- 환경변수 파일 분리 (`.env` / `.env.production`)
- 불필요한 파일 정리 (logo192.png, logo512.png, favicon.ico 등)

### 실행 명령어
```bash
# 전체 빌드 및 실행
docker compose up --build

# 백그라운드 실행
docker compose up -d

# 컨테이너 상태 확인
docker compose ps

# 로그 확인
docker compose logs -f backend
docker compose logs -f frontend

# 중지
docker compose down

# 접속
# 프론트엔드: http://localhost:3000
# 백엔드 API: http://localhost:8000
# API 문서: http://localhost:8000/docs
```

### 생성된 파일
| 파일 | 설명 |
|------|------|
| `Dockerfile` | 백엔드 이미지 빌드 |
| `frontend/Dockerfile` | 프론트엔드 멀티스테이지 빌드 |
| `frontend/nginx.conf` | nginx 리버스 프록시 + SSE 설정 |
| `docker-compose.yml` | 멀티 컨테이너 오케스트레이션 |
| `.dockerignore` | Docker 빌드 제외 파일 |
| `frontend/.dockerignore` | 프론트엔드 Docker 빌드 제외 파일 |
| `frontend/.env` | 개발용 API URL |
| `frontend/.env.production` | 프로덕션용 API URL (`/api`) |

### 트러블슈팅
- Docker Desktop 미실행 → Docker Desktop 실행 후 재시도
- `version` 속성 obsolete 경고 → `docker-compose.yml`에서 `version: "3.9"` 제거
- `ModuleNotFoundError: langchain_huggingface` → `requirements.txt`에 `langchain-huggingface`, `sentence-transformers` 추가

---

## 5단계: Jenkins CI/CD 구성

### 주요 작업
- Jenkins Dockerfile 생성 (jenkins:lts-jdk17 + docker.io + docker-compose)
- docker-compose.yml에 Jenkins 서비스 추가
- Jenkinsfile 파이프라인 작성 (Build Backend → Build Frontend → Deploy)
- Jenkins 초기 설정 (플러그인 설치, 관리자 계정 생성)
- Pipeline 생성 및 빌드 성공

### 실행 명령어
```bash
# Jenkins 컨테이너 시작
docker compose up -d jenkins

# Jenkins 초기 비밀번호 확인
docker exec ai-travel-jenkins cat /var/jenkins_home/secrets/initialAdminPassword

# Jenkins 접속
# http://localhost:8080

# Jenkins 재빌드 (Dockerfile 변경 시)
docker compose down jenkins
docker compose build jenkins
docker compose up -d jenkins
```

### Jenkins 파이프라인 단계
| 단계 | 내용 |
|------|------|
| Build Backend | 백엔드 Docker 이미지 빌드 (tar 파이프 방식) |
| Build Frontend | 프론트엔드 Docker 이미지 빌드 |
| Deploy | 기존 컨테이너 제거 후 새 컨테이너 배포 |

### Jenkins UI 설정 순서
1. `http://localhost:8080` 접속
2. 초기 비밀번호 입력
3. "Install suggested plugins" 선택
4. 관리자 계정 생성
5. New Item → Pipeline 생성 → Script 입력 → Save → 지금 빌드

### 최종 Jenkinsfile (Pipeline Script)
```groovy
pipeline {
    agent any

    environment {
        BACKEND_IMAGE  = 'ai-travel-backend'
        FRONTEND_IMAGE = 'ai-travel-frontend'
        IMAGE_TAG      = "${BUILD_NUMBER}"
    }

    stages {
        stage('Build Backend') {
            steps {
                echo '백엔드 Docker 이미지 빌드 중...'
                sh """
                    cd /app && tar -czh --exclude='./.venv' --exclude='./frontend' --exclude='./app/data' . | \
                    docker build -t ${BACKEND_IMAGE}:${IMAGE_TAG} -t ${BACKEND_IMAGE}:latest -
                """
            }
        }

        stage('Build Frontend') {
            steps {
                echo '프론트엔드 Docker 이미지 빌드 중...'
                sh """
                    cd /app/frontend && tar -czh --exclude='./node_modules' --exclude='./build' . | \
                    docker build -t ${FRONTEND_IMAGE}:${IMAGE_TAG} -t ${FRONTEND_IMAGE}:latest -
                """
            }
        }

        stage('Deploy') {
            steps {
                echo '컨테이너 배포 중...'
                sh """
                    docker stop ai-travel-backend ai-travel-frontend || true
                    docker rm ai-travel-backend ai-travel-frontend || true
                    docker-compose -f /app/docker-compose.yml up -d --no-build backend frontend
                """
            }
        }
    }

    post {
        success {
            echo '배포 성공! AI 여행 가이드가 실행 중입니다.'
        }
        failure {
            echo '파이프라인 실패. 로그를 확인하세요.'
        }
        always {
            echo '파이프라인 완료.'
        }
    }
}
```

### 트러블슈팅
- Docker 소켓 권한 오류 → `docker-compose.yml`에 `user: root` 추가
- 빌드 컨텍스트 경로 오류 (`/app` not found) → `c:/ai-travel-guide:/app` 볼륨 마운트 + tar 파이프 방식
- `docker compose -f` 미지원 → Jenkins Dockerfile에 `docker-compose` 패키지 추가
- 컨테이너 이름 충돌 → Deploy 전 `docker stop/rm` 후 `--no-build` 옵션으로 실행

---

## 6단계: Kubernetes (Minikube) 배포

### 주요 작업
- Minikube + kubectl 설치
- Kubernetes 매니페스트 파일 생성 (backend, frontend Deployment + Service)
- Secret으로 환경변수 관리
- Minikube 클러스터 시작 및 배포

### 설치
```bash
# Minikube 설치
winget install Kubernetes.minikube

# kubectl 설치
winget install Kubernetes.kubectl

# 버전 확인
minikube version        # v1.38.1
kubectl version --client  # v1.34.1
```

### 실행 명령어

#### Step 1. Minikube 시작
```bash
minikube start --driver=docker
```
> Kubernetes v1.35.1, Docker 드라이버로 클러스터 생성
> 완료 메시지: `Done! kubectl is now configured to use "minikube" cluster`

---

#### Step 2. Minikube Docker 환경 확인
```bash
minikube docker-env --shell cmd
```
출력 예시:
```
SET DOCKER_TLS_VERIFY=1
SET DOCKER_HOST=tcp://127.0.0.1:62831
SET DOCKER_CERT_PATH=C:\Users\jhwwo\.minikube\certs
SET MINIKUBE_ACTIVE_DOCKERD=minikube
```

---

#### Step 3. Minikube Docker 환경으로 전환
```bash
@FOR /f "tokens=*" %i IN ('minikube -p minikube docker-env --shell cmd') DO @%i
```
> 이 명령어 실행 후 docker 명령이 Minikube 내부 Docker 데몬을 가리킴
> 아무 출력 없이 프롬프트로 돌아오면 정상

---

#### Step 4. Docker 이미지를 Minikube 안에서 빌드
```bash
# 백엔드 이미지 빌드
docker build -t ai-travel-backend:latest .

# 프론트엔드 이미지 빌드
docker build -t ai-travel-frontend:latest ./frontend
```
> `imagePullPolicy: Never` 설정이므로 반드시 Minikube 환경에서 빌드해야 함
> 빌드 확인: `docker images | findstr ai-travel`

---

#### Step 5. 환경변수 Secret 생성
```bash
kubectl create secret generic travel-secrets --from-env-file=.env
```
출력: `secret/travel-secrets created`

Secret 확인:
```bash
kubectl get secret travel-secrets
kubectl describe secret travel-secrets
```

---

#### Step 6. 매니페스트 배포
```bash
# 백엔드 Deployment + ClusterIP Service 배포
kubectl apply -f k8s/backend-deployment.yaml

# 프론트엔드 Deployment + NodePort Service 배포
kubectl apply -f k8s/frontend-deployment.yaml
```
출력 예시:
```
deployment.apps/backend created
service/backend created
deployment.apps/frontend created
service/frontend created
```

---

#### Step 7. 배포 상태 확인
```bash
# Pod 상태 확인
kubectl get pods

# Service 상태 확인
kubectl get services

# 전체 리소스 확인
kubectl get all

# Pod 로그 확인 (문제 발생 시)
kubectl logs -l app=backend
kubectl logs -l app=frontend

# Pod 상세 정보 (문제 발생 시)
kubectl describe pod -l app=backend
```

---

#### Step 8. 서비스 접속
```bash
# 프론트엔드 접속 URL 확인
minikube service frontend --url

# 또는 브라우저로 바로 열기
minikube service frontend

# Minikube 대시보드 (선택)
minikube dashboard
```

---

#### 재배포 시 (코드 변경 후)
```bash
# 1. Minikube Docker 환경 재전환
@FOR /f "tokens=*" %i IN ('minikube -p minikube docker-env --shell cmd') DO @%i

# 2. 이미지 재빌드
docker build -t ai-travel-backend:latest .
docker build -t ai-travel-frontend:latest ./frontend

# 3. Pod 재시작 (새 이미지 적용)
kubectl rollout restart deployment/backend
kubectl rollout restart deployment/frontend

# 4. 롤아웃 상태 확인
kubectl rollout status deployment/backend
kubectl rollout status deployment/frontend
```

---

#### Minikube 종료/삭제
```bash
# 클러스터 일시 중지
minikube stop

# 클러스터 완전 삭제
minikube delete
```

### 생성된 파일
| 파일 | 설명 |
|------|------|
| `k8s/backend-deployment.yaml` | 백엔드 Deployment + ClusterIP Service |
| `k8s/frontend-deployment.yaml` | 프론트엔드 Deployment + NodePort Service (30000) |
| `k8s/secret.yaml.example` | Secret 생성 예시 파일 |

### 아키텍처
```
[사용자]
    ↓
[NodePort 30000]
    ↓
[frontend Pod (nginx)]
    ↓ /api/ 프록시
[ClusterIP:8000]
    ↓
[backend Pod (FastAPI)]
```

---

## 전체 기술 스택 요약

| 영역 | 기술 |
|------|------|
| LLM | Groq (LLaMA 3.3 70B) |
| AI 프레임워크 | LangChain + RAG + Chroma DB |
| 백엔드 | FastAPI + Uvicorn (Python 3.10) |
| 프론트엔드 | React 18 + TypeScript + Tailwind CSS |
| 컨테이너 | Docker + Docker Compose |
| CI/CD | Jenkins (Docker 컨테이너) |
| 오케스트레이션 | Kubernetes (Minikube) |
| 데이터 | Wikipedia API (301개 여행지) |
| 날씨 | OpenWeatherMap API |
| 지도 | OpenStreetMap + Leaflet |
