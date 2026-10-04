@echo off
setlocal EnableExtensions
cd /d "%~dp0\.."

where git >nul 2>&1 || (echo E_GIT_REQUIRED& exit /b 1)
where gh >nul 2>&1 || (echo E_GH_CLI_REQUIRED& exit /b 1)

gh auth status -h github.com >nul 2>&1 || (echo E_GH_AUTH_REQUIRED& exit /b 1)

gh repo view ansqhd5774-Choi/nutriments_blog >nul 2>&1
if not errorlevel 1 (
  echo REPO_ALREADY_EXISTS ansqhd5774-Choi/nutriments_blog
  gh repo view ansqhd5774-Choi/nutriments_blog --json nameWithOwner,isPrivate,defaultBranchRef
  exit /b 0
)

for /f "usebackq delims=" %%B in (`git branch --show-current`) do set "BRANCH=%%B"
if /I not "%BRANCH%"=="main" (echo E_MAIN_BRANCH_REQUIRED& exit /b 1)

git diff --quiet || (echo E_WORKTREE_NOT_CLEAN& exit /b 1)
git diff --cached --quiet || (echo E_WORKTREE_NOT_CLEAN& exit /b 1)

gh repo create ansqhd5774-Choi/nutriments_blog --private --source=. --remote=origin --push || (echo E_REPO_CREATE_FAILED& exit /b 1)

gh repo view ansqhd5774-Choi/nutriments_blog --json nameWithOwner,isPrivate,defaultBranchRef || (echo E_REPO_VERIFY_FAILED& exit /b 1)

echo REPO_BOOTSTRAP_PASS
exit /b 0
