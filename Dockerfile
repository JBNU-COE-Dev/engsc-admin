# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# 패키지 파일만 먼저 복사하여 의존성 설치 캐시 최적화
COPY package*.json ./

# 의존성 설치 (프로덕션 의존성도 포함하여 빌드에 필요)
RUN npm ci --only=production=false

# 소스 코드 복사
COPY . .

# 환경 변수 설정 (빌드 타임에 주입)
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
# 관리자 Google 로그인용 (engsc-web의 REACT_APP_GOOGLE_CLIENT_ID와 같은 값). 비우면 버튼 숨김
ARG VITE_GOOGLE_CLIENT_ID
ENV VITE_GOOGLE_CLIENT_ID=${VITE_GOOGLE_CLIENT_ID}

# 빌드 실행
RUN npm run build

# Stage 2: Production
FROM nginx:alpine

# Nginx 설정 파일 복사
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 빌드된 정적 파일 복사
COPY --from=builder /app/dist /usr/share/nginx/html

# 포트 노출
EXPOSE 80

# # 헬스체크 추가 (선택사항)
# HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
#   CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1

# Nginx 실행
CMD ["nginx", "-g", "daemon off;"]
