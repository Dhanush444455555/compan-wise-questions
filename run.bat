@echo off
echo ========================================================
echo   LeetCode Company Wise Problem Navigator (470 Companies)
echo ========================================================
echo.
cd /d "%~dp0"

if not exist leetcode.db (
    echo [1/2] Database not found. Ingesting 470 companies data...
    python ingest.py
) else (
    echo [1/2] Found leetcode.db database ready!
)

echo [2/2] Starting full stack server on http://localhost:8000 ...
echo.
echo Open your browser and navigate to:
echo   http://localhost:8000
echo.
python -m uvicorn server:app --host 0.0.0.0 --port 8000
pause
