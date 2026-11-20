@echo off
setlocal
cd /d "%~dp0"
where py >nul 2>&1
if errorlevel 1 (
    python predict.py
) else (
    py -3 predict.py
)
set "result=%ERRORLEVEL%"
if not "%result%"=="0" echo This example needs Python 3 and NumPy. See README.md for setup.
pause
exit /b %result%
