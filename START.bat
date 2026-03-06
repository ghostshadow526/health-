@echo off
echo ================================================================
echo   Starting health+ Server...
echo ================================================================
echo.

REM Run PowerShell server script with execution policy bypass
powershell -ExecutionPolicy Bypass -File "%~dp0start-server.ps1"

pause
