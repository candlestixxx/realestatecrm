#!/usr/bin/env python3
"""Search all 21 leads in Lofty using the 'key' parameter."""
import os, json, urllib.request, urllib.parse, time

with open("/mnt/c/Users/jakeg/workspace/realestatecrm/.env.local") as f:
    for line in f:
        s = line.strip()
        if s.startswith("LOFTY") and "=" in s and not s.startswith("#"):
            KEY = s.split("=", 1)[1].strip().strip('"').strip("'")
            break

with open("/mnt/c/Users/jakeg/workspace/realestatecrm/data/sync-queue.json") as f:
    queue = json.load(f)

def search(name):
    url = f"https://api.lofty.com/v1.0/leads?key={urllib.parse.quote(name)}&limit=5"
    req = urllib.request.Request(url, headers={"Authorization": f"token {KEY}", "Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=10) as resp:
        body = json.loads(resp.read().decode())
        return body.get("leads", [])

def find_match(leads, first, last):
    fl = first.lower().strip()
    ll = last.lower().strip()
    for lead in leads:
        lf = (lead.get("firstName", "") or "").lower().strip()
        ll2 = (lead.get("lastName", "") or "").lower().strip()
        # Also match ALL CAPS
        if (lf == fl or lf == fl.upper()) and (ll2 == ll or ll2 == ll.upper()):
            return lead
    return None

found = 0
not_found = 0
results = []

for i, item in enumerate(queue["items"]):
    first = item["firstName"]
    last = item["lastName"]
    # Strip trailing address numbers from names like "Robert C. Hauss 16830"
    search_first = first
    search_last = last.split()[0] if " " in last else last
    # For "Robert C. Hauss 16830", search "Robert Hauss"
    if any(c.isdigit() for c in last):
        words = last.split()
        search_last = words[0]
    
    leads = search(f"{search_first} {search_last}")
    match = find_match(leads, first, last)
    
    if match:
        lid = match.get("leadId", "?")
        phones = match.get("phones", [])
        src = match.get("source", "?")
        tags = [t.get("tagName", "") for t in match.get("tags", [])]
        print(f"[{i+1}/21] {first} {last} -> FOUND ID:{lid} phones:{phones[:2]} tags:{tags}")
        found += 1
        results.append({"name": f"{first} {last}", "lofty_id": lid, "status": "FOUND", "phones": phones, "tags": tags, "source": src})
    else:
        partial = [(l.get("firstName",""), l.get("lastName","")) for l in leads[:2]]
        print(f"[{i+1}/21] {first} {last} -> NOT FOUND (partial: {partial})")
        not_found += 1
        results.append({"name": f"{first} {last}", "lofty_id": None, "status": "NOT_FOUND"})
    
    time.sleep(0.5)

print(f"\n=== {found} FOUND, {not_found} NOT FOUND ===")

with open("/mnt/c/Users/jakeg/workspace/realestatecrm/data/sync-results.json", "w") as f:
    json.dump(results, f, indent=2)
