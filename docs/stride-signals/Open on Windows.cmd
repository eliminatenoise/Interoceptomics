@echo off
setlocal
set "page=%~dp0index.html"
if exist "%~dp0docs\stride-signals\index.html" set "page=%~dp0docs\stride-signals\index.html"
start "" "%page%"
