@echo off
title HouseHub Backend Server
color 0A
echo ==========================================================
echo    HouseHub - House Rental and Buyer App
echo    Starting Spring Boot Backend (Port: 8080)
echo ==========================================================
echo.
echo [1/2] Checking Java installation...
java -version >nul 2>&1
if %errorlevel% neq 0 (
    color 0C
    echo [ERROR] Java (JDK 17 ya 21) nahi mila!
    echo Kripya JDK 17 ya JDK 21 install karein aur PATH me add karein.
    echo Download link: https://adoptium.net/temurin/releases/
    echo.
    pause
    exit /b 1
)

echo [OK] Java detected!
echo.
echo [2/2] Starting Spring Boot Server...
echo (Pehli baar dependencies download hone me 2-3 minute lag sakte hain)
echo.
cd /d "%~dp0Backend"
call mvnw.cmd spring-boot:run
if %errorlevel% neq 0 (
    color 0C
    echo.
    echo [ERROR] Backend start hone me error aayi!
    echo Check karein ki MySQL service running hai aur application.properties me password sahi hai.
    pause
)
