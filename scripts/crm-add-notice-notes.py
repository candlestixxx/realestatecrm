#!/usr/bin/env python3
"""Add foreclosure notice notes to RealEstateCRM lead records in data/crm-records.json."""
import os, json, time

PROJECT = "/mnt/c/Users/jakeg/workspace/realestatecrm"
CRM_FILE = os.path.join(PROJECT, "data", "crm-records.json")

with open(CRM_FILE) as f:
    crm = json.load(f)

# Ensure records is a list
if isinstance(crm, dict) and "records" in crm:
    records = crm["records"]
else:
    records = crm if isinstance(crm, list) else []

# The 21 leads with their Lofty IDs
LEADS = [
    {"first": "Danette", "last": "Colbert", "agent": "Hank Mendez", "lofty_id": "1139657678595679"},
    {"first": "Leon", "last": "Phongsavath", "agent": "Harry Kourlos", "lofty_id": "1141210384213111"},
    {"first": "Ronald", "last": "Legendre", "agent": "Hank Mendez", "lofty_id": "1147301718820389"},
    {"first": "Ryan", "last": "Amluxen", "agent": "Harry Kourlos", "lofty_id": "1147301718982656"},
    {"first": "Christian", "last": "Klein", "agent": "Hank Mendez", "lofty_id": "1147301719230883"},
    {"first": "Yvette", "last": "Webb", "agent": "Harry Kourlos", "lofty_id": "1139543425026574"},
    {"first": "Robert", "last": "Hauss", "agent": "Hank Mendez", "lofty_id": "1147301719596233"},
    {"first": "Robert", "last": "Hauss", "agent": "Harry Kourlos", "lofty_id": "1147301719780513"},
    {"first": "Nicholas", "last": "Rancilio", "agent": "Hank Mendez", "lofty_id": "1147301720010072"},
    {"first": "Brian", "last": "Kaseta", "agent": "Harry Kourlos", "lofty_id": "1147301720170489"},
    {"first": "Anthony", "last": "Bruce", "agent": "Hank Mendez", "lofty_id": "1144503601352159"},
    {"first": "Subhan", "last": "Group Inc", "agent": "Harry Kourlos", "lofty_id": "1147301720363533"},
    {"first": "Abdul", "last": "Norwood", "agent": "Hank Mendez", "lofty_id": "1147301720804789"},
    {"first": "Patti", "last": "Turner", "agent": "Harry Kourlos", "lofty_id": "1147301720957526"},
    {"first": "Cadarrell", "last": "Mcallister", "agent": "Hank Mendez", "lofty_id": "1147301721187622"},
    {"first": "Shajbin", "last": "Begum", "agent": "Harry Kourlos", "lofty_id": "1147301721361043"},
    {"first": "Anthony", "last": "Scott", "agent": "Hank Mendez", "lofty_id": "1147301721570596"},
    {"first": "Brian", "last": "Bayer", "agent": "Harry Kourlos", "lofty_id": "1143107415836279"},
    {"first": "Stephen", "last": "Clouse", "agent": "Hank Mendez", "lofty_id": "1147301722147919"},
    {"first": "Megan", "last": "Konop", "agent": "Harry Kourlos", "lofty_id": "1147301722338066"},
    {"first": "Bradley", "last": "Campbell", "agent": "Hank Mendez", "lofty_id": "1147301722576580"},
]

added = 0
for lead in LEADS:
    name = f"{lead['first']} {lead['last']}"
    
    # Check if record exists
    existing = None
    for r in records:
        if (r.get("firstName", "").lower() == lead["first"].lower() and
            r.get("lastName", "").lower() == lead["last"].lower()):
            existing = r
            break
    
    note = {
        "type": "foreclosure_notice",
        "source": "Legal News — Macomb Foreclosures",
        "noticeType": "Foreclosure by Advertisement",
        "county": "Macomb",
        "state": "Michigan",
        "assignedAgent": lead["agent"],
        "loftyContactId": lead["lofty_id"],
        "tag": "#Preforeclosure",
        "disposition": "Preforeclosure — Ready for outreach",
        "content": (
            f"=== FORECLOSURE NOTICE === #Preforeclosure\n\n"
            f"NOTICE TYPE: Foreclosure by Advertisement\n"
            f"COUNTY: Macomb, Michigan\n"
            f"SOURCE: Legal News — Macomb Foreclosures\n"
            f"MORTGAGOR: {name}\n"
            f"ASSIGNED AGENT: {lead['agent']}\n"
            f"SYNC DATE: {time.strftime('%Y-%m-%d %H:%M')}\n\n"
            f"DISPOSITION: Preforeclosure — Ready for outreach\n"
            f"LEAD TYPE: Homeowner (Pre-foreclosure)\n\n"
            f"NOTE: This lead was sourced from Legal News Macomb County "
            f"Foreclosure by Advertisement notices. Full notice text available "
            f"at https://www.legalnews.com (subscription required). "
            f"Property details, sale date, and amount due should be verified "
            f"against Macomb County Register of Deeds records.\n\n"
            f"NEXT STEPS:\n"
            f"1. Verify property address via Macomb County records\n"
            f"2. Confirm sale date and amount due\n"
            f"3. Attempt contact via phone/email\n"
            f"4. Schedule property visit if appropriate\n"
            f"5. Follow Michigan LARA compliance for outreach"
        ),
        "createdAt": time.strftime("%Y-%m-%dT%H:%M:%SZ"),
    }
    
    if existing:
        # Add note to existing record
        if "notes" not in existing:
            existing["notes"] = []
        existing["notes"].append(note)
        # Ensure tags include #Preforeclosure
        if "tags" not in existing:
            existing["tags"] = []
        if "#Preforeclosure" not in existing["tags"]:
            existing["tags"].append("#Preforeclosure")
        print(f"  Updated: {name}")
    else:
        # Create new record
        new_record = {
            "id": f"ld_{lead['lofty_id']}",
            "firstName": lead["first"],
            "lastName": lead["last"],
            "source": "Legal News — Macomb Foreclosures",
            "status": "PREFORECLOSURE",
            "segment": "Preforeclosure",
            "assignedAgent": lead["agent"],
            "loftyContactId": lead["lofty_id"],
            "tags": ["#Preforeclosure", "PREFORECLOSURE", "Macomb Foreclosures"],
            "notes": [note],
            "createdAt": time.strftime("%Y-%m-%dT%H:%M:%SZ"),
        }
        records.append(new_record)
        print(f"  Created: {name}")
    
    added += 1

# Save
if isinstance(crm, dict) and "records" in crm:
    crm["records"] = records
else:
    crm = records

with open(CRM_FILE, "w") as f:
    json.dump(crm, f, indent=2)

print(f"\n=== {added} leads updated in RealEstateCRM ===")
print(f"Total records: {len(records)}")
