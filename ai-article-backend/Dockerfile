# --- 1단계: 빌드 환경 ---
# Maven과 JDK가 포함된 이미지를 사용하여 프로젝트를 빌드합니다.
FROM maven:3.9-eclipse-temurin-21-jammy AS builder

# 작업 디렉토리 설정
WORKDIR /app

# 먼저 의존성 관련 파일만 복사하여 의존성을 다운로드합니다.
# 이렇게 하면 소스 코드 변경 시 매번 의존성을 새로 받지 않아 빌드 시간을 단축할 수 있습니다.
COPY pom.xml .
RUN mvn dependency:go-offline

# 전체 소스 코드를 복사합니다.
COPY src ./src

# Maven을 사용하여 프로젝트를 빌드합니다. (-DskipTests=true 옵션으로 테스트는 건너뜁니다)
RUN mvn package -DskipTests

# --- 2단계: 실행 환경 ---
# 빌드된 JAR 파일을 실행하기 위한 가벼운 JRE 이미지를 사용합니다.
FROM eclipse-temurin:21-jre-jammy

# 작업 디렉토리 설정
WORKDIR /app

# 빌드 단계(builder)에서 생성된 JAR 파일을 복사해옵니다.
# target/*.jar 패턴을 사용하여 정확한 파일 이름을 몰라도 됩니다.
COPY --from=builder /app/target/*.jar app.jar

# 8080 포트를 노출합니다.
EXPOSE 8080

# 컨테이너가 시작될 때 애플리케이션 JAR 파일을 실행합니다.
ENTRYPOINT ["java", "-jar", "app.jar"]
