@echo off
set "TISTORY_CHROME_PATH=C:\Program Files\Google\Chrome\Application\chrome.exe"
set "TISTORY_PROFILE_DIR=C:\tistory-nutriments\profile"
set "PATH=C:\Users\c06\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin;%PATH%"
cd /d C:\Users\c06\Documents\Codex\nutriments-recovery\source
node publishing/login.mjs
