#!/usr/bin/env python3
"""Import Macomb County Legal News foreclosure notices into the local CRM.

This script pulls the Legal News Macomb Foreclosures bucket, normalizes each
notice into Contact + Lead + Activity + Task records, and assigns leads evenly
between Hank Mendez and Harry Kourlos (odd-numbered notices go to Hank).

It is intentionally idempotent per source notice id: if an Activity already
exists with the same `legalNewsNoticeId`, the notice is skipped.
"""
from __future__ import annotations

import json
import os
import re
import secrets
import sqlite3
import sys
import urllib.request
from dataclasses import dataclass
from datetime import date, datetime, timedelta, timezone
from pathlib import Path
from typing import Any, Dict, Iterable, Optional, Tuple
from zoneinfo import ZoneInfo

BASE_DIR = Path(__file__).resolve().parents[1]
DB_PATH = BASE_DIR / "prisma" / "dev.db"
SOURCE_URL = "https://www.legalnews.com/County/GetNotices?location=2"
SOURCE_PAGE_URL = "https://www.legalnews.com/County/Notices?location=macomb"
WORKSPACE_NAME = "Excel Legacy Realty Team"
WORKSPACE_FALLBACK_ID = "cmoxntabb00007mexzvlwgai1"
SOURCE_LABEL = "Legal News — Macomb Foreclosures"
SOURCE_TAG = "source:legalnews"
COUNTY_TAG = "county:macomb"
ASSIGNMENTS = ["Hank Mendez", "Harry Kourlos"]
AGENT_EMAILS = {
    "Hank Mendez": "hank.mendez@excellegacy.local",
    "Harry Kourlos": "harry.kourlos@excellegacy.local",
}
AGENT_ROLE = "REALTOR_AGENT"
TZ = ZoneInfo("America/New_York")


@dataclass
class Agent:
    id: str
    name: str
    email: str



def new_id(prefix: str) -> str:
    return f"{prefix}_{secrets.token_hex(12)}"



def now_ms() -> int:
    return int(datetime.now(timezone.utc).timestamp() * 1000)



def parse_json_response(url: str) -> Dict[str, Any]:
    with urllib.request.urlopen(url, timeout=30) as response:
        raw = response.read().decode("utf-8", errors="replace")
    return json.loads(raw)



def smart_title(name: str) -> str:
    stripped = name.strip()
    if not stripped:
        return stripped
    # Preserve names that already look properly cased; otherwise title-case all-caps input.
    if stripped.upper() == stripped:
        return re.sub(r"\s+", " ", stripped.title())
    return re.sub(r"\s+", " ", stripped)



def split_name(full_name: str) -> Tuple[str, Optional[str]]:
    normalized = smart_title(full_name)
    if "," in normalized:
        first, last = [part.strip() for part in normalized.split(",", 1)]
        return first, last or None
    parts = normalized.split()
    if len(parts) <= 1:
        return normalized, None
    if len(parts) == 2:
        return parts[0], parts[1]
    return " ".join(parts[:-1]), parts[-1]



def extract_amount_due_text(description: str) -> Optional[str]:
    patterns = [
        r"Amount claimed to be due at the date hereof:\s*([^.\n]+(?:\([^\)]*\))?)",
        r"amount due.*?\$[0-9,]+(?:\.[0-9]{2})?",
        r"on which Mortgage there is claimed to be due at the date hereof the sum of\s*\$[0-9,]+(?:\.[0-9]{2})?",
        r"on the date of notice:\s*\$[0-9,]+(?:\.[0-9]{2})?",
    ]
    for pattern in patterns:
        m = re.search(pattern, description, flags=re.IGNORECASE | re.DOTALL)
        if m:
            return re.sub(r"\s+", " ", m.group(1) if m.groups() else m.group(0)).strip()
    return None



def extract_attorney_phone(description: str) -> Optional[str]:
    patterns = [
        r"(\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4})",
        r"Telephone:\s*([0-9\-()\s]+)",
        r"ph:\s*([0-9\-()\s]+)",
    ]
    for pattern in patterns:
        m = re.search(pattern, description, flags=re.IGNORECASE)
        if m:
            return re.sub(r"\s+", " ", m.group(1)).strip()
    return None



def extract_description_tail(description: str) -> str:
    # Keep the full public-record text verbatim in the activity.
    return description.strip()



def next_business_day_10am(published_date: Optional[str]) -> int:
    if published_date:
        try:
            base = datetime.fromisoformat(published_date.replace("Z", "+00:00")).date()
        except ValueError:
            base = datetime.strptime(published_date.split("T", 1)[0], "%Y-%m-%d").date()
    else:
        base = datetime.now(TZ).date()
    candidate = base + timedelta(days=1)
    while candidate.weekday() >= 5:
        candidate += timedelta(days=1)
    dt = datetime(candidate.year, candidate.month, candidate.day, 10, 0, 0, tzinfo=TZ)
    return int(dt.astimezone(timezone.utc).timestamp() * 1000)



def ensure_agent(conn: sqlite3.Connection, name: str, email: str, workspace_id: str) -> Agent:
    cur = conn.cursor()
    row = cur.execute("SELECT id, name, email FROM User WHERE email = ?", (email,)).fetchone()
    if row:
        agent_id = row[0]
    else:
        agent_id = new_id("usr")
        cur.execute(
            "INSERT INTO User (id, name, email, role, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)",
            (agent_id, name, email, AGENT_ROLE, now_ms(), now_ms()),
        )

    member = cur.execute(
        "SELECT id FROM WorkspaceMember WHERE userId = ? AND workspaceId = ?",
        (agent_id, workspace_id),
    ).fetchone()
    if not member:
        cur.execute(
            "INSERT INTO WorkspaceMember (id, userId, workspaceId, role) VALUES (?, ?, ?, ?)",
            (new_id("wsm"), agent_id, workspace_id, AGENT_ROLE),
        )

    return Agent(id=agent_id, name=name, email=email)



def find_workspace_id(conn: sqlite3.Connection) -> str:
    cur = conn.cursor()
    row = cur.execute("SELECT id FROM Workspace WHERE name = ? ORDER BY createdAt ASC LIMIT 1", (WORKSPACE_NAME,)).fetchone()
    if row:
        return row[0]
    row = cur.execute("SELECT id FROM Workspace ORDER BY createdAt ASC LIMIT 1").fetchone()
    if row:
        return row[0]
    return WORKSPACE_FALLBACK_ID



def activity_exists(conn: sqlite3.Connection, notice_id: int) -> bool:
    cur = conn.cursor()
    pattern = f'%"legalNewsNoticeId":{notice_id}%'
    row = cur.execute(
        "SELECT id FROM Activity WHERE metadata LIKE ? LIMIT 1",
        (pattern,),
    ).fetchone()
    return row is not None



def create_contact(conn: sqlite3.Connection, workspace_id: str, user_id: Optional[str], notice: Dict[str, Any]) -> str:
    first_name, last_name = split_name(notice.get("public_notice_Name", "Unknown Lead"))
    contact_id = new_id("ct")
    cur = conn.cursor()
    cur.execute(
        """
        INSERT INTO Contact (id, firstName, lastName, email, phone, workspaceId, userId, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            contact_id,
            first_name,
            last_name,
            None,
            None,
            workspace_id,
            user_id,
            now_ms(),
            now_ms(),
        ),
    )
    return contact_id



def create_lead(conn: sqlite3.Connection, workspace_id: str, contact_id: str, user_id: Optional[str], notice: Dict[str, Any]) -> str:
    lead_id = new_id("ld")
    cur = conn.cursor()
    cur.execute(
        """
        INSERT INTO Lead (id, source, status, score, workspaceId, contactId, userId, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            lead_id,
            SOURCE_LABEL,
            "PREFORECLOSURE",
            0,
            workspace_id,
            contact_id,
            user_id,
            now_ms(),
            now_ms(),
        ),
    )
    return lead_id



def create_activity(
    conn: sqlite3.Connection,
    workspace_id: str,
    lead_id: str,
    user_id: Optional[str],
    notice: Dict[str, Any],
    assigned_agent: str,
) -> str:
    activity_id = new_id("act")
    metadata = {
        "source": SOURCE_LABEL,
        "sourceUrl": SOURCE_PAGE_URL,
        "legalNewsNoticeId": notice.get("public_notice_Id"),
        "county": notice.get("public_notice_County"),
        "noticeType": notice.get("public_notice_Type"),
        "publicNoticeName": notice.get("public_notice_Name"),
        "address": notice.get("public_notice_Address"),
        "city": notice.get("public_notice_City"),
        "zip": notice.get("public_notice_Zip_code"),
        "publishedDate": notice.get("public_notice_First_date_published"),
        "saleDate": notice.get("public_notice_Published_sale_date"),
        "fileNumber": notice.get("public_notice_File_number"),
        "internalId": notice.get("public_notice_Internal_id"),
        "attorney": notice.get("public_notice_Attorney"),
        "assignedAgent": assigned_agent,
        "confidence": "high",
        "sourceTags": ["#PreForeclosure", COUNTY_TAG, SOURCE_TAG],
    }
    cur = conn.cursor()
    cur.execute(
        """
        INSERT INTO Activity (id, type, content, metadata, workspaceId, userId, leadId, dealId, contactId, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            activity_id,
            "NOTE",
            extract_description_tail(notice.get("public_notice_Description", "")),
            json.dumps(metadata, separators=(",", ":")),
            workspace_id,
            user_id,
            lead_id,
            None,
            None,
            now_ms(),
            now_ms(),
        ),
    )
    return activity_id



def create_task(
    conn: sqlite3.Connection,
    workspace_id: str,
    assigned_to_id: Optional[str],
    notice: Dict[str, Any],
    assigned_agent: str,
) -> str:
    task_id = new_id("tsk")
    address = notice.get("public_notice_Address") or "the property"
    city = notice.get("public_notice_City") or ""
    zip_code = notice.get("public_notice_Zip_code") or ""
    sale_date = notice.get("public_notice_Published_sale_date") or "TBD"
    amount_due = extract_amount_due_text(notice.get("public_notice_Description", "")) or "See notice body"
    due_ms = next_business_day_10am(notice.get("public_notice_First_date_published"))
    description = (
        f"Address: {address}, {city} {zip_code}\n"
        f"Sale date: {sale_date}\n"
        f"Amount due: {amount_due}\n"
        f"Source: {SOURCE_PAGE_URL}\n"
        f"Assigned agent: {assigned_agent}"
    )
    cur = conn.cursor()
    cur.execute(
        """
        INSERT INTO Task (id, title, description, status, workspaceId, dueDate, assignedToId, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            task_id,
            "Review foreclosure notice and call lead",
            description,
            "TODO",
            workspace_id,
            due_ms,
            assigned_to_id,
            now_ms(),
            now_ms(),
        ),
    )
    return task_id



def import_foreclosures() -> int:
    payload = parse_json_response(SOURCE_URL)
    notices = payload.get("Foreclosures", [])
    if not notices:
        print("No foreclosure notices found.")
        return 0

    conn = sqlite3.connect(DB_PATH)
    conn.execute("PRAGMA foreign_keys = ON")
    workspace_id = find_workspace_id(conn)
    hank = ensure_agent(conn, "Hank Mendez", AGENT_EMAILS["Hank Mendez"], workspace_id)
    harry = ensure_agent(conn, "Harry Kourlos", AGENT_EMAILS["Harry Kourlos"], workspace_id)
    conn.commit()

    created = 0
    skipped = 0
    assigned_counts = {hank.id: 0, harry.id: 0}

    for idx, notice in enumerate(notices, start=1):
        notice_id = int(notice.get("public_notice_Id"))
        if activity_exists(conn, notice_id):
            skipped += 1
            continue

        assignee = hank if idx % 2 == 1 else harry
        assigned_counts[assignee.id] += 1
        contact_id = create_contact(conn, workspace_id, assignee.id, notice)
        lead_id = create_lead(conn, workspace_id, contact_id, assignee.id, notice)
        create_activity(conn, workspace_id, lead_id, assignee.id, notice, assignee.name)
        create_task(conn, workspace_id, assignee.id, notice, assignee.name)
        created += 1

    conn.commit()
    conn.close()

    print(json.dumps({
        "sourceCount": len(notices),
        "created": created,
        "skipped": skipped,
        "workspaceId": workspace_id,
        "assignmentCounts": {
            "Hank Mendez": assigned_counts[hank.id],
            "Harry Kourlos": assigned_counts[harry.id],
        },
    }, indent=2))
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(import_foreclosures())
    except Exception as exc:  # pragma: no cover - script execution path
        print(f"ERROR: {exc}", file=sys.stderr)
        raise
