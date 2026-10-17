@echo off
cd /d "%~dp0"
start "" /b cmd /c "timeout /t 2 >nul && start http://localhost:8000"
python app.py || py app.py
pause
