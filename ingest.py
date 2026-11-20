import os
import glob
import csv
import re
import sqlite3
import json

BASE_INPUT = r"C:/Users/Dhanush D/.gemini/antigravity/scratch/extracted_input/leetcode-company-wise-problems-main"
DB_PATH = r"C:/Users/Dhanush D/.gemini/antigravity/scratch/leetcode-company-navigator/leetcode.db"

TIMEFRAME_MAP = {
    "1. Thirty Days.csv": ("thirty_days", "30 Days", 1),
    "2. Three Months.csv": ("three_months", "3 Months", 2),
    "3. Six Months.csv": ("six_months", "6 Months", 3),
    "4. More Than Six Months.csv": ("more_than_six_months", "> 6 Months", 4),
    "5. All.csv": ("all", "All Time", 5)
}

def slugify(text):
    s = re.sub(r'[^a-zA-Z0-9]+', '-', text.strip())
    return s.strip('-').lower()

def ingest():
    if os.path.exists(DB_PATH):
        os.remove(DB_PATH)

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    cursor.execute("""
    CREATE TABLE companies (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        slug TEXT UNIQUE NOT NULL,
        total_questions INTEGER DEFAULT 0,
        easy_count INTEGER DEFAULT 0,
        medium_count INTEGER DEFAULT 0,
        hard_count INTEGER DEFAULT 0,
        thirty_days_count INTEGER DEFAULT 0,
        three_months_count INTEGER DEFAULT 0,
        six_months_count INTEGER DEFAULT 0,
        more_than_six_months_count INTEGER DEFAULT 0,
        all_time_count INTEGER DEFAULT 0,
        top_topics_json TEXT DEFAULT '[]'
    )
    """)

    cursor.execute("""
    CREATE TABLE questions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        company_name TEXT NOT NULL,
        company_slug TEXT NOT NULL,
        timeframe TEXT NOT NULL,
        timeframe_label TEXT NOT NULL,
        timeframe_order INTEGER NOT NULL,
        difficulty TEXT NOT NULL,
        title TEXT NOT NULL,
        frequency REAL DEFAULT 0,
        acceptance_rate REAL DEFAULT 0,
        link TEXT,
        topics TEXT
    )
    """)

    # Indices for blazing-fast queries
    cursor.execute("CREATE INDEX idx_q_slug_timeframe ON questions(company_slug, timeframe);")
    cursor.execute("CREATE INDEX idx_q_difficulty ON questions(difficulty);")
    cursor.execute("CREATE INDEX idx_q_title ON questions(title);")
    cursor.execute("CREATE INDEX idx_q_freq ON questions(frequency DESC);")
    cursor.execute("CREATE INDEX idx_companies_slug ON companies(slug);")

    company_dirs = [d for d in os.listdir(BASE_INPUT) if os.path.isdir(os.path.join(BASE_INPUT, d))]
    company_dirs.sort()

    questions_to_insert = []
    companies_data = []

    print(f"Processing {len(company_dirs)} companies...")

    for comp_name in company_dirs:
        comp_dir = os.path.join(BASE_INPUT, comp_name)
        comp_slug = slugify(comp_name)

        counts = {
            "thirty_days": 0,
            "three_months": 0,
            "six_months": 0,
            "more_than_six_months": 0,
            "all": 0
        }
        
        diff_counts = {"EASY": 0, "MEDIUM": 0, "HARD": 0}
        unique_titles = set()
        topic_freq = {}

        # Scan each file in company dir
        for fname, (tf_key, tf_label, tf_order) in TIMEFRAME_MAP.items():
            fpath = os.path.join(comp_dir, fname)
            if not os.path.exists(fpath):
                continue

            with open(fpath, "r", encoding="utf-8", errors="ignore") as fp:
                reader = csv.DictReader(fp)
                for row in reader:
                    title = (row.get("Title") or "").strip()
                    if not title:
                        continue

                    diff = (row.get("Difficulty") or "MEDIUM").strip().upper()
                    if diff not in ("EASY", "MEDIUM", "HARD"):
                        diff = "MEDIUM"

                    try:
                        freq = round(float(row.get("Frequency") or 0), 1)
                    except:
                        freq = 0.0

                    try:
                        raw_acc = float(row.get("Acceptance Rate") or 0)
                        acc_rate = round(raw_acc * 10000, 1) # convert 0.0058 to 58.0%
                    except:
                        acc_rate = 0.0

                    link = (row.get("Link") or "").strip()
                    topics = (row.get("Topics") or "").strip()

                    counts[tf_key] += 1
                    unique_titles.add(title)
                    
                    # Track diff count for "All" timeframe or all unique problems
                    if tf_key == "all":
                        diff_counts[diff] += 1
                        if topics:
                            for t in [x.strip() for x in topics.split(",") if x.strip()]:
                                topic_freq[t] = topic_freq.get(t, 0) + 1

                    questions_to_insert.append((
                        comp_name,
                        comp_slug,
                        tf_key,
                        tf_label,
                        tf_order,
                        diff,
                        title,
                        freq,
                        acc_rate,
                        link,
                        topics
                    ))

        # If "all" file was empty or missing, fallback to unique titles count
        total_unique = len(unique_titles)
        if counts["all"] == 0:
            counts["all"] = total_unique

        # Top 5 topics
        sorted_topics = sorted(topic_freq.items(), key=lambda x: x[1], reverse=True)[:5]
        top_topics = [t[0] for t in sorted_topics]

        companies_data.append((
            comp_name,
            comp_slug,
            total_unique,
            diff_counts["EASY"],
            diff_counts["MEDIUM"],
            diff_counts["HARD"],
            counts["thirty_days"],
            counts["three_months"],
            counts["six_months"],
            counts["more_than_six_months"],
            counts["all"],
            json.dumps(top_topics)
        ))

    # Bulk insert
    cursor.executemany("""
    INSERT INTO companies (
        name, slug, total_questions, easy_count, medium_count, hard_count,
        thirty_days_count, three_months_count, six_months_count,
        more_than_six_months_count, all_time_count, top_topics_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, companies_data)

    cursor.executemany("""
    INSERT INTO questions (
        company_name, company_slug, timeframe, timeframe_label, timeframe_order,
        difficulty, title, frequency, acceptance_rate, link, topics
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, questions_to_insert)

    conn.commit()
    conn.close()

    print(f"Successfully ingested {len(companies_data)} companies and {len(questions_to_insert)} questions into {DB_PATH}")

if __name__ == "__main__":
    ingest()
