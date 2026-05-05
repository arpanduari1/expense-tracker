FROM maven:3.9.6-eclipse-temurin-21 AS builder
WORKDIR /app

COPY pom.xml .
RUN mvn dependency:go-offline -B; \
    find /root/.m2/repository -name "*.jar" -empty -delete && \
    find /root/.m2/repository -name "*.lastUpdated" -delete && \
    mkdir -p /root/.m2/repository/xml-apis/xml-apis-ext/1.3.04 && \
    mkdir -p /tmp/placeholder && \
    jar cf /root/.m2/repository/xml-apis/xml-apis-ext/1.3.04/xml-apis-ext-1.3.04.jar \
    -C /tmp/placeholder .

COPY src ./src
RUN mvn clean package -DskipTests -B

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
RUN addgroup --system appgroup && adduser --system --ingroup appgroup appuser
COPY --from=builder /app/target/*.jar app.jar
USER appuser
EXPOSE 8080
ENV JAVA_TOOL_OPTIONS="\
    -Xms256m -Xmx768m -XX:+UseG1GC -XX:MaxGCPauseMillis=200 \
    -XX:+UseStringDeduplication -XX:+OptimizeStringConcat \
    -XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0 \
    -Djava.security.egd=file:/dev/./urandom"
ENTRYPOINT ["java", "-jar", "app.jar"]