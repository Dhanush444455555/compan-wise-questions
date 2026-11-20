Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  LeetCode Company Wise Problem Navigator (470 Companies)" -ForegroundColor Yellow
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""

Set-Location $PSScriptRoot

if (-not (Test-Path "leetcode.db")) {
    Write-Host "[1/2] Database not found. Ingesting 470 companies data..." -ForegroundColor Green
    python ingest.py
} else {
    Write-Host "[1/2] Database leetcode.db is ready." -ForegroundColor Green
}

Write-Host "[2/2] Starting server on http://localhost:8000 ..." -ForegroundColor Cyan
Write-Host "Open in browser: http://localhost:8000" -ForegroundColor Yellow
Write-Host ""

python -m uvicorn server:app --host 0.0.0.0 --port 8000
