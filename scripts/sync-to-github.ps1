# PowerShell script to automatically sync changes to GitHub

Write-Host "🔄 Starting GitHub sync process..." -ForegroundColor Green

try {
    # Check current git status
    Write-Host "🔍 Checking git status..." -ForegroundColor Yellow
    git status --porcelain

    # Add all changes
    Write-Host "➕ Adding all changes..." -ForegroundColor Yellow
    git add .

    # Get current timestamp for commit message
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $commitMessage = "Auto-sync: $timestamp"

    # Commit changes
    Write-Host "📝 Committing changes..." -ForegroundColor Yellow
    git commit -m "$commitMessage"

    # Push to GitHub
    Write-Host "🚀 Pushing to GitHub..." -ForegroundColor Yellow
    git push origin main

    Write-Host "✅ Successfully synced to GitHub!" -ForegroundColor Green
}
catch {
    Write-Host "❌ Error during GitHub sync: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}