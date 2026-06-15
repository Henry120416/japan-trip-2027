@echo off
chcp 65001 >nul
echo.
echo  ===================================
echo   Japan Trip 2027 - 上傳到 GitHub
echo  ===================================
echo.

:: 檢查 git 是否安裝
git --version >nul 2>&1
if %errorlevel% neq 0 (
  echo  [!] 尚未安裝 Git，請先安裝：
  echo      https://git-scm.com/download/win
  echo.
  start https://git-scm.com/download/win
  pause
  exit /b 1
)

echo  [1] 請先到 github.com 建立一個空白 repo
echo      名稱建議：japan-trip-2027
echo      設為 Public
echo.
echo  [2] 建好後，貼上 repo 的 .git 網址
echo      格式：https://github.com/你的帳號/japan-trip-2027.git
echo.
set /p REPO="  貼上網址 → "

if "%REPO%"=="" (
  echo  未輸入網址，取消。
  pause
  exit /b 1
)

echo.
echo  正在初始化並上傳...
echo.

git init
git add -A
git commit -m "Japan Trip 2027"
git branch -M main
git remote remove origin >nul 2>&1
git remote add origin %REPO%
git push -u origin main

echo.
echo  ===================================
echo   上傳完成！
echo.
echo   接下來去 render.com 部署：
echo   步驟見 README 或詢問 Claude
echo  ===================================
echo.
pause
