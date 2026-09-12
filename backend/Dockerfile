# ── Stage 1: build the fat JAR ────────────────────────────────
FROM eclipse-temurin:11-jdk AS builder

WORKDIR /app

# Copy maven wrapper and pom first for layer caching
COPY pom.xml .
COPY src ./src

# Build — skip tests (they run separately in CI)
RUN apt-get update && apt-get install -y --no-install-recommends maven && \
    mvn clean package -DskipTests -q && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# ── Stage 2: minimal runtime image ────────────────────────────
FROM eclipse-temurin:11-jre

WORKDIR /app

# Create a non-root user
RUN groupadd -r spring && useradd -r -g spring spring

COPY --from=builder /app/target/*.jar app.jar

RUN mkdir -p /app/logs && chown -R spring:spring /app
USER spring

EXPOSE 8080

ENTRYPOINT ["java", "-XX:+UseContainerSupport", "-XX:MaxRAMPercentage=75.0", \
            "-Djava.security.egd=file:/dev/./urandom", \
            "-jar", "app.jar"]
