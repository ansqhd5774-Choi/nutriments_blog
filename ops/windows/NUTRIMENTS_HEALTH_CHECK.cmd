@echo off
setlocal EnableExtensions
cd /d "%~dp0"
set "CFG=%~dp0NUTRIMENTS_CONFIG.local.cmd"
if not exist "%CFG%" set "CFG=%~dp0NUTRIMENTS_CONFIG.example.cmd"
call "%CFG%"
echo ============================================================
echo NUTRIMENTS HEALTH CHECK
echo PC: %COMPUTERNAME%
echo ============================================================
tasklist /FI "IMAGENAME eq Runner.Listener.exe" 2>nul | find /I "Runner.Listener.exe"
if errorlevel 1 echo [INFO] Runner.Listener.exe not detected.
tasklist /FI "IMAGENAME eq Runner.Worker.exe" 2>nul | find /I "Runner.Worker.exe"
if errorlevel 1 echo [INFO] Runner.Worker.exe not active. Normal while idle.
if exist "%NUTRIMENTS_PROFILE%" (echo [PASS] profile exists) else (echo [WARN] profile missing)
if exist "%NUTRIMENTS_LOGIN_CMD%" (echo [PASS] login helper exists) else (echo [WARN] login helper missing)
echo.
echo Login validity cannot be proven by this check.
pause
