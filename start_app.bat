@echo off
REM Clear the ELECTRON_RUN_AS_NODE environment variable
set ELECTRON_RUN_AS_NODE=
cd /d "c:\Users\LUTA\.gemini\antigravity\scratch\DemoProWin"
echo Starting DemoProWin annotation tool...
call npm start
