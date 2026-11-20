# 🚀 LeetCode Company-Wise Problem Navigator

A high-performance, full-stack application that indexes and organizes **36,347 interview question records** across **470 tech companies**, categorized across 5 distinct timeframes (30 Days, 3 Months, 6 Months, > 6 Months, and All Time).

![Tech Stack](https://img.shields.io/badge/Backend-FastAPI%20%7C%20Python%203-blue)
![Database](https://img.shields.io/badge/Database-SQLite%20(Indexed)-emerald)
![Frontend](https://img.shields.io/badge/Frontend-TailwindCSS%20%7C%20Vanilla%20JS-orange)
![Companies](https://img.shields.io/badge/Companies-470%20Covered-purple)

---

## 🌟 Key Features

1. **🏢 Company Directory (470 Companies)**:
   - Instant search and filtering across 470 companies (Google, Amazon, Meta, Microsoft, Apple, Bloomberg, Uber, Netflix, ByteDance, etc.).
   - Visual difficulty ratio bars (Easy, Medium, Hard breakdown) for every company.
   - Quick filters for company volume (50+, 100+, 500+, 1,000+ FAANG/Tier-1).
   - Fast alphabetical and popularity sorting.

2. **⏱️ Timeframe Breakdown**:
   - Each company contains 5 historical time windows:
     - ⚡ **Past 30 Days**: Most recent questions actively appearing in interviews right now.
     - 📅 **Past 3 Months**: Recent interview trends.
     - 🗓️ **Past 6 Months**: Standard interview cycle questions.
     - ⏳ **More Than 6 Months**: Historical question bank.
     - 🌐 **All Time**: Complete cumulative question list.

3. **🔍 Universal Problem Finder**:
   - Search any LeetCode problem (e.g. *LRU Cache*, *Trapping Rain Water*, *Course Schedule*) to instantly discover **every company that asks it**, with exact frequencies and timeframe windows.

4. **📊 Company Comparison Tool (Venn Breakdown)**:
   - Select two companies (e.g. Google vs Meta) to see:
     - 🔥 **Overlapping Questions**: Problems asked by *both* companies (highest yield for interview preparation).
     - Company A unique questions.
     - Company B unique questions.

5. **🎯 Personal Interview Prep Tracker**:
   - Mark problems as **Solved** with one click.
   - **Bookmark / Star** problems for revision.
   - Persists automatically to your browser (`localStorage`).
   - Export your solved list and bookmarks as JSON.

6. **📥 Export to CSV**:
   - One-click export of any company's question table directly to CSV format.

7. **🌓 Dark & Light Modes**:
   - Modern glassmorphism UI with full theme toggle and responsive design.

---

## 📁 Project Structure

```text
leetcode-company-navigator/
├── leetcode.db             # Pre-indexed SQLite database (36,347 question rows, 470 companies)
├── server.py               # FastAPI backend with REST API & static file serving
├── ingest.py               # Data ingestion script from CSVs into SQLite
├── test_api.py             # Test suite validating API responses
├── run.bat                 # 1-click Windows runner script
├── run.ps1                 # PowerShell startup script
├── static/
│   ├── index.html          # Responsive single-page application
│   ├── app.js              # State management, API client, search, and tracker logic
│   └── styles.css          # Styling, dark/light themes, custom badges & scrollbars
└── README.md               # Documentation
```

---

## ⚡ Quick Start

### Option 1: Double-click `run.bat`
Just double-click `run.bat` in Windows Explorer. It will start the server and print the URL.

### Option 2: Command Line (PowerShell / Terminal)
```powershell
cd "C:\Users\Dhanush D\.gemini\antigravity\scratch\leetcode-company-navigator"
python -m uvicorn server:app --host 0.0.0.0 --port 8000
```

Then open your browser at:
👉 **`http://localhost:8000`**

---

## 🔌 API Reference

| Endpoint | Method | Description |
|---|---|---|
| `/api/stats` | GET | Global metrics (total companies, unique problems, records, top companies) |
| `/api/companies` | GET | List & search companies (supports `q`, `sort`, `min_questions`, `limit`) |
| `/api/companies/{slug}` | GET | Get company profile and timeframe counts |
| `/api/companies/{slug}/questions` | GET | Get company questions (supports `timeframe`, `difficulty`, `topic`, `search`, `sort`, `page`, `page_size`) |
| `/api/search` | GET | Search problems across all 470 companies (supports `q`, `limit`) |
| `/api/topics` | GET | List all distinct topics and problem counts |

---

## 📊 Database Stats

- **Total Companies:** 470
- **Unique LeetCode Problems:** 3,396
- **Total Company Question Records:** 36,347
- **Database Engine:** SQLite 3 with composite indices for sub-millisecond query latency.
