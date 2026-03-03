#!/usr/bin/env bash
set -euo pipefail

DATASET_PATH="${1:-data/rss-feeds/validated-global-india-20260302.tsv}"
PAYLOAD_PATH="/tmp/newstack-rss-sync-payload.json"

if [[ ! -f .env ]]; then
  echo "Missing .env" >&2
  exit 1
fi

if [[ ! -f "$DATASET_PATH" ]]; then
  echo "Missing dataset: $DATASET_PATH" >&2
  exit 1
fi

load_env_file() {
  while IFS= read -r raw || [[ -n "$raw" ]]; do
    line="${raw#${raw%%[![:space:]]*}}"
    line="${line%${line##*[![:space:]]}}"
    [[ -z "$line" || "$line" == \#* ]] && continue
    [[ "$line" != *"="* ]] && continue

    key="${line%%=*}"
    value="${line#*=}"

    key="${key%${key##*[![:space:]]}}"
    key="${key#${key%%[![:space:]]*}}"
    value="${value#${value%%[![:space:]]*}}"
    value="${value%${value##*[![:space:]]}}"

    [[ ! "$key" =~ ^[A-Za-z_][A-Za-z0-9_]*$ ]] && continue
    value="${value%\"}"
    value="${value#\"}"
    export "$key=$value"
  done < .env
}

load_env_file

SUPABASE_URL="${VITE_SUPABASE_URL:-}"
PUBLIC_KEY="${VITE_SUPABASE_ANON_KEY:-${VITE_SUPABASE_PUBLISHABLE_KEY:-}}"
SYNC_SECRET="${CRON_INGEST_SECRET:-}"

if [[ -z "$SUPABASE_URL" || -z "$PUBLIC_KEY" || -z "$SYNC_SECRET" ]]; then
  echo "Missing VITE_SUPABASE_URL, public key, or CRON_INGEST_SECRET in .env" >&2
  exit 1
fi

python3 - <<'PY' "$DATASET_PATH" "$PAYLOAD_PATH"
import csv
import json
import sys

source_path, payload_path = sys.argv[1], sys.argv[2]

STATE_HINTS = {
    "andaman-nicobar": ["andaman", "nicobar", "port blair"],
    "andhra-pradesh": ["andhra pradesh", "andhra", "vijayawada", "visakhapatnam", "tirupati", "amaravati"],
    "arunachal-pradesh": ["arunachal pradesh", "itanagar"],
    "assam": ["assam", "guwahati"],
    "bihar": ["bihar", "patna"],
    "chandigarh": ["chandigarh"],
    "chhattisgarh": ["chhattisgarh", "raipur", "bilaspur"],
    "dadra-nagar-haveli-daman-diu": ["dadra", "nagar haveli", "daman", "diu", "silvassa"],
    "delhi": ["delhi", "new delhi", "delhi ncr"],
    "goa": ["goa", "panaji", "margao"],
    "gujarat": ["gujarat", "ahmedabad", "surat", "vadodara", "rajkot"],
    "haryana": ["haryana", "gurugram", "gurgaon", "faridabad"],
    "himachal-pradesh": ["himachal pradesh", "himachal", "shimla"],
    "jammu-kashmir": ["jammu", "kashmir", "srinagar"],
    "jharkhand": ["jharkhand", "ranchi", "jamshedpur"],
    "karnataka": ["karnataka", "bengaluru", "bangalore", "mysuru", "mangalore"],
    "kerala": ["kerala", "kochi", "thiruvananthapuram", "kozhikode"],
    "ladakh": ["ladakh", "leh", "kargil"],
    "lakshadweep": ["lakshadweep", "kavaratti"],
    "madhya-pradesh": ["madhya pradesh", "bhopal", "indore", "jabalpur"],
    "maharashtra": ["maharashtra", "mumbai", "pune", "nagpur", "nashik"],
    "manipur": ["manipur", "imphal"],
    "meghalaya": ["meghalaya", "shillong"],
    "mizoram": ["mizoram", "aizawl"],
    "nagaland": ["nagaland", "kohima", "dimapur"],
    "odisha": ["odisha", "orissa", "bhubaneswar", "cuttack", "puri"],
    "puducherry": ["puducherry", "pondicherry"],
    "punjab": ["punjab", "amritsar", "ludhiana", "jalandhar"],
    "rajasthan": ["rajasthan", "jaipur", "jodhpur", "udaipur", "kota"],
    "sikkim": ["sikkim", "gangtok"],
    "tamil-nadu": ["tamil nadu", "chennai", "coimbatore", "madurai", "tiruchirappalli"],
    "telangana": ["telangana", "hyderabad", "secunderabad", "warangal"],
    "tripura": ["tripura", "agartala"],
    "uttar-pradesh": ["uttar pradesh", "lucknow", "kanpur", "varanasi", "noida"],
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

def get_field(row, *keys, default=""):
    for k in keys:
        if k in row and row[k] is not None:
            value = str(row[k]).strip()
            if value:
                return value
    return default

def infer_state_id(name: str, url: str, publisher: str) -> str | None:
    norm_name = name.lower()
    norm_url = url.lower()
    norm_publisher = publisher.lower()

    toi_state = TOI_URL_TO_STATE.get(url)
    if toi_state:
        return toi_state

    for state_id, hints in STATE_HINTS.items():
        for hint in hints:
            if hint in norm_name or hint in norm_url or hint in norm_publisher:
                return state_id

    return None

rows = []
with open(source_path, encoding="utf-8") as f:
    for r in csv.DictReader(f, delimiter="\t"):
        name = get_field(r, "name")
        if name.startswith("Indian: "):
            name = name.replace("Indian: ", "", 1)
        if name.startswith("Indian Local: "):
            name = name.replace("Indian Local: ", "", 1)

        url = get_field(r, "url")
        publisher = get_field(r, "publisher", default="")
        country = get_field(r, "country_code", "country", default="")
        language = get_field(r, "language", default="en") or "en"
        category = get_field(r, "category", default="World") or "World"
        reliability = get_field(r, "reliability_tier", "reliability", default="tier_2") or "tier_2"
        source_type = get_field(r, "source_type", default="secondary") or "secondary"
        fetch_interval = int(get_field(r, "fetch_interval_minutes", "fetch_interval", default="30"))
        priority = int(get_field(r, "priority", default="50"))
        state_id = get_field(r, "state_id", default="").lower() or None

        if not state_id and country.upper() == "IN":
            state_id = infer_state_id(name, url, publisher)

        rows.append({
            "name": name,
            "url": url,
            "publisher": publisher or None,
            "country_code": None if country.upper() in ("", "NULL") else country.upper(),
            "language": language,
            "category": category,
            "reliability_tier": reliability,
            "source_type": source_type,
            "fetch_interval_minutes": fetch_interval,
            "priority": priority,
            "state_id": state_id,
        })

with open(payload_path, "w", encoding="utf-8") as f:
    json.dump({"feeds": rows}, f)

print(f"Prepared payload with {len(rows)} feeds")
PY

curl -sS "$SUPABASE_URL/functions/v1/sync-rss-feeds" \
  -H "Content-Type: application/json" \
  -H "apikey: $PUBLIC_KEY" \
  -H "Authorization: Bearer $PUBLIC_KEY" \
  -H "x-sync-secret: $SYNC_SECRET" \
  --data-binary "@$PAYLOAD_PATH"

echo
echo "RSS sync completed."
