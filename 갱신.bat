@echo off
chcp 65001 > nul
cd /d "%~dp0"
echo [1인 수의계약 모니터] 새로 올라온 계약을 받아옵니다.
echo.
python scripts\update.py
echo.
echo 끝났습니다. 화면은 npm run dev 로 엽니다.
pause
