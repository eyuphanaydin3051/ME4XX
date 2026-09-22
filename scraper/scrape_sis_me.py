"""
METU SIS Course Scraper for Mechanical Engineering (ME - Code 569)
Inspired by and compatible with robotdegilim.xyz data pipeline.

Usage:
    pip install requests beautifulsoup4
    python scrape_sis_me.py

This script:
1. Connects to https://sis.metu.edu.tr
2. Obtains dynamic session cookies and security token (stamp)
3. Queries ME (Department Code: 569) courses for the current semester
4. Parses HTML tables into JSON with sections, schedules, classrooms, and instructors.
"""

import sys
import json
import re
from urllib.parse import urljoin
from bs4 import BeautifulSoup

try:
    import requests
except ImportError:
    print("Please install requests: pip install requests beautifulsoup4")
    sys.exit(1)

SIS_BASE_URL = "https://sis.metu.edu.tr"

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9,tr;q=0.8",
}

def to_float(val: str) -> float:
    try:
        return float(val.strip().replace(',', '.')) if val.strip() else 0.0
    except ValueError:
        return 0.0

def to_int(val: str) -> int:
    try:
        return int(float(val.strip().replace(',', '.'))) if val.strip() else 0
    except ValueError:
        return 0

def scrape_me_courses():
    session = requests.Session()
    session.headers.update(HEADERS)

    print("[1/4] Connecting to METU SIS main page...")
    resp = session.get(SIS_BASE_URL + "/")
    resp.raise_for_status()

    soup = BeautifulSoup(resp.text, "html.parser")
    semester_info_url = None
    for a in soup.find_all("a", href=True):
        if "Semester Information" in a.get_text(strip=True):
            semester_info_url = a["href"]
            break

    if not semester_info_url:
        raise Exception("Could not find 'Semester Information' link on main SIS page.")

    full_url = urljoin(SIS_BASE_URL + "/", semester_info_url)
    print(f"[2/4] Fetching semester info page: {full_url}...")
    resp = session.get(full_url)
    resp.raise_for_status()

    page_soup = BeautifulSoup(resp.text, "html.parser")
    stamp_input = page_soup.find("input", {"name": "stamp", "type": "hidden"})
    if not stamp_input or "value" not in stamp_input.attrs:
        raise Exception("Could not find CSRF 'stamp' token on semester page.")
    stamp = stamp_input["value"]

    # Current semester
    select_sem = page_soup.find("select", {"name": "selectSemester"})
    current_semester_val = -1
    current_semester_name = ""
    if select_sem:
        for opt in select_sem.find_all("option"):
            v = opt.get("value")
            if v and v.isdigit() and int(v) > current_semester_val:
                current_semester_val = int(v)
                current_semester_name = opt.get_text(strip=True)

    print(f"[3/4] Current semester: {current_semester_name} ({current_semester_val}). Fetching ME (569) courses...")
    
    post_payload = {
        "selectCourseCriteriaType": "",
        "selectSemester": str(current_semester_val),
        "selectProgram": "569", # ME Department Code
        "submitSearchForm": "Search",
        "stamp": stamp
    }
    ajax_headers = {
        "X-Requested-With": "XMLHttpRequest",
        "Accept": "application/json, text/javascript, */*; q=0.01",
        "Referer": full_url
    }

    post_resp = session.post(f"{SIS_BASE_URL}/main.php", data=post_payload, headers=ajax_headers)
    post_resp.raise_for_status()
    
    data_json = post_resp.json()
    if data_json.get("error"):
        raise Exception(f"SIS returned error: {data_json.get('error')}")

    html_table = data_json.get("data", "")
    table_soup = BeautifulSoup(html_table, "html.parser")
    table = table_soup.find("table", {"id": "SearchResults"})
    if not table:
        print("Warning: No SearchResults table found.")
        return {}

    thead = table.find("thead")
    tbody = table.find("tbody")
    headers = [th.get_text(strip=True) for th in thead.find_all("th")]
    col_map = {name: idx for idx, name in enumerate(headers)}

    courses_dict = {}
    print(f"[4/4] Parsing course rows...")

    for row in tbody.find_all("tr"):
        cols = row.find_all("td")
        if not cols:
            continue
        tds = [td.get_text(strip=True) for td in cols]
        row_data = {name: (tds[idx] if idx < len(tds) else "") for name, idx in col_map.items()}

        code = row_data.get("Course Code")
        if not code:
            continue

        if code not in courses_dict:
            courses_dict[code] = {
                "code": code,
                "name": row_data.get("Course Name", ""),
                "credits": {
                    "total": to_float(row_data.get("Credit", "")),
                    "ects": to_float(row_data.get("ECTS Credit", "")),
                },
                "sections": {}
            }

        sec_str = row_data.get("Course Section", "")
        if not sec_str:
            continue
        sec_num = to_int(sec_str)

        if sec_num not in courses_dict[code]["sections"]:
            courses_dict[code]["sections"][sec_num] = {
                "section_number": sec_num,
                "capacity": to_int(row_data.get("Capacity", "")),
                "instructors": [],
                "schedule": []
            }

        sec_obj = courses_dict[code]["sections"][sec_num]
        
        # Schedule
        for i in range(1, 6):
            day = row_data.get(f"Day{i}")
            if day:
                sched = {
                    "day": day,
                    "start_hour": row_data.get(f"Start Hour{i}", ""),
                    "end_hour": row_data.get(f"End Hour{i}", ""),
                    "classroom": row_data.get(f"Classroom {i}", ""),
                    "building": row_data.get(f"Classroom Building {i}", "")
                }
                if sched not in sec_obj["schedule"]:
                    sec_obj["schedule"].append(sched)

        # Instructor
        inst = row_data.get("Instructor Name")
        if inst and inst not in sec_obj["instructors"]:
            sec_obj["instructors"].append(inst)

    print(f"Successfully scraped {len(courses_dict)} ME courses!")
    return courses_dict

if __name__ == "__main__":
    courses = scrape_me_courses()
    with open("me_scraped_live.json", "w", encoding="utf-8") as f:
        json.dump(courses, f, ensure_ascii=False, indent=2)
    print("Saved to me_scraped_live.json")
