#!/usr/bin/env bash
set -euo pipefail

INPUT_CSV="${1:-data/rss-feeds/active-feed-names-20260302.csv}"
OUT_DIR="${2:-data/rss-feeds}"
DATE_TAG="${3:-$(date +%Y%m%d)}"

if [[ ! -f "$INPUT_CSV" ]]; then
  echo "Missing input CSV: $INPUT_CSV" >&2
  exit 1
fi

mkdir -p "$OUT_DIR"

python3 - <<'PY' "$INPUT_CSV" "$OUT_DIR" "$DATE_TAG"
import csv
import re
import sys
from pathlib import Path

input_csv = Path(sys.argv[1])
out_dir = Path(sys.argv[2])
date_tag = sys.argv[3]

states_config_path = Path("src/lib/india-states-config.ts")
ingest_fn_path = Path("supabase/functions/ingest-rss/index.ts")

rows = list(csv.DictReader(input_csv.open(encoding="utf-8")))
india_rows = [r for r in rows if (r.get("country_code") or "").upper() == "IN"]

state_name_map = {
    "andhra-pradesh": "Andhra Pradesh",
    "arunachal-pradesh": "Arunachal Pradesh",
    "assam": "Assam",
    "bihar": "Bihar",
    "chhattisgarh": "Chhattisgarh",
    "goa": "Goa",
    "gujarat": "Gujarat",
    "haryana": "Haryana",
    "himachal-pradesh": "Himachal Pradesh",
    "jharkhand": "Jharkhand",
    "karnataka": "Karnataka",
    "kerala": "Kerala",
    "madhya-pradesh": "Madhya Pradesh",
    "maharashtra": "Maharashtra",
    "manipur": "Manipur",
    "meghalaya": "Meghalaya",
    "mizoram": "Mizoram",
    "nagaland": "Nagaland",
    "odisha": "Odisha",
    "punjab": "Punjab",
    "rajasthan": "Rajasthan",
    "sikkim": "Sikkim",
    "tamil-nadu": "Tamil Nadu",
    "telangana": "Telangana",
    "tripura": "Tripura",
    "uttar-pradesh": "Uttar Pradesh",
    "uttarakhand": "Uttarakhand",
    "west-bengal": "West Bengal",
    "delhi": "Delhi",
    "jammu-kashmir": "Jammu and Kashmir",
    "ladakh": "Ladakh",
    "chandigarh": "Chandigarh",
    "puducherry": "Puducherry",
    "andaman-nicobar": "Andaman & Nicobar Islands",
    "lakshadweep": "Lakshadweep",
    "dadra-nagar-haveli-daman-diu": "Dadra & Nagar Haveli and Daman & Diu",
}

STATE_HINTS = {
    "andaman-nicobar": ["andaman", "nicobar", "port blair"],
    "andhra-pradesh": ["andhra pradesh", "andhra", "vijayawada", "visakhapatnam", "tirupati"],
    "arunachal-pradesh": ["arunachal pradesh", "itanagar"],
    "assam": ["assam", "guwahati"],
    "bihar": ["bihar", "patna"],
    "chandigarh": ["chandigarh"],
    "chhattisgarh": ["chhattisgarh", "raipur", "bilaspur"],
    "dadra-nagar-haveli-daman-diu": ["dadra", "nagar haveli", "daman", "diu", "silvassa"],
    "delhi": ["delhi", "new delhi", "delhi ncr"],
    "goa": ["goa", "panaji", "margao"],
    "gujarat": ["gujarat", "ahmedabad", "surat"],
    "haryana": ["haryana", "gurugram", "gurgaon", "faridabad"],
    "himachal-pradesh": ["himachal pradesh", "himachal", "shimla"],
    "jammu-kashmir": ["jammu", "kashmir", "srinagar"],
    "jharkhand": ["jharkhand", "ranchi", "jamshedpur"],
    "karnataka": ["karnataka", "bengaluru", "bangalore", "mysuru"],
    "kerala": ["kerala", "kochi", "thiruvananthapuram"],
    "ladakh": ["ladakh", "leh", "kargil"],
    "lakshadweep": ["lakshadweep", "kavaratti"],
    "madhya-pradesh": ["madhya pradesh", "bhopal", "indore"],
    "maharashtra": ["maharashtra", "mumbai", "pune", "nagpur"],
    "manipur": ["manipur", "imphal"],
    "meghalaya": ["meghalaya", "shillong"],
    "mizoram": ["mizoram", "aizawl"],
    "nagaland": ["nagaland", "kohima", "dimapur"],
    "odisha": ["odisha", "orissa", "bhubaneswar", "cuttack", "puri"],
    "puducherry": ["puducherry", "pondicherry"],
    "punjab": ["punjab", "amritsar", "ludhiana"],
    "rajasthan": ["rajasthan", "jaipur", "jodhpur"],
    "sikkim": ["sikkim", "gangtok"],
    "tamil-nadu": ["tamil nadu", "chennai", "coimbatore", "madurai"],
    "telangana": ["telangana", "hyderabad", "warangal"],
    "tripura": ["tripura", "agartala"],
    "uttar-pradesh": ["uttar pradesh", "lucknow", "kanpur", "varanasi"],
    "uttarakhand": ["uttarakhand", "dehradun", "haridwar"],
    "west-bengal": ["west bengal", "kolkata", "howrah", "siliguri"],
}

TOI_URL_TO_STATE = {
    "https://timesofindia.indiatimes.com/rssfeeds/52673929.cms": "gujarat",
    "https://timesofindia.indiatimes.com/rssfeeds/-2128769355.cms": "chandigarh",
    "https://timesofindia.indiatimes.com/rssfeeds/2673929.cms": "tamil-nadu",
    "https://timesofindia.indiatimes.com/rssfeeds/36692495.cms": "goa",
    "https://timesofindia.indiatimes.com/rssfeeds/-2128833038.cms": "telangana",
    "https://timesofindia.indiatimes.com/rssfeeds/-2128807284.cms": "rajasthan",
    "https://timesofindia.indiatimes.com/rssfeeds/52673931.cms": "west-bengal",
    "https://timesofindia.indiatimes.com/rssfeeds/-2128816011.cms": "uttar-pradesh",
}

def infer_state_id(name: str, url: str, publisher: str) -> str | None:
    if url in TOI_URL_TO_STATE:
        return TOI_URL_TO_STATE[url]
    n = (name or "").lower()
    u = (url or "").lower()
    p = (publisher or "").lower()
    for state_id, hints in STATE_HINTS.items():
        if any(h in n or h in u or h in p for h in hints):
            return state_id
    return None

states_config = states_config_path.read_text(encoding="utf-8")
region_match = re.search(r"export const REGION_GROUPS = \{([\s\S]*?)\n\};", states_config)
all_state_ids: set[str] = set()
if region_match:
    body = region_match.group(1)
    for arr in re.findall(r"\[(.*?)\]", body, flags=re.S):
        for token in arr.split(","):
            token = token.strip().strip('"').strip("'")
            if token:
                all_state_ids.add(token)
all_state_ids = set(sorted(all_state_ids))

state_rows: list[dict] = []
state_count: dict[str, int] = {}
mapping_count = {"explicit": 0, "inferred": 0, "national": 0}

for r in india_rows:
    state_id = (r.get("state_id") or "").strip()
    mapping_type = "explicit"

    if not state_id:
        inferred = infer_state_id(r.get("name", ""), r.get("url", ""), r.get("publisher", ""))
        if inferred:
            state_id = inferred
            mapping_type = "inferred"
        else:
            state_id = "india-national"
            mapping_type = "national"

    mapping_count[mapping_type] += 1
    state_count[state_id] = state_count.get(state_id, 0) + 1

    state_rows.append(
        {
            "state_id": state_id,
            "state_name": state_name_map.get(
                state_id,
                "India (National)" if state_id == "india-national" else state_id.replace("-", " ").title(),
            ),
            "mapping_type": mapping_type,
            "name": r.get("name", ""),
            "publisher": r.get("publisher") or "Unknown",
            "category": r.get("category") or "NULL",
            "language": r.get("language") or "NULL",
            "url": r.get("url") or "",
        }
    )

covered_state_ids = {k for k in state_count.keys() if k != "india-national"}
missing_state_ids = sorted([s for s in all_state_ids if s not in covered_state_ids])

ingest_text = ingest_fn_path.read_text(encoding="utf-8")
district_todo = "TODO: Implement district detection" in ingest_text

state_rows.sort(key=lambda x: (x["state_name"], x["name"]))
out_csv = out_dir / f"india-rss-coverage-audit-{date_tag}.csv"
out_md = out_dir / f"india-rss-coverage-audit-{date_tag}.md"

with out_csv.open("w", newline="", encoding="utf-8") as f:
    writer = csv.DictWriter(f, fieldnames=list(state_rows[0].keys()) if state_rows else ["state_id", "state_name", "mapping_type", "name", "publisher", "category", "language", "url"])
    writer.writeheader()
    if state_rows:
        writer.writerows(state_rows)

lines: list[str] = []
lines.append(f"# India RSS Coverage Audit ({date_tag})")
lines.append("")
lines.append(f"- Total India feeds: {len(india_rows)}")
lines.append(f"- Explicit state mapping: {mapping_count['explicit']}")
lines.append(f"- Inferred state mapping: {mapping_count['inferred']}")
lines.append(f"- National/non-state feeds: {mapping_count['national']}")
lines.append(f"- States/UTs configured in app: {len(all_state_ids)}")
lines.append(f"- States/UTs with at least one feed: {len(covered_state_ids)}")
lines.append(f"- States/UTs missing feeds: {len(missing_state_ids)}")
lines.append("")
lines.append("## Missing States/UTs")
if missing_state_ids:
    for s in missing_state_ids:
        lines.append(f"- {state_name_map.get(s, s)} (`{s}`)")
else:
    lines.append("- None")
lines.append("")
lines.append("## Feed Count by State/UT")
for sid, count in sorted(state_count.items(), key=lambda x: (-x[1], x[0])):
    name = state_name_map.get(sid, "India (National)" if sid == "india-national" else sid.replace("-", " ").title())
    lines.append(f"- {name}: {count}")
lines.append("")
lines.append("## District Coverage Status")
if district_todo:
    lines.append("- District detection in ingestion is not fully implemented yet (`district: null // TODO: Implement district detection`).")
else:
    lines.append("- District detection TODO marker not found in ingestion function.")
lines.append("- Result: district-level coverage is partial/inferred, not guaranteed complete.")

out_md.write_text("\n".join(lines) + "\n", encoding="utf-8")

print(out_csv)
print(out_md)
print(f"missing_states={len(missing_state_ids)}")
PY
