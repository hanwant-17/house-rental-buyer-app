# ==========================================
# 🏠 HouseHub - Backend Launcher Script
# ==========================================

$vscodeJava = "$env:USERPROFILE\.vscode\extensions\redhat.java-1.56.0-win32-x64\jre\21.0.12.1-win32-x86_64"

if (Test-Path $vscodeJava) {
    $env:JAVA_HOME = $vscodeJava
    $env:Path = "$env:JAVA_HOME\bin;" + $env:Path
    Write-Host "✓ Using Java 21 from VS Code: $vscodeJava" -ForegroundColor Green
} else {
    Write-Host "Using default system Java..." -ForegroundColor Yellow
}

Set-Location "$PSScriptRoot\Backend"
Write-Host "Starting HouseHub Spring Boot Application on port 8080..." -ForegroundColor Cyan
.\mvnw.cmd spring-boot:run
