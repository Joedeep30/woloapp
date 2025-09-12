@echo off
title WoloApp Auto-Sync to GitHub
echo ========================================
echo WOLOAPP AUTO-SYNC TO GITHUB
echo ========================================
echo This script will automatically sync your changes to GitHub every 30 seconds
echo Press Ctrl+C to stop
echo ========================================
echo.
cd /d "c:\Users\jeffo\Downloads\WoloApp"
powershell -ExecutionPolicy Bypass -File "scripts\auto-sync.ps1"
pause