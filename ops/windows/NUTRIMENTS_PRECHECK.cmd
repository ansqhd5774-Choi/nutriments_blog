@echo off
setlocal EnableExtensions
cd /d "%~dp0"
set "CFG=%~dp0NUTRIMENTS_CONFIG.local.cmd"
if not exist "%CFG%" set "CFG=%~dp0NUTRIMENTS_CONFIG.example.cmd"
call "%CFG%"
set "ERR=0"
echo ============================================================
echo NUTRIMENTS RUNNER PRECHECK
echo PC: %COMPUTERNAME%
echo ============================================================
if exist "%NUTRIMENTS_RUNNER_START%" (echo [PASS] runner start) else (echo [FAIL] runner start missing & set "ERR=1")
if exist "%NUTRIMENTS_LOGIN_CMD%" (echo [PASS] login helper) else (echo [WARN] login helper missing)
if exist "%NUTRIMENTS_PROFILE%" (echo [PASS] dedicated profile) else (echo [WARN] dedicated profile missing)
if exist "%NUTRIMENTS_CHROME%" (echo [PASS] Chrome) else (echo [WARN] Chrome path missing)
where git.exe >nul 2>&1
if errorlevel 1 (echo [WARN] git.exe not found) else (echo [PASS] git.exe)
if "%ERR%"=="1" exit /b 1
exit /b 0
