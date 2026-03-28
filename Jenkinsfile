pipeline {
    agent any

    environment {
        BACKEND_IMAGE  = 'ai-travel-backend'
        FRONTEND_IMAGE = 'ai-travel-frontend'
        IMAGE_TAG      = "${BUILD_NUMBER}"
    }

    stages {
        stage('Checkout') {
            steps {
                echo '소스코드 체크아웃 중...'
                checkout scm
            }
        }

        stage('Build Backend') {
            steps {
                echo '백엔드 Docker 이미지 빌드 중...'
                sh """
                    docker build -t ${BACKEND_IMAGE}:${IMAGE_TAG} -t ${BACKEND_IMAGE}:latest .
                """
            }
        }

        stage('Build Frontend') {
            steps {
                echo '프론트엔드 Docker 이미지 빌드 중...'
                sh """
                    docker build -t ${FRONTEND_IMAGE}:${IMAGE_TAG} -t ${FRONTEND_IMAGE}:latest ./frontend
                """
            }
        }

        stage('Test') {
            steps {
                echo '헬스 체크 테스트 실행 중...'
                sh """
                    docker run --rm --name test-backend -d -p 8001:8000 \
                        --env-file .env \
                        ${BACKEND_IMAGE}:${IMAGE_TAG}
                    sleep 5
                    curl -f http://localhost:8001/health || (docker stop test-backend && exit 1)
                    docker stop test-backend
                """
            }
        }

        stage('Deploy') {
            steps {
                echo '컨테이너 배포 중...'
                sh """
                    docker compose down --remove-orphans || true
                    docker compose up -d backend frontend
                """
            }
        }
    }

    post {
        success {
            echo '✅ 배포 성공! AI 여행 가이드가 실행 중입니다.'
        }
        failure {
            echo '❌ 파이프라인 실패. 로그를 확인하세요.'
        }
        always {
            echo '파이프라인 완료.'
        }
    }
}
