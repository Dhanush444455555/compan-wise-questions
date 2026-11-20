import os
import sqlite3
import json
from typing import Optional, List
from fastapi import FastAPI, APIRouter, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Look for leetcode.db in multiple plausible locations
DB_CANDIDATES = [
    os.path.join(BASE_DIR, "leetcode.db"),
    os.path.join(BASE_DIR, "..", "leetcode.db"),
    os.path.join(os.getcwd(), "leetcode.db"),
    os.path.join(os.getcwd(), "api", "leetcode.db"),
]

DB_PATH = None
for p in DB_CANDIDATES:
    if os.path.exists(p):
        DB_PATH = os.path.abspath(p)
        break

if not DB_PATH:
    DB_PATH = os.path.join(BASE_DIR, "leetcode.db")

app = FastAPI(title="LeetCode Company Wise Navigator API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    try:
        # Use URI mode=ro to ensure safe read-only operation on serverless filesystems
        conn = sqlite3.connect(f"file:{DB_PATH}?mode=ro", uri=True)
    except Exception:
        conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

router = APIRouter()

@router.get("/stats")
def get_global_stats():
    conn = get_db()
    cur = conn.cursor()

    total_companies = cur.execute("SELECT COUNT(*) FROM companies").fetchone()[0]
    total_records = cur.execute("SELECT COUNT(*) FROM questions").fetchone()[0]
    unique_problems = cur.execute("SELECT COUNT(DISTINCT title) FROM questions").fetchone()[0]

    diff_stats = cur.execute("""
        SELECT difficulty, COUNT(DISTINCT title) as count
        FROM questions
        GROUP BY difficulty
    """).fetchall()

    difficulties = {row["difficulty"]: row["count"] for row in diff_stats}

    top_companies = cur.execute("""
        SELECT name, slug, total_questions, easy_count, medium_count, hard_count
        FROM companies
        ORDER BY total_questions DESC
        LIMIT 10
    """).fetchall()

    conn.close()

    return {
        "total_companies": total_companies,
        "total_question_records": total_records,
        "unique_problems": unique_problems,
        "difficulties": difficulties,
        "top_companies": [dict(c) for c in top_companies]
    }

@router.get("/companies")
def list_companies(
    q: Optional[str] = Query(None, description="Search company name"),
    sort: str = Query("popular", description="Sort by: popular, name, easy, medium, hard"),
    min_questions: int = Query(0, description="Minimum questions count"),
    limit: int = Query(500, description="Limit results"),
    offset: int = Query(0, description="Offset for pagination")
):
    conn = get_db()
    cur = conn.cursor()

    query = "SELECT * FROM companies WHERE total_questions >= ?"
    params = [min_questions]

    if q and q.strip():
        query += " AND (name LIKE ? OR slug LIKE ?)"
        term = f"%{q.strip()}%"
        params.extend([term, term])

    sort_mapping = {
        "popular": "total_questions DESC, name ASC",
        "name": "name ASC",
        "easy": "easy_count DESC",
        "medium": "medium_count DESC",
        "hard": "hard_count DESC"
    }
    order_clause = sort_mapping.get(sort, "total_questions DESC")
    query += f" ORDER BY {order_clause} LIMIT ? OFFSET ?"
    params.extend([limit, offset])

    rows = cur.execute(query, params).fetchall()
    
    count_query = "SELECT COUNT(*) FROM companies WHERE total_questions >= ?"
    count_params = [min_questions]
    if q and q.strip():
        count_query += " AND (name LIKE ? OR slug LIKE ?)"
        term = f"%{q.strip()}%"
        count_params.extend([term, term])
    total_matched = cur.execute(count_query, count_params).fetchone()[0]

    conn.close()

    companies = []
    for r in rows:
        d = dict(r)
        d["top_topics"] = json.loads(d.get("top_topics_json") or "[]")
        companies.append(d)

    return {
        "total": total_matched,
        "companies": companies
    }

@router.get("/companies/{slug}")
def get_company(slug: str):
    conn = get_db()
    cur = conn.cursor()

    row = cur.execute("SELECT * FROM companies WHERE slug = ? OR name = ?", (slug, slug)).fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Company not found")

    company = dict(row)
    company["top_topics"] = json.loads(company.get("top_topics_json") or "[]")

    timeframes = [
        {"key": "thirty_days", "label": "30 Days", "count": company["thirty_days_count"]},
        {"key": "three_months", "label": "3 Months", "count": company["three_months_count"]},
        {"key": "six_months", "label": "6 Months", "count": company["six_months_count"]},
        {"key": "more_than_six_months", "label": "> 6 Months", "count": company["more_than_six_months_count"]},
        {"key": "all", "label": "All Time", "count": company["all_time_count"]},
    ]
    company["timeframes"] = timeframes

    conn.close()
    return company

@router.get("/companies/{slug}/questions")
def get_company_questions(
    slug: str,
    timeframe: str = Query("all", description="thirty_days, three_months, six_months, more_than_six_months, all"),
    difficulty: Optional[str] = Query(None, description="EASY, MEDIUM, HARD"),
    topic: Optional[str] = Query(None, description="Filter by topic tag"),
    search: Optional[str] = Query(None, description="Search title"),
    sort: str = Query("frequency_desc", description="frequency_desc, acceptance_desc, title_asc, difficulty"),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=500)
):
    conn = get_db()
    cur = conn.cursor()

    comp = cur.execute("SELECT name, slug FROM companies WHERE slug = ? OR name = ?", (slug, slug)).fetchone()
    if not comp:
        conn.close()
        raise HTTPException(status_code=404, detail="Company not found")

    actual_slug = comp["slug"]
    
    where_clauses = ["company_slug = ?"]
    params = [actual_slug]

    if timeframe and timeframe != "any":
        where_clauses.append("timeframe = ?")
        params.append(timeframe)

    if difficulty and difficulty.upper() in ("EASY", "MEDIUM", "HARD"):
        where_clauses.append("difficulty = ?")
        params.append(difficulty.upper())

    if topic and topic.strip():
        where_clauses.append("topics LIKE ?")
        params.append(f"%{topic.strip()}%")

    if search and search.strip():
        where_clauses.append("title LIKE ?")
        params.append(f"%{search.strip()}%")

    where_sql = " AND ".join(where_clauses)

    count_sql = f"SELECT COUNT(*) FROM questions WHERE {where_sql}"
    total = cur.execute(count_sql, params).fetchone()[0]

    sort_dict = {
        "frequency_desc": "frequency DESC, title ASC",
        "frequency_asc": "frequency ASC, title ASC",
        "acceptance_desc": "acceptance_rate DESC",
        "acceptance_asc": "acceptance_rate ASC",
        "title_asc": "title ASC",
        "title_desc": "title DESC",
        "difficulty": "CASE difficulty WHEN 'EASY' THEN 1 WHEN 'MEDIUM' THEN 2 WHEN 'HARD' THEN 3 END ASC, frequency DESC"
    }
    order_sql = sort_dict.get(sort, "frequency DESC, title ASC")

    offset = (page - 1) * page_size
    query_sql = f"""
        SELECT id, company_name, company_slug, timeframe, timeframe_label,
               difficulty, title, frequency, acceptance_rate, link, topics
        FROM questions
        WHERE {where_sql}
        ORDER BY {order_sql}
        LIMIT ? OFFSET ?
    """
    rows = cur.execute(query_sql, params + [page_size, offset]).fetchall()

    topic_rows = cur.execute("SELECT topics FROM questions WHERE company_slug = ? AND timeframe = ?", (actual_slug, timeframe)).fetchall()
    topic_set = set()
    for tr in topic_rows:
        if tr["topics"]:
            for t in tr["topics"].split(","):
                t_str = t.strip()
                if t_str:
                    topic_set.add(t_str)

    conn.close()

    questions = [dict(r) for r in rows]
    return {
        "company": dict(comp),
        "timeframe": timeframe,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": (total + page_size - 1) // page_size if page_size else 1,
        "available_topics": sorted(list(topic_set)),
        "questions": questions
    }

@router.get("/search")
def global_search(
    q: str = Query(..., min_length=2, description="Search query across problem titles"),
    limit: int = Query(100, ge=1, le=300)
):
    conn = get_db()
    cur = conn.cursor()

    term = f"%{q.strip()}%"
    rows = cur.execute("""
        SELECT company_name, company_slug, timeframe_label, difficulty, title, frequency, acceptance_rate, link, topics
        FROM questions
        WHERE title LIKE ?
        ORDER BY frequency DESC, company_name ASC
        LIMIT ?
    """, (term, limit)).fetchall()

    conn.close()

    grouped = {}
    for r in rows:
        title = r["title"]
        if title not in grouped:
            grouped[title] = {
                "title": title,
                "difficulty": r["difficulty"],
                "acceptance_rate": r["acceptance_rate"],
                "link": r["link"],
                "topics": r["topics"],
                "companies": []
            }
        grouped[title]["companies"].append({
            "company_name": r["company_name"],
            "company_slug": r["company_slug"],
            "timeframe": r["timeframe_label"],
            "frequency": r["frequency"]
        })

    return {
        "query": q,
        "results_count": len(rows),
        "problems": list(grouped.values())
    }

@router.get("/topics")
def list_all_topics():
    conn = get_db()
    cur = conn.cursor()

    rows = cur.execute("SELECT topics FROM questions WHERE timeframe = 'all' AND topics != ''").fetchall()
    conn.close()

    topic_counts = {}
    for r in rows:
        raw = r["topics"]
        if raw:
            for t in raw.split(","):
                item = t.strip()
                if item:
                    topic_counts[item] = topic_counts.get(item, 0) + 1

    sorted_topics = [{"topic": k, "count": v} for k, v in sorted(topic_counts.items(), key=lambda x: x[1], reverse=True)]
    return sorted_topics

@router.get("/health")
def health_check():
    return {
        "status": "healthy",
        "db_path": DB_PATH,
        "db_exists": os.path.exists(DB_PATH) if DB_PATH else False
    }

# Register both with prefix /api and without prefix for seamless routing
app.include_router(router, prefix="/api")
app.include_router(router)
