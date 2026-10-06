#!/usr/bin/env python3
"""Add foreclosure notes to all 21 leads in Lofty."""
import os, json, urllib.request, time

PROJECT = "/mnt/c/Users/jakeg/workspace/realestatecrm"
with open(os.path.join(PROJECT, ".env.local")) as f:
    for line in f:
        s = line.strip()
        if s.startswith("LOFTY") and "=" in s and not s.startswith("#"):
            KEY = s.split("=", 1)[1].strip().strip('"').strip("'")
            break

# All 21 lead IDs from the sync
LEADS = [
    {"id": 1139657678595679, "name": "Danette Colbert", "agent": "Hank Mendez"},
    {"id": 1141210384213111, "name": "Leon Phongsavath", "agent": "Harry Kourlos"},
    {"id": 1147301718820389, "name": "Ronald J. Legendre", "agent": "Hank Mendez"},
    {"id": 1147301718982656, "name": "Ryan R. Amluxen", "agent": "Harry Kourlos"},
    {"id": 1147301719230883, "name": "Christian P. Klein", "agent": "Hank Mendez"},
    {"id": 1139543425026574, "name": "Yvette Webb", "agent": "Harry Kourlos"},
    {"id": 1147301719596233, "name": "Robert C. Hauss 16830", "agent": "Hank Mendez"},
    {"id": 1147301719780513, "name": "Robert C. Hauss 16840", "agent": "Harry Kourlos"},
    {"id": 1147301720010072, "name": "Nicholas J. Rancilio", "agent": "Hank Mendez"},
    {"id": 1147301720170489, "name": "Brian Kaseta", "agent": "Harry Kourlos"},
    {"id": 1144503601352159, "name": "Anthony Bruce", "agent": "Hank Mendez"},
    {"id": 1147301720363533, "name": "Subhan Group Inc", "agent": "Harry Kourlos"},
    {"id": 1147301720804789, "name": "Abdul Norwood", "agent": "Hank Mendez"},
    {"id": 1147301720957526, "name": "Patti Turner", "agent": "Harry Kourlos"},
    {"id": 1147301721187622, "name": "Cadarrell Thomas Mcallister", "agent": "Hank Mendez"},
    {"id": 1147301721361043, "name": "Shajbin Begum", "agent": "Harry Kourlos"},
    {"id": 1147301721570596, "name": "Anthony Scott", "agent": "Hank Mendez"},
    {"id": 1143107415836279, "name": "Brian Bayer", "agent": "Harry Kourlos"},
    {"id": 1147301722147919, "name": "Stephen J. Clouse", "agent": "Hank Mendez"},
    {"id": 1147301722338066, "name": "Megan A Konop", "agent": "Harry Kourlos"},
    {"id": 1147301722576580, "name": "Bradley S. Campbell", "agent": "Hank Mendez"},
]

def add_note(lead_id, content):
    url = "https://api.lofty.com/v1.0/notes"
    body = json.dumps({"leadId": lead_id, "content": content}).encode()
    req = urllib.request.Request(url, data=body, method="POST", headers={
        "Authorization": f"token {KEY}", "Content-Type": "application/json"
    })
    with urllib.request.urlopen(req, timeout=15) as resp:
        return json.loads(resp.read().decode())

success = 0
failed = 0

for i, lead in enumerate(LEADS):
    note = (
        f"DISPOSITION: Preforeclosure - Ready for outreach\n"
        f"SOURCE: Legal News - Macomb Foreclosures\n"
        f"ASSIGNED AGENT: {lead['agent']}\n"
        f"SYNC DATE: {time.strftime('%Y-%m-%d %H:%M')}\n\n"
        f"Lead imported from weekly Macomb County foreclosure notices. "
        f"Enriched and synced from RealEstateCRM sync queue."
    )
    try:
        add_note(lead["id"], note)
        print(f"[{i+1}/21] {lead['name']} -> Note added OK")
        success += 1
    except Exception as e:
        print(f"[{i+1}/21] {lead['name']} -> Note FAILED: {e}")
        failed += 1
    time.sleep(0.5)

print(f"\n=== {success} notes added, {failed} failed ===")
