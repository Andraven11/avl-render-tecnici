# Script per inizializzare Git e creare repo GitHub
# Esegui da: c:\Users\andre\Desktop\render tecnici

Set-Location $PSScriptRoot

Write-Host "1. git init..."
git init
if ($LASTEXITCODE -ne 0) { exit 1 }

Write-Host "2. git add..."
git add .
if ($LASTEXITCODE -ne 0) { exit 1 }

Write-Host "3. git commit..."
git commit -m "Initial commit: AVL Render Tecnici - generatore disegni tecnici LEDwall"
if ($LASTEXITCODE -ne 0) { exit 1 }

Write-Host "4. gh repo create..."
gh repo create avl-render-tecnici --public --source=. --remote=origin --push --description "Generatore disegni tecnici LEDwall"
if ($LASTEXITCODE -ne 0) {
    Write-Host "Se il repo esiste gia, collega manualmente:"
    Write-Host "  git remote add origin https://github.com/TUO_USERNAME/avl-render-tecnici.git"
    Write-Host "  git branch -M main"
    Write-Host "  git push -u origin main"
    exit 1
}

Write-Host "Completato! Repo: https://github.com/$(gh api user -q .login)/avl-render-tecnici"
