@echo off
chcp 65001 >nul
title AVL Render Tecnici — Clean and Build

echo.
echo ========================================
echo   AVL RENDER TECNICI — Clean and Build
echo ========================================
echo.

cd /d "%~dp0avl-render"
if errorlevel 1 (
    echo ERRORE: Cartella avl-render non trovata.
    pause
    exit /b 1
)

echo [1/4] Pulizia cache Rust...
cd src-tauri
call cargo clean
cd ..
if errorlevel 1 (
    echo ERRORE: cargo clean fallito.
    pause
    exit /b 1
)

echo [2/4] Rimozione build frontend dist...
if exist dist rmdir /s /q dist

echo [3/4] Installazione dipendenze (se necessario)...
call npm install
if errorlevel 1 (
    echo ERRORE: npm install fallito.
    pause
    exit /b 1
)

echo [4/4] Build eseguibile completo...
call npm run tauri build
if errorlevel 1 (
    echo.
    echo ERRORE: Build fallito.
    pause
    exit /b 1
)

echo.
echo ========================================
echo   BUILD COMPLETATO SUCCESSO
echo ========================================
echo.
echo Eseguibile: avl-render\src-tauri\target\release\avl-render-tecnici.exe
echo.
pause
