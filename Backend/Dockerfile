# ==========================================
# 🐳 Multi-Stage Dockerfile for Spring Boot
# ==========================================

# Stage 1: Build the Application with Maven & JDK 17
FROM maven:3.9.6-eclipse-temurin-17 AS build
WORKDIR /app

# Cache dependencies layer
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copy source code and build production jar
COPY src ./src
RUN mvn clean package -DskipTests

# Stage 2: Minimal Production JRE Runtime
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

# Create a non-root application user for security
RUN addgroup -S spring && adduser -S spring -G spring
USER spring:spring

# Copy built jar from previous stage
COPY --from=build /app/target/*.jar app.jar

# Expose standard port (can be overridden by $PORT)
EXPOSE 8080

# Run Spring Boot Application
ENTRYPOINT ["java", "-Djava.security.egd=file:/dev/./urandom", "-jar", "app.jar"]
