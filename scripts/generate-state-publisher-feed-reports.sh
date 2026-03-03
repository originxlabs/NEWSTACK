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
import sys
from pathlib import Path

input_csv = Path(sys.argv[1])
out_dir = Path(sys.argv[2])
date_tag = sys.argv[3]

rows = list(csv.DictReader(input_csv.open(encoding='utf-8')))

STATE_NAME_MAP = {
    'andhra-pradesh': 'Andhra Pradesh',
    'arunachal-pradesh': 'Arunachal Pradesh',
    'assam': 'Assam',
    'bihar': 'Bihar',
    'chhattisgarh': 'Chhattisgarh',
    'goa': 'Goa',
    'gujarat': 'Gujarat',
    'haryana': 'Haryana',
    'himachal-pradesh': 'Himachal Pradesh',
    'jharkhand': 'Jharkhand',
    'karnataka': 'Karnataka',
    'kerala': 'Kerala',
    'madhya-pradesh': 'Madhya Pradesh',
    'maharashtra': 'Maharashtra',
    'manipur': 'Manipur',
    'meghalaya': 'Meghalaya',
    'mizoram': 'Mizoram',
    'nagaland': 'Nagaland',
    'odisha': 'Odisha',
    'punjab': 'Punjab',
    'rajasthan': 'Rajasthan',
    'sikkim': 'Sikkim',
    'tamil-nadu': 'Tamil Nadu',
    'telangana': 'Telangana',
    'tripura': 'Tripura',
    'uttar-pradesh': 'Uttar Pradesh',
    'uttarakhand': 'Uttarakhand',
    'west-bengal': 'West Bengal',
    'delhi': 'Delhi',
    'jammu-kashmir': 'Jammu and Kashmir',
    'ladakh': 'Ladakh',
    'chandigarh': 'Chandigarh',
    'puducherry': 'Puducherry',
}

STATE_HINTS = {
    'andaman-nicobar': ['andaman', 'nicobar', 'port blair'],
    'andhra-pradesh': ['andhra pradesh', 'andhra', 'vijayawada', 'visakhapatnam', 'tirupati'],
    'arunachal-pradesh': ['arunachal pradesh', 'itanagar'],
    'assam': ['assam', 'guwahati'],
    'bihar': ['bihar', 'patna'],
    'chandigarh': ['chandigarh'],
    'chhattisgarh': ['chhattisgarh', 'raipur', 'bilaspur'],
    'dadra-nagar-haveli-daman-diu': ['dadra', 'nagar haveli', 'daman', 'diu', 'silvassa'],
    'delhi': ['delhi', 'new delhi', 'delhi ncr'],
    'goa': ['goa', 'panaji', 'margao'],
    'gujarat': ['gujarat', 'ahmedabad', 'surat'],
    'haryana': ['haryana', 'gurugram', 'gurgaon', 'faridabad'],
    'himachal-pradesh': ['himachal pradesh', 'himachal', 'shimla'],
    'jammu-kashmir': ['jammu', 'kashmir', 'srinagar'],
    'jharkhand': ['jharkhand', 'ranchi', 'jamshedpur'],
    'karnataka': ['karnataka', 'bengaluru', 'bangalore', 'mysuru'],
    'kerala': ['kerala', 'kochi', 'thiruvananthapuram'],
    'ladakh': ['ladakh', 'leh', 'kargil'],
    'lakshadweep': ['lakshadweep', 'kavaratti'],
    'madhya-pradesh': ['madhya pradesh', 'bhopal', 'indore'],
    'maharashtra': ['maharashtra', 'mumbai', 'pune', 'nagpur'],
    'manipur': ['manipur', 'imphal'],
    'meghalaya': ['meghalaya', 'shillong'],
    'mizoram': ['mizoram', 'aizawl'],
    'nagaland': ['nagaland', 'kohima', 'dimapur'],
    'odisha': ['odisha', 'orissa', 'bhubaneswar', 'cuttack', 'puri'],
    'puducherry': ['puducherry', 'pondicherry'],
    'punjab': ['punjab', 'amritsar', 'ludhiana'],
    'rajasthan': ['rajasthan', 'jaipur', 'jodhpur'],
    'sikkim': ['sikkim', 'gangtok'],
    'tamil-nadu': ['tamil nadu', 'chennai', 'coimbatore', 'madurai'],
    'telangana': ['telangana', 'hyderabad', 'warangal'],
    'tripura': ['tripura', 'agartala'],
    'uttar-pradesh': ['uttar pradesh', 'lucknow', 'kanpur', 'varanasi'],
    'uttarakhand': ['uttarakhand', 'dehradun', 'haridwar'],
    'west-bengal': ['west bengal', 'kolkata', 'howrah', 'siliguri'],
}

def infer_state_id(name: str, url: str, publisher: str) -> str | None:
    n = (name or '').lower()
    u = (url or '').lower()
    p = (publisher or '').lower()
    for state_id, hints in STATE_HINTS.items():
        if any(h in n or h in u or h in p for h in hints):
            return state_id
    return None

india_rows = [r for r in rows if (r.get('country_code') or '').upper() == 'IN']
state_records = []

for r in india_rows:
    state_id = (r.get('state_id') or '').strip()
    mapping_type = 'explicit'

    if not state_id:
        inferred = infer_state_id(r.get('name', ''), r.get('url', ''), r.get('publisher', ''))
        if inferred:
            state_id = inferred
            mapping_type = 'inferred'
        else:
            state_id = 'india-national'
            mapping_type = 'national'

    state_name = STATE_NAME_MAP.get(state_id, 'India (National)' if state_id == 'india-national' else state_id.replace('-', ' ').title())

    state_records.append({
        'state_id': state_id,
        'state_name': state_name,
        'mapping_type': mapping_type,
        'name': r.get('name', ''),
        'publisher': r.get('publisher') or 'Unknown',
        'url': r.get('url', ''),
        'country_code': r.get('country_code') or 'IN',
        'category': r.get('category') or 'NULL',
        'language': r.get('language') or 'NULL',
        'reliability_tier': r.get('reliability_tier') or 'NULL',
        'source_type': r.get('source_type') or 'NULL',
        'fetch_interval_minutes': r.get('fetch_interval_minutes') or 'NULL',
        'priority': r.get('priority') or 'NULL',
    })

state_records.sort(key=lambda x: (x['state_name'], x['name']))

publisher_records = []
for r in rows:
    publisher_records.append({
        'publisher': (r.get('publisher') or 'Unknown').strip() or 'Unknown',
        'name': r.get('name', ''),
        'url': r.get('url', ''),
        'country_code': r.get('country_code') or 'NULL',
        'category': r.get('category') or 'NULL',
        'language': r.get('language') or 'NULL',
        'reliability_tier': r.get('reliability_tier') or 'NULL',
        'source_type': r.get('source_type') or 'NULL',
        'fetch_interval_minutes': r.get('fetch_interval_minutes') or 'NULL',
        'priority': r.get('priority') or 'NULL',
    })

publisher_records.sort(key=lambda x: (x['publisher'].lower(), x['name'].lower()))

state_csv = out_dir / f'active-feeds-india-state-wise-{date_tag}.csv'
state_md = out_dir / f'active-feeds-india-state-wise-{date_tag}.md'
publisher_csv = out_dir / f'active-feeds-publisher-wise-{date_tag}.csv'
publisher_md = out_dir / f'active-feeds-publisher-wise-{date_tag}.md'

def write_csv(path: Path, data: list[dict]):
    if not data:
        path.write_text('', encoding='utf-8')
        return
    with path.open('w', newline='', encoding='utf-8') as f:
        w = csv.DictWriter(f, fieldnames=list(data[0].keys()))
        w.writeheader()
        w.writerows(data)

write_csv(state_csv, state_records)
write_csv(publisher_csv, publisher_records)

by_state = {}
by_mapping = {}
for r in state_records:
    by_state[r['state_name']] = by_state.get(r['state_name'], 0) + 1
    by_mapping[r['mapping_type']] = by_mapping.get(r['mapping_type'], 0) + 1

by_publisher = {}
for r in publisher_records:
    by_publisher[r['publisher']] = by_publisher.get(r['publisher'], 0) + 1

state_lines = []
state_lines.append(f'# India State-wise RSS Feed Report ({date_tag})')
state_lines.append('')
state_lines.append(f'- Total India active feeds: {len(india_rows)}')
state_lines.append(f"- Explicit state mapping: {by_mapping.get('explicit', 0)}")
state_lines.append(f"- Inferred state mapping: {by_mapping.get('inferred', 0)}")
state_lines.append(f"- National (non-state-specific): {by_mapping.get('national', 0)}")
state_lines.append('')
state_lines.append('## Feed Count by State')
for state_name, count in sorted(by_state.items(), key=lambda x: (-x[1], x[0])):
    state_lines.append(f'- {state_name}: {count}')
state_lines.append('')
state_lines.append('## State-wise Feeds')
current_state = None
for r in state_records:
    if r['state_name'] != current_state:
        current_state = r['state_name']
        state_lines.append(f'')
        state_lines.append(f'### {current_state}')
    state_lines.append(f"- {r['name']} | {r['publisher']} | {r['category']} | {r['language']} | {r['url']}")
state_md.write_text('\n'.join(state_lines) + '\n', encoding='utf-8')

pub_lines = []
pub_lines.append(f'# Publisher-wise RSS Feed Report ({date_tag})')
pub_lines.append('')
pub_lines.append(f'- Total active feeds: {len(publisher_records)}')
pub_lines.append(f'- Total publishers: {len(by_publisher)}')
pub_lines.append('')
pub_lines.append('## Feed Count by Publisher')
for pub, count in sorted(by_publisher.items(), key=lambda x: (-x[1], x[0])):
    pub_lines.append(f'- {pub}: {count}')
pub_lines.append('')
pub_lines.append('## Publisher-wise Feeds')
current_pub = None
for r in publisher_records:
    if r['publisher'] != current_pub:
        current_pub = r['publisher']
        pub_lines.append('')
        pub_lines.append(f'### {current_pub}')
    pub_lines.append(f"- {r['name']} | {r['country_code']} | {r['category']} | {r['url']}")
publisher_md.write_text('\n'.join(pub_lines) + '\n', encoding='utf-8')

print(state_csv)
print(state_md)
print(publisher_csv)
print(publisher_md)
print(f'india_state_records={len(state_records)}')
print(f'publisher_records={len(publisher_records)}')
PY
