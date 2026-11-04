from __future__ import annotations

import json
import os
import re
import sqlite3
import time
import uuid
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple
from urllib.parse import quote
from urllib.request import Request, urlopen

ROOT = Path('/mnt/c/Users/jakeg/workspace/realestatecrm')
LEGALNEWS_PATH = Path('/tmp/macomb_week_2026-07-11_legalnews.json')
CRM_JSON = ROOT / 'data' / 'crm-records.json'
QUEUE_JSON = ROOT / 'data' / 'sync-queue.json'
DB_PATH = ROOT / 'prisma' / 'dev.db'
ENV_PATH = ROOT / '.env.local'

HANK_ID = 844766863199376
HARRY_ID = 844766901547858
OWNERSHIP_ID = 844767224162077
OWNERSHIP_SCOPE = 'TEAM'
SOURCE_SYSTEM = 'Legal News - Macomb Foreclosures'
WORKSPACE_ID = 'excel-legacy-team'

@dataclass
class LeadRecord:
    notice_id: str
    full_name: str
    address: str
    phones: List[str]


def now_iso() -> str:
    return datetime.now().isoformat(timespec='seconds')


def now_ms() -> int:
    return int(time.time() * 1000)



def digits_only(value: str) -> str:
    return re.sub(r'\D+', '', value or '')


def first_last(name: str) -> Tuple[str, str]:
    name = re.sub(r'\s+', ' ', (name or '').strip())
    if not name:
        return ('Unknown', 'Unknown')
    # take first named party only when multiple are present
    for sep in [' and ', ' & ', ',']:
        if sep in name:
            name = name.split(sep, 1)[0].strip()
            break
    # remove parenthetical qualifiers like "(single woman)"
    name = re.sub(r'\s*\(.*?\)\s*', '', name).strip()
    parts = name.split()
    if len(parts) == 1:
        return (parts[0], parts[0])
    return (' '.join(parts[:-1]), parts[-1])


def split_address(address: str) -> Tuple[str, str, str, str]:
    # returns street, city, state, zip
    a = re.sub(r'\s+', ' ', address).strip().strip('*')
    # remove trailing qualifiers in parentheses
    a = re.sub(r'\s*\([^)]*\)\s*$', '', a).strip()
    # handle common patterns
    m = re.match(r"^(.*?)(?:,\s*([A-Za-z .']+?))?,\s*([A-Z]{2})\s+(\d{5}(?:-\d{4})?)$", a)
    if m:
        street = m.group(1).strip().strip(',')
        city = (m.group(2) or '').strip().strip(',')
        state = m.group(3)
        zipc = m.group(4)
        return street, city, state, zipc
    # fallback: use last two commas
    parts = [p.strip() for p in a.split(',')]
    if len(parts) >= 3:
        street = ', '.join(parts[:-2]).strip()
        city = parts[-2]
        state_zip = parts[-1].split()
        state = state_zip[0] if state_zip else 'MI'
        zipc = state_zip[1] if len(state_zip) > 1 else ''
        return street, city, state, zipc
    return a, '', 'MI', ''


def normalize_address(addr: str) -> str:
    s = digits_only(addr)
    return re.sub(r'\s+', ' ', addr.lower()).replace('.', '').replace(',', '').strip()


def load_env_key() -> str:
    text = ENV_PATH.read_text(encoding='utf-8', errors='replace')
    m = re.search(r'^LOFTY_API_KEY=(.+)$', text, re.M)
    if not m:
        raise RuntimeError('LOFTY_API_KEY not found in .env.local')
    key = m.group(1).strip().strip('"').strip("'")
    if not key or key == '***':
        raise RuntimeError('LOFTY_API_KEY is missing or redacted')
    return key


API_KEY = load_env_key()


def lofty_request(method: str, path: str, payload: Optional[dict] = None) -> Tuple[int, Any]:
    url = f'https://api.lofty.com/v1.0{path}'
    headers = {'Authorization': f'token {API_KEY}'}
    data = None
    if payload is not None:
        headers['Content-Type'] = 'application/json'
        data = json.dumps(payload).encode('utf-8')
    req = Request(url, data=data, headers=headers, method=method)
    with urlopen(req, timeout=30) as resp:
        body = resp.read().decode('utf-8', errors='replace')
        try:
            parsed = json.loads(body) if body else None
        except json.JSONDecodeError:
            parsed = body
        return resp.status, parsed


def lofty_get(path: str) -> Any:
    return lofty_request('GET', path)[1]


def lofty_post(path: str, payload: dict) -> Any:
    return lofty_request('POST', path, payload)[1]


def lofty_put(path: str, payload: dict) -> Any:
    return lofty_request('PUT', path, payload)[1]


def lofty_delete(path: str) -> Any:
    return lofty_request('DELETE', path)[1]


def search_lofty_for_address(address: str, name: str) -> Optional[dict]:
    street_num = re.search(r'\b(\d+)', address)
    key_terms = []
    if street_num:
        key_terms.append(street_num.group(1))
    fn, ln = first_last(name)
    if ln:
        key_terms.append(ln)
    key_terms.append(address.split(',')[0])
    seen = set()
    for key in key_terms:
        key = key.strip()
        if not key or key in seen:
            continue
        seen.add(key)
        try:
            resp = lofty_get(f'/leads?key={quote(key)}&limit=100')
        except Exception:
            continue
        leads = resp.get('leads', []) if isinstance(resp, dict) else []
        wanted = normalize_address(address)
        for lead in leads:
            lead_addr = ' '.join(str(lead.get(k, '') or '') for k in ['streetAddress', 'city', 'state', 'zipCode']).strip()
            if lead_addr and wanted.split()[0] in normalize_address(lead_addr):
                # best-effort exact street number + street token check
                if re.search(r'\b\d+', wanted) and re.search(r'\b\d+', normalize_address(lead_addr)):
                    return lead
        for lead in leads:
            lead_addr = ' '.join(str(lead.get(k, '') or '') for k in ['streetAddress', 'city', 'state', 'zipCode']).strip()
            if normalize_address(lead_addr) == wanted:
                return lead
    return None


def existing_contact_id(db: sqlite3.Connection, first_name: str, last_name: str) -> Optional[str]:
    cur = db.cursor()
    cur.execute('SELECT id FROM Contact WHERE firstName=? AND lastName=? LIMIT 1', (first_name, last_name))
    row = cur.fetchone()
    return row[0] if row else None


def cuid_like() -> str:
    return 'c' + uuid.uuid4().hex[:20]


def make_address_note(address: str, notice_id: str) -> str:
    return f"""=== PROPERTY ADDRESS ===
{address}
(From Legal News foreclosure notice - notice {notice_id})"""


def make_notice_note(record: LeadRecord, raw_notice_text: str, sale_date: str = '', amount_due: str = '') -> str:
    return f"""=== FORECLOSURE NOTICE ===

MORTGAGOR: {record.full_name}
PROPERTY ADDRESS: {record.address}
SALE DATE: {sale_date}
AMOUNT CLAIMED DUE: {amount_due}
SOURCE: Legal News — Macomb Foreclosures
NOTICE URL: https://www.legalnews.com/Home/PublicNoticesDetails/{record.notice_id}

--- FULL NOTICE TEXT ---
{raw_notice_text}
--- END NOTICE ---"""


def parse_sale_amount_and_date(raw_notice_text: str) -> Tuple[str, str]:
    sale_date = ''
    amount = ''
    m = re.search(r'Sale Date[^\n]*[:\-]\s*([^\n|]+)', raw_notice_text, re.I)
    if m:
        sale_date = m.group(1).strip()
    m = re.search(r'Amount Claimed Due[^\n]*[:\-]\s*\*\*?\$?([\d,]+(?:\.\d{2})?)', raw_notice_text, re.I)
    if m:
        amount = '$' + m.group(1)
    return sale_date, amount


def stable_name(name: str) -> Tuple[str, str]:
    fn, ln = first_last(name)
    return fn[:50], ln[:50]


RECORDS: List[LeadRecord] = [
    LeadRecord('1376406', 'Darius Hannah', '22290 Eastwood Avenue, Warren, Michigan 48089', ['5862166922', '5868225383', '5862164811', '5867319020', '5865829267', '5864945155', '5868548203']),
    LeadRecord('1376405', 'Jennifer C. Griffith', '8459 FRANCINE STREET, WARREN, MI 48093', []),
    LeadRecord('1376404', 'Michael J. Karwoski', '26015 Felicity Lndg., Harrison Twp, MI 48045', []),
    LeadRecord('1376403', 'Antoinette Street', '11441 Fisher Ave, Warren, MI 48089', []),
    LeadRecord('1376400', 'Dariusz Jaworski', '35436 Stillmeadow Ln, Clinton Twp., MI 48035', []),
    LeadRecord('1376397', 'Leeda Francia Tena-Palaspas', '14275 Elmhurst Dr., Sterling Heights, Michigan 48313', []),
    LeadRecord('1376396', 'Mutaz Alkatib', '2458 LINDELL RD., STERLING HEIGHTS, MI 48310', []),
    LeadRecord('1376387', 'Jason Mathew', '36425 Park Place Drive, Sterling Heights, MI 48310', []),
    LeadRecord('1376380', 'Sharon Kazusky', '36347 Park Place Drive, Sterling Heights, Michigan 48310', []),
    LeadRecord('1376379', "Pamela J. O'Farrell", '13730 Heritage Road, Sterling Heights, MI 48312', []),
    LeadRecord('1376367', 'Jason N. Acosta', '23000 Lingemann St., Saint Clair Shores, MI 48080', []),
    LeadRecord('1376366', 'Alicia Perkins', '16329 Andover Drive, Clinton Township, Michigan 48035', []),
    LeadRecord('1376365', 'Amber Gingas', '26655 Dale St, Roseville, MI 48066', ['5864778296', '5866259327', '5867889528']),
    LeadRecord('1376364', 'Kenneth Bowman', '61555 Bates Rd, Lenox, MI 48048', []),
    LeadRecord('1376363', 'Thomas J. Roberts', '201 Moross St, Mount Clemens, MI 48043', []),
    LeadRecord('1376362', 'Cherylita Feagin', '19005 Mott Avenue, Eastpointe, Michigan 48021', ['3135988852', '5863628647', '5867777554', '3133996015', '3138080887']),
    LeadRecord('1376361', 'Shaina Hale', '39626 Aynesley St, Clinton Township, MI 48038', ['5866259294', '5862162148', '3134046353', '5862379911', '5866253583']),
    LeadRecord('1376360', 'Janae Denise Fordham', '26210 Clancy St, Roseville, MI 48066', ['5862443419', '3136107254', '3136238540']),
    LeadRecord('1376359', 'Zachary J. Noetzold', '7512 Dodge Ave, Warren, MI 48091', []),
    LeadRecord('1376358', 'Erica N. Manning', '22126 Birchwood Ave, Eastpointe, MI 48021', []),
    LeadRecord('1376356', 'Raquel Wright', '12419 El Camino Dr, Sterling Heights, MI 48312', []),
    LeadRecord('1376341', 'Brian Kubiak', '13715 Leonard Ave, Warren, Michigan 48089', []),
    LeadRecord('1376330', 'Ronald J. Kource', '41836 Montroy Dr, Sterling Heights, MI 48313', ['5864847656', '5867377199', '2484590709', '5868034027']),
    LeadRecord('1376297', 'Melissa Kage', '19850 Washington St, Roseville, MI 48066-7607', []),
    LeadRecord('1376295', 'Dean Gauthier Jr', '29450 Wand Dr, Chesterfield, MI 48047-5169', []),
]


def main() -> None:
    raw = json.loads(LEGALNEWS_PATH.read_text(encoding='utf-8'))
    raw_by_id = {Path(item['url']).name: item['content'] for item in raw}

    crm = json.loads(CRM_JSON.read_text(encoding='utf-8'))
    queue = json.loads(QUEUE_JSON.read_text(encoding='utf-8'))
    records_store = crm.get('records', [])
    queue_items = queue.get('items', [])

    db = sqlite3.connect(str(DB_PATH))
    db.row_factory = sqlite3.Row

    summary = []

    for idx, rec in enumerate(RECORDS, start=1):
        fn, ln = stable_name(rec.full_name)
        street, city, state, zipc = split_address(rec.address)
        sale_date, amount_due = parse_sale_amount_and_date(raw_by_id.get(rec.notice_id, ''))
        raw_notice = raw_by_id.get(rec.notice_id, '')
        if not raw_notice:
            raise RuntimeError(f'Missing raw notice text for {rec.notice_id}')

        existing = search_lofty_for_address(rec.address, rec.full_name)
        existed = existing is not None
        if existed:
            lead_id = existing['leadId']
        else:
            create_payload = {
                'firstName': fn,
                'lastName': ln,
                'source': SOURCE_SYSTEM,
                'leadType': 1,
                'leadTypes': [1],
                'streetAddress': street,
                'city': city,
                'state': state or 'MI',
                'zipCode': zipc,
                'phones': rec.phones,
            }
            created = lofty_post('/leads', create_payload)
            lead_id = created['leadId']

        update_payload = {
            'firstName': fn,
            'lastName': ln,
            'streetAddress': street,
            'city': city,
            'state': state or 'MI',
            'zipCode': zipc,
            'phones': rec.phones,
            'tags': ['Preforeclosure'],
            'segments': ['Preforeclosure'],
            'assignedUserId': HANK_ID if idx % 2 == 1 else HARRY_ID,
            'ownershipId': OWNERSHIP_ID,
            'ownershipScope': OWNERSHIP_SCOPE,
            'source': SOURCE_SYSTEM,
        }
        lofty_put(f'/leads/{lead_id}', update_payload)
        if rec.phones:
            lofty_put(f'/leads/{lead_id}', {
                'firstName': fn,
                'lastName': ln,
                'phones': rec.phones,
            })

        lofty_post('/notes', {
            'leadId': lead_id,
            'content': make_address_note(rec.address, rec.notice_id),
        })
        lofty_post('/notes', {
            'leadId': lead_id,
            'content': make_notice_note(rec, raw_notice, sale_date=sale_date, amount_due=amount_due),
        })

        other_agent = HARRY_ID if idx % 2 == 1 else HANK_ID
        original_agent = HANK_ID if idx % 2 == 1 else HARRY_ID
        toggle_payload = {
            'firstName': fn,
            'lastName': ln,
            'assignedUserId': other_agent,
            'ownershipId': OWNERSHIP_ID,
            'ownershipScope': OWNERSHIP_SCOPE,
        }
        lofty_put(f'/leads/{lead_id}', toggle_payload)
        time.sleep(5)
        toggle_back = {
            'firstName': fn,
            'lastName': ln,
            'assignedUserId': original_agent,
            'ownershipId': OWNERSHIP_ID,
            'ownershipScope': OWNERSHIP_SCOPE,
        }
        lofty_put(f'/leads/{lead_id}', toggle_back)

        # CRM json update
        created_at = now_iso()
        existing_record = next((r for r in records_store if r.get('sourceRecordId') == rec.notice_id or r.get('id') == f'foreclosure-{fn.lower()}-{ln.lower()}'), None)
        payload = {
            'firstName': fn,
            'lastName': ln,
            'segment': 'Preforeclosure',
            'assignedAgent': 'Hank Mendez' if idx % 2 == 1 else 'Harry Kourlos',
            'tags': ['Preforeclosure'],
            'amountOwed': amount_due,
            'saleDate': sale_date,
            'loftyLeadId': lead_id,
            'phones': rec.phones,
            'address': rec.address,
            'noticeText': raw_notice,
            'notes': raw_notice,
        }
        record_obj = {
            'id': f'foreclosure-{fn.lower().replace(" ", "-")}-{ln.lower().replace(" ", "-")}',
            'workspaceId': WORKSPACE_ID,
            'recordType': 'LEAD',
            'workflowType': 'foreclosure-intake',
            'displayName': f'{fn} {ln} - Preforeclosure',
            'subtitle': 'Macomb County foreclosure',
            'primaryAddress': rec.address,
            'status': 'PREFORECLOSURE',
            'sourceSystem': SOURCE_SYSTEM,
            'sourceRecordId': rec.notice_id,
            'payload': payload,
            'createdAt': created_at,
            'updatedAt': created_at,
        }
        if existing_record:
            existing_record.update(record_obj)
        else:
            records_store.append(record_obj)

        queue_item = {
            'id': f'q-{fn.lower().replace(" ", "-")}-{ln.lower().replace(" ", "-")}',
            'leadId': str(lead_id),
            'name': f'{fn} {ln}',
            'address': rec.address,
            'agent': 'Hank Mendez' if idx % 2 == 1 else 'Harry Kourlos',
            'status': 'SYNCED',
            'source': 'Legal News (Jul 5-11, 2026)',
            'syncedAt': created_at,
        }
        existing_q = next((q for q in queue_items if str(q.get('leadId')) == str(lead_id) or q.get('id') == queue_item['id']), None)
        if existing_q:
            existing_q.update(queue_item)
        else:
            queue_items.append(queue_item)

        # Prisma/SQLite upsert-ish insert
        contact_id = existing_contact_id(db, fn, ln)
        now = now_ms()
        if not contact_id:
            contact_id = cuid_like()
            primary_phone = rec.phones[0] if rec.phones else None
            db.execute(
                'INSERT INTO Contact (id, firstName, lastName, phone, workspaceId, createdAt, updatedAt) VALUES (?,?,?,?,?,?,?)',
                (contact_id, fn, ln, primary_phone, WORKSPACE_ID, now, now),
            )
        else:
            primary_phone = rec.phones[0] if rec.phones else None
            if primary_phone:
                db.execute('UPDATE Contact SET phone=?, updatedAt=? WHERE id=?', (primary_phone, now, contact_id))

        lead_db_id = f'lead-{lead_id}'
        public_records = json.dumps({
            'noticeId': rec.notice_id,
            'address': rec.address,
            'phones': rec.phones,
            'loftyLeadId': lead_id,
            'source': SOURCE_SYSTEM,
            'rawNoticePreview': raw_notice[:1800],
        }, ensure_ascii=False)
        existing_lead = db.execute('SELECT id FROM Lead WHERE contactId=? AND workspaceId=? LIMIT 1', (contact_id, WORKSPACE_ID)).fetchone()
        if not existing_lead:
            db.execute(
                'INSERT INTO Lead (id, source, status, score, workspaceId, contactId, userId, isAiAssisted, socialProfiles, publicRecords, lastEnrichedAt, createdAt, updatedAt, smartPlanId) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
                (lead_db_id, SOURCE_SYSTEM, 'NEW', 75, WORKSPACE_ID, contact_id, str(original_agent), 0, None, public_records, now, now, now, None),
            )
        else:
            db.execute('UPDATE Lead SET source=?, publicRecords=?, lastEnrichedAt=?, updatedAt=? WHERE contactId=? AND workspaceId=?', (SOURCE_SYSTEM, public_records, now, now, contact_id, WORKSPACE_ID))

        summary.append({
            'notice_id': rec.notice_id,
            'name': f'{fn} {ln}',
            'leadId': lead_id,
            'phones': rec.phones,
            'existing': existed,
        })
        print(json.dumps(summary[-1], ensure_ascii=False))

        time.sleep(0.3)

    db.commit()
    db.close()

    CRM_JSON.write_text(json.dumps(crm, indent=2, ensure_ascii=False), encoding='utf-8')
    QUEUE_JSON.write_text(json.dumps(queue, indent=2, ensure_ascii=False), encoding='utf-8')

    print(json.dumps({'done': True, 'count': len(RECORDS), 'summary': summary}, ensure_ascii=False))


if __name__ == '__main__':
    main()
