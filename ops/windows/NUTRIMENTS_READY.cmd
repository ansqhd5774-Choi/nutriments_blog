@echo off
setlocal EnableExtensions
cd /d "%~dp0"

set "CFG=%~dp0NUTRIMENTS_CONFIG.local.cmd"
if not exist "%CFG%" set "CFG=%~dp0NUTRIMENTS_CONFIG.example.cmd"
call "%CFG%"

title NUTRIMENTS READY - %COMPUTERNAME%

echo ============================================================
echo NUTRIMENTS READY
echo PC: %COMPUTERNAME%
echo ============================================================
echo.

call "%~dp0NUTRIMENTS_PRECHECK.cmd"
if errorlevel 1 (
  echo.
  echo [STOP] PRECHECK failed.
  pause
  exit /b 1
)

echo.
echo [1/3] Starting Nutriments runner...
start "NUTRIMENTS RUNNER - %COMPUTERNAME%" cmd /c call "%~dp0NUTRIMENTS_RUNNER_ONESHOT.cmd"
timeout /t 3 /nobreak >nul

echo [2/3] Opening dedicated Tistory login helper...
if exist "%NUTRIMENTS_LOGIN_CMD%" (
  start "NUTRIMENTS LOGIN - %COMPUTERNAME%" cmd /c call "%NUTRIMENTS_LOGIN_CMD%"
) else (
  echo [STOP] login helper missing: %NUTRIMENTS_LOGIN_CMD%
  pause
  exit /b 1
)

echo.
echo ============================================================
echo Complete Tistory/Kakao login in the dedicated Chrome window.
echo Do not enter passwords, OTP, or CAPTCHA into this CMD.
echo When the browser is logged in and ready, return here.
echo ============================================================
echo.
pause

echo.
echo [3/3] Local readiness check...
if not exist "%NUTRIMENTS_PROFILE%" (
  echo [STOP] dedicated profile missing.
  pause
  exit /b 1
)

echo.
echo ============================================================
echo NUTRIMENTS READY
echo Runner launch requested: PASS
echo Dedicated profile: PASS
echo Login confirmation: USER CONFIRMED
echo ============================================================
echo.
echo You can now continue Nutriments blog work in ChatGPT.
pause
exit /b 0
