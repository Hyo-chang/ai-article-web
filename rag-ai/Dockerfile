# 1. 베이스 이미지 선택 (Python 3.11 사용)
FROM python:3.11-slim

# 2. 작업 디렉토리 설정
WORKDIR /app

# 3. 의존성 파일 복사 및 설치
# 소스 코드보다 의존성 파일을 먼저 복사하면, 코드만 변경되었을 때 불필요한 의존성 재설치를 방지하여 빌드 속도를 높일 수 있습니다.
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 4. 나머지 소스 코드 전체 복사
COPY . .

# 5. 컨테이너가 노출할 포트 설정
EXPOSE 8020

# 6. 컨테이너가 시작될 때 실행할 기본 명령어
# --host 0.0.0.0 옵션으로 컨테이너 외부에서의 접속을 허용합니다.
CMD ["uvicorn", "api_main:app", "--host", "0.0.0.0", "--port", "8020"]
