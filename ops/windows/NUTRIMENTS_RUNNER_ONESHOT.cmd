@echo off
setlocal EnableExtensions
cd /d "%~dp0"
set "CFG=%~dp0NUTRIMENTS_CONFIG.local.cmd"
if not exist "%CFG%" set "CFG=%~dp0NUTRIMENTS_CONFIG.example.cmd"
call "%CFG%"
call "%~dp0NUTRIMENTS_PRECHECK.cmd"
if errorlevel 1 (
  echo [STOP] PRECHECK failed.
  pause
  exit /b 1
)
title NUTRIMENTS RUNNER - %COMPUTERNAME%
call "%NUTRIMENTS_RUNNER_START%"
set "RC=%ERRORLEVEL%"
echo.
echo NUTRIMENTS runner stopped. Exit code: %RC%
echo No automatic restart.
exit /b %RC%
