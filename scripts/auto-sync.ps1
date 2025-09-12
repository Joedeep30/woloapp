# PowerShell script for automatically syncing changes to GitHub
# This script watches for file changes and automatically commits and pushes to GitHub

 param(
    [string]$Path = "c:\Users\jeffo\Downloads\WoloApp",
    [int]$Interval = 30
)

Write-Host "🔄 Auto-sync to GitHub started..." -ForegroundColor Green
Write-Host "Watching directory: $Path" -ForegroundColor Yellow
Write-Host "Check interval: $Interval seconds" -ForegroundColor Yellow
Write-Host "Press Ctrl+C to stop" -ForegroundColor Cyan

# Store the initial state
$lastCheck = Get-Date

function Sync-ToGitHub {
    try {
        Write-Host "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') - Checking for changes..." -ForegroundColor Gray
        
        # Check if there are any changes
        $status = git status --porcelain
        if ($status) {
            Write-Host "Changes detected, syncing to GitHub..." -ForegroundColor Yellow
            
            # Add all changes
            git add .
            
            # Commit with timestamp
            $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
            $commitMessage = "Auto-sync: $timestamp"
            git commit -m "$commitMessage"
            
            # Push to GitHub
            git push origin main
            
            Write-Host "✅ Sync completed successfully!" -ForegroundColor Green
        } else {
            Write-Host "No changes detected" -ForegroundColor Gray
        }
    }
    catch {
        Write-Host "❌ Error during sync: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Initial sync
Sync-ToGitHub

# Continuous monitoring
while ($true) {
    Start-Sleep -Seconds $Interval
    Sync-ToGitHub
}