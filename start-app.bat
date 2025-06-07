@echo off
echo Starting Bio Data Analysis Application...

call ..\venv\Scripts\activate

:: Start React app
start cmd /k "cd bio-data-analysis-fe && npm run dev"

:: Wait for React app to start
timeout /t 1

:: Start Electron app
start cmd /k "cd desktop-app && npm run dev"

:: Wait for Electron app to start
timeout /t 1

echo Application started successfully! 