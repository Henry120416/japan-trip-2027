@echo off
chcp 65001 >nul
echo.
echo  ╔══════════════════════════════════╗
echo  ║   Japan Trip 2027  一鍵部署     ║
echo  ╚══════════════════════════════════╝
echo.

:: ── Step 1: 安裝 GitHub CLI ──────────────────────────
gh --version >nul 2>&1
if %errorlevel% equ 0 goto STEP2

echo  [1/4] 安裝 GitHub CLI...
winget install --id GitHub.cli -e --silent --accept-source-agreements --accept-package-agreements
if %errorlevel% neq 0 (
  echo.
  echo  winget 安裝失敗，請手動到以下網址下載安裝後重試：
  echo  https://cli.github.com
  start https://cli.github.com
  pause
  exit /b 1
)
echo  [1/4] GitHub CLI 安裝完成 ✓
echo  ⚠  請關閉此視窗，重新雙擊執行一次。
pause
exit /b 0

:STEP2
echo  [1/4] GitHub CLI ✓
echo.

:: ── Step 2: 登入 GitHub ──────────────────────────────
gh auth status >nul 2>&1
if %errorlevel% equ 0 (
  echo  [2/4] 已登入 GitHub ✓
) else (
  echo  [2/4] 登入 GitHub（即將開啟瀏覽器，點授權即可）...
  echo.
  gh auth login --web --git-protocol https
  if %errorlevel% neq 0 (
    echo  登入失敗，請重試。
    pause
    exit /b 1
  )
  echo  [2/4] 登入成功 ✓
)
echo.

:: ── Step 3: 上傳到 GitHub ────────────────────────────
echo  [3/4] 上傳程式碼到 GitHub...
cd /d C:\JapanTrip2027

git init >nul 2>&1
git add -A >nul 2>&1
git commit -m "Japan Trip 2027" >nul 2>&1
git branch -M main >nul 2>&1
git remote remove origin >nul 2>&1

gh repo create japan-trip-2027 --public --source=. --push --description "大阪京都旅遊行程 2027"
if %errorlevel% neq 0 (
  echo.
  echo  ⚠  Repo 可能已存在，嘗試直接推送...
  git remote add origin https://github.com/$(gh api user --jq .login)/japan-trip-2027.git >nul 2>&1
  git push -u origin main --force
)
echo  [3/4] 上傳完成 ✓
echo.

:: ── Step 4: 開啟 Render ──────────────────────────────
echo  [4/4] 開啟 Render 部署頁面...
start https://render.com
echo.
echo  ══════════════════════════════════════════════
echo.
echo   程式碼已上傳！最後 3 個點擊完成部署：
echo.
echo   1. render.com → "Get Started for Free"
echo   2. 選 "Sign up with GitHub"（一鍵登入）
echo   3. Dashboard → New → Blueprint Instance
echo      → 選 japan-trip-2027 → Apply
echo.
echo   等約 2 分鐘，Render 自動建好資料庫+網站
echo   會給你一個 .onrender.com 網址，分給大家！
echo.
echo  ══════════════════════════════════════════════
echo.
pause
