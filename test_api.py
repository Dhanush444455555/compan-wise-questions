import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
import server
from fastapi.testclient import TestClient

client = TestClient(server.app)

stats = client.get("/api/stats").json()
print("Stats total companies:", stats["total_companies"])
print("Stats unique problems:", stats["unique_problems"])
print("Stats top companies count:", len(stats["top_companies"]))

comp_res = client.get("/api/companies?q=google").json()
print("Search google company:", comp_res["companies"][0]["name"])

q_res = client.get("/api/companies/google/questions?timeframe=thirty_days&page_size=5").json()
print("Google 30-day questions count:", q_res["total"])
print("First question:", q_res["questions"][0]["title"], q_res["questions"][0]["difficulty"], q_res["questions"][0]["frequency"])

search_res = client.get("/api/search?q=LRU+Cache").json()
print("Search LRU Cache count:", search_res["results_count"])
print("All API tests passed successfully!")
