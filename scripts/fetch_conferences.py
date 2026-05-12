#!/usr/bin/env python3
"""
Fetch CS conference deadline data from authoritative sources:
  1. CORE portal (portal.core.edu.au) — authoritative ICORE2023 A*/A/B/C list
  2. ccfddl local clone               — primary deadline source (hand-curated, has timezone)
  3. WikiCFP (wikicfp.com)            — fallback deadline source (for long-tail conferences)

Usage:
    python3 scripts/fetch_conferences.py

    (ccfddl fallback source is auto-cloned/pulled into /tmp/ccf-deadlines on each run.)

Outputs:
    data/conferences.json       — conferences with deadline data
    data/missing_deadlines.json — CORE conferences with no deadline found

Requirements:
    python3 -m pip install requests beautifulsoup4 pyyaml
"""

import json
import re
import subprocess
import sys
import time
from datetime import datetime, timedelta, timezone
from pathlib import Path

import requests
import yaml
from bs4 import BeautifulSoup

# ── Config ────────────────────────────────────────────────────────────────────

CCFDDL_REPO   = Path("/tmp/ccf-deadlines")
CCFDDL_DIR    = CCFDDL_REPO / "conference"
CCFDDL_URL    = "https://github.com/ccfddl/ccf-deadlines.git"
CORE_CACHE    = Path("/tmp/core_list_abc.json")
WIKICFP_CACHE = Path("/tmp/wikicfp_cache.json")
OUT_FILE      = Path("data/conferences.json")
MISSING_FILE  = Path("data/missing_deadlines.json")
OVERRIDES_FILE = Path("data/overrides.yml")

HEADERS = {"User-Agent": "Mozilla/5.0 (compatible; CSDeadlines/1.0)"}

# ANZSRC 2020 FoR codes → domain
FOR_TO_DOMAIN = {
    "4601": "Interdisciplinary",
    "4602": "AI",
    "4603": "CV & Multimedia",
    "4604": "Security",
    "4605": "Data",
    "4606": "Systems",
    "4607": "Graphics & AR",
    "4608": "HCI",
    "4611": "AI",
    "4612": "SE & PL",
    "4613": "Theory",
    "CSE":  "Systems",
}

# Manual domain overrides (uppercase acronym → domain)
ACRONYM_DOMAIN_OVERRIDE: dict[str, str] = {
    "SIGCOMM": "Networking", "INFOCOM": "Networking", "MOBICOM": "Networking",
    "MOBISYS": "Networking", "CONEXT": "Networking", "IMC": "Networking",
    "SENSYS": "Networking", "SECON": "Networking", "MASS": "Networking",
    "DCOSS": "Networking", "GLOBECOM": "Networking", "ICCCN": "Networking",
    "ICNP": "Networking", "ICDCS": "Networking", "IWQOS": "Networking",
    "LCN": "Networking", "MSWIM": "Networking", "NCA": "Networking",
    "NOMS": "Networking", "NETSOFT": "Networking", "NETWORKING": "Networking",
    "PAM": "Networking", "PIMRC": "Networking", "VTC": "Networking",
    "WCNC": "Networking", "WIMOB": "Networking", "WIOPT": "Networking",
    "EWSN": "Networking", "CNSM": "Networking", "IWCMC": "Networking",
    "IEEE CCNC": "Networking", "IM": "Networking", "MOBIHOC": "Networking",
    "SOSP": "Systems", "OSDI": "Systems", "EUROSYS": "Systems",
    "HOTOS": "Systems", "FAST": "Systems", "HPDC": "Systems",
    "IPDPS": "Systems", "SC": "Systems", "PPOPP": "Systems",
    "PACT": "Systems", "VEE": "Systems", "LCTES": "Systems",
    "SPAA": "Systems", "MIDDLEWARE": "Systems", "IC2E": "Systems",
    "CCGRID": "Systems", "EUROPAR": "Systems", "ICPADS": "Systems",
    "ICPP": "Systems", "SRDS": "Systems", "DSN": "Systems",
    "RTAS": "Systems", "RTSS": "Systems", "RTCSA": "Systems",
    "ECRTS": "Systems", "DISC": "Systems", "OPODIS": "Systems",
    "PODC": "Systems", "MASCOTS": "Systems", "PADS": "Systems",
    "E-SCIENCE": "Systems", "EDOC": "Systems", "SERVICES": "Systems",
    "ICSOC": "Systems", "ICWS": "Systems", "MMSYS": "Systems",
    "NOSSDAV": "Systems", "USENIX": "Systems", "SIGOPS ATC": "Systems",
    "WWW": "Data", "ICWSM": "Data", "SIGSPATIAL": "Data",
    "AFT": "Security",
    "PETRI NETS": "Theory",
}

# Conferences that span multiple domains (conservative, well-known cross-domain venues)
MULTI_DOMAIN: dict[str, list[str]] = {
    # CV + AI
    "CVPR":  ["CV & Multimedia", "AI"],
    "ICCV":  ["CV & Multimedia", "AI"],
    "ECCV":  ["CV & Multimedia", "AI"],
    "ACMMM": ["CV & Multimedia", "AI"],
    # Systems + SE & PL (architecture)
    "ASPLOS": ["Systems", "SE & PL"],
    "ISCA":   ["Systems", "SE & PL"],
    "MICRO":  ["Systems", "SE & PL"],
    "HPCA":   ["Systems", "SE & PL"],
    "CGO":    ["Systems", "SE & PL"],
    # SE & PL + Theory
    "POPL": ["SE & PL", "Theory"],
    "LICS": ["SE & PL", "Theory"],
    # Networking + Systems
    "NSDI":   ["Networking", "Systems"],
    "MOBISYS": ["Networking", "Systems"],
    "SENSYS": ["Networking", "Systems"],
    # Networking + Data
    "IMC": ["Networking", "Data"],
    # Security + Systems
    "USENIX SECURITY": ["Security", "Systems"],
    "IEEE S&P": ["Security", "Systems"],
    "NDSS": ["Security", "Systems"],
    # Data + AI
    "KDD":  ["Data", "AI"],
    "WSDM": ["Data", "AI"],
    "WWW":  ["Data", "AI"],
    "ICDE": ["Data", "AI"],
    "SIGIR": ["Data", "AI"],
    "CIKM": ["Data", "AI"],
    "ICDM": ["Data", "AI"],
    # Graphics + CV
    "SIGGRAPH": ["Graphics & AR", "CV & Multimedia"],
    # HCI + AI
    "CSCW": ["HCI", "AI"],
    "UIST": ["HCI", "SE & PL"],
}

CSRANKINGS = {
    "NeurIPS","ICML","ICLR","CVPR","ICCV","ECCV","AAAI","IJCAI",
    "ACL","EMNLP","NAACL",
    "SOSP","OSDI","EuroSys","USENIX ATC","FAST",
    "SIGCOMM","NSDI","MobiCom","MobiSys","SenSys",
    "CCS","IEEE S&P","S&P","USENIX Security","NDSS",
    "SIGMOD","VLDB","ICDE",
    "PLDI","POPL","OOPSLA","ASPLOS","ISCA","MICRO","HPCA",
    "WWW","SIGIR","KDD","WSDM",
    "CHI","UIST","CSCW",
    "STOC","FOCS","SODA",
    "ICSE","FSE","ASE","ISSTA",
    "ICRA","IROS","RSS",
}

ACM_CONFERENCES = {
    "CCS","SIGCOMM","SIGMOD","KDD","WWW","PLDI","POPL","OOPSLA",
    "SOSP","STOC","SODA","CHI","UIST","CSCW","SIGIR","WSDM",
    "ASPLOS","ISCA","MICRO","FSE","ISSTA","MobiCom","MobiSys","SenSys",
    "ICSE","ASE","FAST","ACMMM","MM","ACM MM","SIGGRAPH","SIGCSE",
    "SIGMETRICS","SIGOPS ATC","RecSys","IMC","PODC","SIGKDD",
}
IEEE_CONFERENCES = {
    "CVPR","ICCV","FOCS","HPCA","ICRA","IROS","S&P","IEEE S&P",
    "ICDE","INFOCOM","ICDCS","VR","IEEE VR","IEEE VIS","RTSS","RTAS",
    "IPDPS","DAC","ICCAD","HPDC","CGO","DSN","ISSRE",
}

RANK_ORDER = {"A*": 0, "A": 1, "B": 2, "C": 3, "Unranked": 4}

# ── Timezone / date helpers ───────────────────────────────────────────────────

def parse_tz_offset(tz: str) -> float:
    if not tz: return 0
    tz = str(tz).strip()
    if tz in ("AoE", "Anywhere on Earth"): return -12
    if tz == "UTC": return 0
    m = re.match(r"UTC([+-])(\d+(?:\.\d+)?)", tz)
    if m:
        return (1 if m.group(1) == "+" else -1) * float(m.group(2))
    return 0

def to_utc(dl_str: str, tz: str) -> datetime:
    dl_str = str(dl_str).strip().replace(" ", "T").rstrip("Z")
    if "T" not in dl_str: dl_str += "T23:59:59"
    dt = datetime.fromisoformat(dl_str).replace(tzinfo=timezone.utc)
    return dt - timedelta(hours=parse_tz_offset(tz))

def fmt(dl_str: str) -> str:
    dl_str = str(dl_str).strip().replace(" ", "T").rstrip("Z")
    if "T" not in dl_str: dl_str += "T23:59:59"
    return dl_str[:16] + ":00"

def is_tbd(s: str) -> bool:
    return not s or "TBD" in s.upper()

def parse_wikicfp_date(s: str) -> str | None:
    """Parse WikiCFP date like 'May 11, 2026' or 'May 11, 2026 (May 8, 2026)' → ISO."""
    s = s.strip()
    # Take the first date (ignore parenthesized abstract date)
    m = re.match(r"([A-Za-z]+ \d+, \d{4})", s)
    if not m: return None
    try:
        dt = datetime.strptime(m.group(1), "%B %d, %Y")
        return dt.strftime("%Y-%m-%dT23:59:00")
    except Exception:
        return None

def parse_wikicfp_abstract(s: str) -> str | None:
    """Extract abstract date from parentheses: 'May 14, 2025 (May 11, 2025)'."""
    m = re.search(r"\(([A-Za-z]+ \d+, \d{4})\)", s)
    if not m: return None
    try:
        dt = datetime.strptime(m.group(1), "%B %d, %Y")
        return dt.strftime("%Y-%m-%dT23:59:00")
    except Exception:
        return None

# ── CORE portal ───────────────────────────────────────────────────────────────

def fetch_core_list() -> list[dict]:
    if CORE_CACHE.exists():
        print("  Using cached CORE list from", CORE_CACHE)
        return json.loads(CORE_CACHE.read_text())

    print("  Fetching CORE list from portal.core.edu.au ...")
    base = "https://portal.core.edu.au/conf-ranks/"

    r = requests.get(base + "?search=&by=all&source=ICORE2023&do=1", timeout=15, headers=HEADERS)
    page_nums = re.findall(r"jumpPage\('(\d+)'\)", r.text)
    max_page = max(int(p) for p in page_nums) if page_nums else 1

    seen: dict[str, dict] = {}
    for page in range(1, max_page + 1):
        url = base + f"?search=&by=all&source=ICORE2023&page={page}&do=1"
        resp = requests.get(url, timeout=15, headers=HEADERS)
        soup = BeautifulSoup(resp.text, "html.parser")
        table = soup.find("table")
        if not table: break
        for row in table.find_all("tr")[1:]:
            cells = row.find_all("td")
            if len(cells) < 7: continue
            full_name = cells[0].get_text(strip=True)
            acronym   = cells[1].get_text(strip=True).strip()
            source    = cells[2].get_text(strip=True)
            rank      = cells[3].get_text(strip=True)
            for_code  = cells[6].get_text(strip=True)
            if "ICORE" not in source: continue
            display_rank = rank if rank in RANK_ORDER else "Unranked"
            entry = {"acronym": acronym, "full_name": full_name, "rank": display_rank, "for_code": for_code}
            key = acronym.upper()
            if key not in seen or RANK_ORDER.get(display_rank, 99) < RANK_ORDER.get(seen[key]["rank"], 99):
                seen[key] = entry
        print(f"    page {page}/{max_page}  cumulative={len(seen)}")
        time.sleep(0.25)

    result = list(seen.values())
    CORE_CACHE.parent.mkdir(parents=True, exist_ok=True)
    CORE_CACHE.write_text(json.dumps(result, ensure_ascii=False, indent=2))
    print(f"  → {len(result)} unique conferences cached")
    return result

# ── WikiCFP ───────────────────────────────────────────────────────────────────

def load_wikicfp_cache() -> dict:
    if WIKICFP_CACHE.exists():
        return json.loads(WIKICFP_CACHE.read_text())
    return {}

def save_wikicfp_cache(cache: dict):
    WIKICFP_CACHE.parent.mkdir(parents=True, exist_ok=True)
    WIKICFP_CACHE.write_text(json.dumps(cache, ensure_ascii=False, indent=2))

def search_wikicfp(acronym: str, cache: dict) -> list[dict]:
    """Search WikiCFP for a conference acronym. Returns list of editions."""
    key = acronym.upper()
    if key in cache:
        return cache[key]

    try:
        url = f"http://www.wikicfp.com/cfp/servlet/tool.search?q={requests.utils.quote(acronym)}&year=a"
        r = requests.get(url, timeout=15, headers=HEADERS)
        soup = BeautifulSoup(r.text, "html.parser")
        tables = soup.find_all("table")
        if len(tables) < 4:
            cache[key] = []
            return []

        results = []
        table = tables[3]
        rows = table.find_all("tr")[1:]

        # WikiCFP uses alternating rows:
        #   odd row:  2 cells  → name, full_name  (with link)
        #   even row: 3 cells  → when, where, deadline
        pending: dict = {}
        for row in rows:
            cells = row.find_all("td")
            if len(cells) == 2:
                # Event name row
                name     = cells[0].get_text(strip=True)
                link_tag = cells[0].find("a")
                link     = "http://www.wikicfp.com" + link_tag["href"] if link_tag else ""
                pending  = {"name": name, "link": link}
            elif len(cells) == 3 and pending:
                # When/Where/Deadline row
                when     = cells[0].get_text(strip=True)
                where    = cells[1].get_text(strip=True)
                deadline = cells[2].get_text(strip=True)
                name     = pending["name"]
                link     = pending["link"]
                pending  = {}

                # Only keep entries that are clearly this conference (not workshops)
                name_upper = name.upper()
                acr_upper  = acronym.upper()
                if not (name_upper.startswith(acr_upper + " ") or name_upper == acr_upper):
                    continue

                year_m = re.search(r"\b(20\d{2})\b", name)
                year   = int(year_m.group(1)) if year_m else 0

                dl_iso  = parse_wikicfp_date(deadline)
                abs_iso = parse_wikicfp_abstract(deadline)

                results.append({
                    "name": name, "year": year, "when": when, "where": where,
                    "deadline": dl_iso, "abstract": abs_iso, "link": link,
                })
            else:
                pending = {}

        cache[key] = results
        time.sleep(0.3)
        return results

    except Exception as e:
        print(f"    WikiCFP error for {acronym}: {e}")
        cache[key] = []
        return []

def best_wikicfp_editions(acronym: str, cache: dict) -> list[dict]:
    """Return per-edition records from WikiCFP — recent/upcoming editions only."""
    editions = search_wikicfp(acronym, cache)
    now = datetime.now(timezone.utc)
    current_year = now.year
    records = []

    # Deduplicate by year, keeping the edition with a deadline if available
    by_year: dict[int, dict] = {}
    for ed in editions:
        year = ed.get("year", 0)
        if not year: continue
        prev = by_year.get(year)
        if prev is None or (not prev.get("deadline") and ed.get("deadline")):
            by_year[year] = ed

    for year, ed in sorted(by_year.items()):
        # Only include editions from recent years (last 2 + future)
        if year < current_year - 1:
            continue

        dl_iso = ed.get("deadline")

        # Parse conference date to check if the event is in the future
        conf_future = False
        when = ed.get("when", "")
        if when:
            # e.g. "Dec 2, 2025 - Dec 7, 2025" → try to parse end date
            date_m = re.search(r"(\w+ \d+, 20\d{2})", when)
            if date_m:
                try:
                    conf_dt = datetime.strptime(date_m.group(1), "%B %d, %Y").replace(tzinfo=timezone.utc)
                    conf_future = conf_dt > now
                except Exception:
                    pass

        if dl_iso:
            try:
                deadlines = {"full_paper": fmt(dl_iso)}
                if ed.get("abstract"):
                    deadlines["abstract"] = fmt(ed["abstract"])
            except Exception:
                deadlines = {"full_paper": "TBD"}
        else:
            # No deadline data — only include if conference is in the future
            if not conf_future:
                continue
            deadlines = {"full_paper": "TBD"}

        records.append({
            "_year": year,
            "link": ed.get("link", ""),
            "deadlines": deadlines,
            "timezone": "UTC",
            "place": ed.get("where", "TBD"),
            "date": when or "TBD",
        })

    return records

# ── ccfddl fallback ───────────────────────────────────────────────────────────

def ensure_ccfddl() -> None:
    """Clone ccfddl repo on first run, pull latest otherwise. /tmp can be wiped
    by macOS on reboot, so this keeps the fallback source self-healing."""
    try:
        if CCFDDL_REPO.exists():
            print(f"  ccfddl: pulling latest from {CCFDDL_REPO}")
            subprocess.run(
                ["git", "-C", str(CCFDDL_REPO), "pull", "--quiet", "--ff-only"],
                check=True,
            )
        else:
            print(f"  ccfddl: cloning into {CCFDDL_REPO}")
            subprocess.run(
                ["git", "clone", "--depth=1", "--quiet", CCFDDL_URL, str(CCFDDL_REPO)],
                check=True,
            )
    except (subprocess.CalledProcessError, FileNotFoundError) as e:
        print(f"  WARNING: ccfddl sync failed ({e}); continuing with whatever is on disk")

def load_ccfddl() -> dict[str, dict]:
    ensure_ccfddl()
    index: dict[str, dict] = {}
    if not CCFDDL_DIR.exists():
        print(f"  WARNING: {CCFDDL_DIR} not found (ccfddl is fallback only)")
        return index
    for yml_file in CCFDDL_DIR.rglob("*.yml"):
        try:
            entries = yaml.safe_load(yml_file.read_text(encoding="utf-8"))
            if not entries or not isinstance(entries, list): continue
            entry = entries[0]
            title = (entry.get("title") or "").strip()
            if title: index[title.upper()] = entry
        except Exception:
            pass
    print(f"  ccfddl fallback: {len(index)} conferences loaded")
    return index

def ccfddl_editions(entry: dict, acronym: str, full_name: str,
                    rank: str, domains: list[str], raw_acronym: str) -> list[dict]:
    now = datetime.now(timezone.utc)
    tz_fallback = entry.get("timezone", "UTC")
    records = []

    for conf in entry.get("confs", []):
        conf_tz  = conf.get("timezone") or tz_fallback
        timeline = conf.get("timeline", [])

        upcoming, past = [], []
        for slot in timeline:
            dl_str = slot.get("deadline")
            if not dl_str or is_tbd(str(dl_str)): continue
            try:
                dl_utc = to_utc(str(dl_str), conf_tz)
                (upcoming if dl_utc > now else past).append((dl_utc, slot))
            except Exception:
                pass

        if upcoming:
            _, best_slot = min(upcoming, key=lambda x: x[0])
            fp  = fmt(str(best_slot.get("deadline")))
            ab  = best_slot.get("abstract_deadline")
            deadlines = {"full_paper": fp}
            if ab and not is_tbd(str(ab)):
                deadlines["abstract"] = fmt(str(ab))
        elif past:
            _, best_slot = max(past, key=lambda x: x[0])
            fp  = fmt(str(best_slot.get("deadline")))
            ab  = best_slot.get("abstract_deadline")
            deadlines = {"full_paper": fp}
            if ab and not is_tbd(str(ab)):
                deadlines["abstract"] = fmt(str(ab))
        else:
            deadlines = {"full_paper": "TBD"}

        year_m = re.search(r"\b(20\d{2})\b", conf.get("date", ""))
        year   = int(year_m.group(1)) if year_m else 0

        records.append({
            "_year": year,
            "link":      conf.get("link", ""),
            "deadlines": deadlines,
            "timezone":  conf_tz,
            "place":     conf.get("place", "TBD"),
            "date":      conf.get("date", "TBD"),
        })

    return records

# ── Helpers ───────────────────────────────────────────────────────────────────

ALIAS: dict[str, str] = {
    "USENIX-SECURITY": "USENIX SECURITY",
    "ACMMM": "ACM MM",
    "SIGGRAPHA": "SIGGRAPH ASIA",
    "SP": "IEEE S&P",
    "VR": "IEEE VR",
    "CGO": "IEEE/ACM CGO",
}

def normalize(s: str) -> str:
    s = s.upper().strip()
    return ALIAS.get(s, s)

def infer_organizer(acronym: str) -> str:
    a = acronym.upper()
    if a in {x.upper() for x in ACM_CONFERENCES}: return "ACM"
    if a in {x.upper() for x in IEEE_CONFERENCES}: return "IEEE"
    return "Other"

def make_record(edition: dict, acronym: str, full_name: str,
                rank: str, domains: list[str], raw_acronym: str) -> dict:
    return {
        "title":         acronym,
        "full_name":     full_name,
        "rank_core":     rank,
        "is_csrankings": raw_acronym in CSRANKINGS or acronym in CSRANKINGS,
        "organizer":     infer_organizer(acronym),
        "link":          edition.get("link", ""),
        "deadlines":     edition["deadlines"],
        "timezone":      edition.get("timezone", "UTC"),
        "place":         edition.get("place", "TBD"),
        "date":          edition.get("date", "TBD"),
        "domains":       domains,
        "open_access":   False,
        "artifact_badge": False,
    }

# ── Overrides ────────────────────────────────────────────────────────────────

def load_overrides() -> dict:
    if not OVERRIDES_FILE.exists():
        return {}
    data = yaml.safe_load(OVERRIDES_FILE.read_text(encoding="utf-8")) or {}
    return data

def apply_overrides(results: list[dict], overrides: dict) -> int:
    """Apply per-(title, year) field-level overrides in place. Nested `deadlines`
    dict is merged; other fields are replaced. Returns count of records modified."""
    if not overrides:
        return 0
    count = 0
    for rec in results:
        title = rec.get("title", "")
        year_m = re.search(r"\b(20\d{2})\b", rec.get("date", ""))
        if not year_m:
            continue
        year = int(year_m.group(1))
        entry_by_title = overrides.get(title) or overrides.get(title.upper())
        if not entry_by_title:
            continue
        entry = entry_by_title.get(year) or entry_by_title.get(str(year))
        if not entry:
            continue
        for key, value in entry.items():
            if key == "deadlines" and isinstance(value, dict):
                rec.setdefault("deadlines", {}).update(value)
            else:
                rec[key] = value
        count += 1
    return count

# ── Main ─────────────────────────────────────────────────────────────────────

def main():
    print("\n=== Step 1: CORE list ===")
    core_list = fetch_core_list()
    print(f"  {len(core_list)} conferences  (A*={sum(1 for c in core_list if c['rank']=='A*')}  A={sum(1 for c in core_list if c['rank']=='A')}  B={sum(1 for c in core_list if c['rank']=='B')}  C={sum(1 for c in core_list if c['rank']=='C')})")

    print("\n=== Step 2: Load deadline sources ===")
    wikicfp_cache = load_wikicfp_cache()
    ccfddl_index  = load_ccfddl()

    print("\n=== Step 3: Match & build output ===")
    now     = datetime.now(timezone.utc)
    results: list[dict] = []
    missing: list[dict] = []
    wikicfp_hits = ccfddl_hits = 0

    for core_entry in core_list:
        raw_acronym = core_entry["acronym"]
        acronym     = normalize(raw_acronym)
        full_name   = core_entry["full_name"]
        rank        = core_entry["rank"]
        for_code    = core_entry.get("for_code", "")
        primary_domain = ACRONYM_DOMAIN_OVERRIDE.get(
                           acronym.upper(),
                           ACRONYM_DOMAIN_OVERRIDE.get(
                               raw_acronym.upper(),
                               FOR_TO_DOMAIN.get(for_code, "Systems")))
        domains = MULTI_DOMAIN.get(acronym.upper(),
                  MULTI_DOMAIN.get(raw_acronym.upper(),
                  [primary_domain]))

        # ── Try ccfddl first (higher quality for major CS conferences) ──
        ccf_key = acronym.upper()
        if ccf_key not in ccfddl_index and raw_acronym.upper() in ccfddl_index:
            ccf_key = raw_acronym.upper()
        if ccf_key in ccfddl_index:
            editions = ccfddl_editions(ccfddl_index[ccf_key], acronym, full_name, rank, domains, raw_acronym)
            if editions:
                ccfddl_hits += 1
                for ed in editions:
                    results.append(make_record(ed, acronym, full_name, rank, domains, raw_acronym))
                summary = ", ".join(f"{ed['_year']}:{ed['deadlines']['full_paper'][:10]}" for ed in editions[-3:])
                print(f"  ✓ [{rank}] {raw_acronym:20s}  ccfddl   [{len(editions)}ed] {summary}")
                continue

        # ── Fallback: WikiCFP (covers long-tail CORE B/C conferences not in ccfddl) ──
        wiki_editions = best_wikicfp_editions(acronym, wikicfp_cache)
        if not wiki_editions and acronym != raw_acronym:
            wiki_editions = best_wikicfp_editions(raw_acronym, wikicfp_cache)

        if wiki_editions:
            wikicfp_hits += 1
            for ed in wiki_editions:
                results.append(make_record(ed, acronym, full_name, rank, domains, raw_acronym))
            summary = ", ".join(f"{ed['_year']}:{ed['deadlines']['full_paper'][:10]}" for ed in wiki_editions[-3:])
            print(f"  ✓ [{rank}] {raw_acronym:20s}  WikiCFP  [{len(wiki_editions)}ed] {summary}")
            continue

        missing.append({"acronym": raw_acronym, "full_name": full_name, "rank": rank})
        print(f"  ✗ [{rank}] {raw_acronym:20s}  NO DATA")

    save_wikicfp_cache(wikicfp_cache)

    print("\n=== Step 4: Apply manual overrides ===")
    overrides = load_overrides()
    n_over = apply_overrides(results, overrides)
    print(f"  {n_over} records updated from {OVERRIDES_FILE}")

    # Sort: CSRankings first → active deadlines asc → TBD → expired last
    def sort_key(c):
        fp = c["deadlines"]["full_paper"]
        if is_tbd(fp): return (2, "9999", c.get("date",""))
        try:
            expired = 1 if to_utc(fp, c["timezone"]) <= now else 0
        except Exception:
            expired = 0
        return (expired, fp, "")

    results.sort(key=lambda c: (0 if c["is_csrankings"] else 1, *sort_key(c)))

    OUT_FILE.parent.mkdir(exist_ok=True)
    OUT_FILE.write_text(json.dumps(results, ensure_ascii=False, indent=2), encoding="utf-8")
    MISSING_FILE.write_text(json.dumps(missing, ensure_ascii=False, indent=2), encoding="utf-8")

    astar = sum(1 for c in results if c["rank_core"] == "A*")
    a     = sum(1 for c in results if c["rank_core"] == "A")
    csr   = sum(1 for c in results if c["is_csrankings"])
    print(f"\n✅ {len(results)} records → {OUT_FILE}")
    print(f"   ccfddl={ccfddl_hits}  WikiCFP(fallback)={wikicfp_hits}  overrides={n_over}")
    print(f"   CORE A★={astar}  A={a}  CSRankings={csr}")
    print(f"   Missing: {len(missing)} → {MISSING_FILE}")

if __name__ == "__main__":
    main()
