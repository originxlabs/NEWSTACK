#!/usr/bin/env bash
set -euo pipefail

INPUT_CSV="${1:-data/rss-feeds/active-feed-names-20260302.csv}"
OUT_DIR="${2:-data/rss-feeds}"

if [[ ! -f "$INPUT_CSV" ]]; then
  echo "Missing input CSV: $INPUT_CSV" >&2
  exit 1
fi

mkdir -p "$OUT_DIR"

python3 - <<'PY' "$INPUT_CSV" "$OUT_DIR"
import csv
from pathlib import Path
import sys

input_csv = Path(sys.argv[1])
out_dir = Path(sys.argv[2])

today = "20260302"
rows = list(csv.DictReader(input_csv.open(encoding="utf-8")))

india = [r for r in rows if (r.get("country_code") or "").strip().upper() == "IN"]
global_rows = [r for r in rows if (r.get("country_code") or "").strip().upper() != "IN"]

def write_csv(path: Path, data):
    if not data:
        path.write_text("", encoding="utf-8")
        return
    with path.open("w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=list(data[0].keys()))
        w.writeheader()
        w.writerows(data)

def write_md(path: Path, title: str, data):
    publishers = sorted({(r.get("publisher") or "Unknown").strip() for r in data})
    by_category = {}
    for r in data:
        cat = (r.get("category") or "NULL").strip() or "NULL"
        by_category[cat] = by_category.get(cat, 0) + 1

    lines = []
    lines.append(f"# {title} ({today})")
    lines.append("")
    lines.append(f"- Active feeds: {len(data)}")
    lines.append(f"- Media publishers: {len(publishers)}")
    lines.append("")
    lines.append("## Feed Count by Category")
    for k in sorted(by_category.keys()):
        lines.append(f"- `{k}`: {by_category[k]}")
    lines.append("")
    lines.append("## Media (Publishers)")
    for p in publishers:
        lines.append(f"- {p}")
    lines.append("")
    lines.append("## Active RSS Feeds")
    for r in sorted(data, key=lambda x: (x.get("publisher") or "", x.get("name") or "")):
        lines.append(
            f"- {r.get('name','')} | {r.get('publisher') or 'Unknown'} | {r.get('country_code') or 'NULL'} | {r.get('category') or 'NULL'} | {r.get('url','')}"
        )

    path.write_text("\n".join(lines) + "\n", encoding="utf-8")

india_csv = out_dir / f"active-feed-names-india-{today}.csv"
india_md = out_dir / f"active-feed-names-india-{today}.md"
global_csv = out_dir / f"active-feed-names-global-{today}.csv"
global_md = out_dir / f"active-feed-names-global-{today}.md"

write_csv(india_csv, india)
write_md(india_md, "India RSS Feed Names", india)
write_csv(global_csv, global_rows)
write_md(global_md, "Global RSS Feed Names", global_rows)

print(f"india_feeds={len(india)}")
print(f"global_feeds={len(global_rows)}")
print(india_csv)
print(india_md)
print(global_csv)
print(global_md)
PY
