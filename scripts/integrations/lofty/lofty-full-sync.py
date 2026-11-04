#!/usr/bin/env python3
"""
Sync all 21 leads to Lofty:
- Update 5 existing with PREFORECLOSURE tags + notes
- Create 16 missing leads via POST /v1.0/leads
"""
import os, json, urllib.request, urllib.parse, time, sys

PROJECT = "/mnt/c/Users/jakeg/workspace/realestatecrm"
with open(os.path.join(PROJECT, ".env.local")) as f:
    for line in f:
        s = line.strip()
        if s.startswith("LOFTY") and "=" in s and not s.startswith("#"):
            KEY = s.split("=", 1)[1].strip().strip('"').strip("'")
            break

with open(os.path.join(PROJECT, "data/sync-queue.json")) as f:
    queue = json.load(f)

def api_get(path):
    url = f"https://api.lofty.com/v1.0{path}"
    req = urllib.request.Request(url, headers={"Authorization": f"token {KEY}", "Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=15) as resp:
        return json.loads(resp.read().decode())

def api_post(path, data):
    url = f"https://api.lofty.com/v1.0{path}"
    body = json.dumps(data).encode()
    req = urllib.request.Request(url, data=body, method="POST", headers={
        "Authorization": f"token {KEY}", "Content-Type": "application/json"
    })
    with urllib.request.urlopen(req, timeout=15) as resp:
        return json.loads(resp.read().decode())

def api_put(path, data):
    url = f"https://api.lofty.com/v1.0{path}"
    body = json.dumps(data).encode()
    req = urllib.request.Request(url, data=body, method="PUT", headers={
        "Authorization": f"token {KEY}", "Content-Type": "application/json"
    })
    with urllib.request.urlopen(req, timeout=15) as resp:
        return json.loads(resp.read().decode())

def search_lead(first, last):
    search_term = f"{first} {last.split()[0]}" if any(c.isdigit() for c in last) else f"{first} {last}"
    url = f"https://api.lofty.com/v1.0/leads?key={urllib.parse.quote(search_term)}&limit=5"
    req = urllib.request.Request(url, headers={"Authorization": f"token {KEY}", "Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=10) as resp:
        body = json.loads(resp.read().decode())
        for lead in body.get("leads", []):
            lf = (lead.get("firstName", "") or "").lower()
            ll = (lead.get("lastName", "") or "").lower()
            if lf == first.lower() and ll == last.lower():
                return lead
    return None

def make_note(item):
    return (
        f"DISPOSITION: Preforeclosure - Ready for outreach\n"
        f"SOURCE: Legal News - Macomb Foreclosures\n"
        f"ASSIGNED AGENT: {item.get('assignedAgent', 'Unassigned')}\n"
        f"SYNC DATE: {time.strftime('%Y-%m-%d %H:%M')}\n\n"
        f"Lead imported from weekly Macomb County foreclosure notices via Legal News. "
        f"Enriched and synced from RealEstateCRM sync queue."
    )

created = 0
updated = 0
failed = 0

for i, item in enumerate(queue["items"]):
    first = item["firstName"]
    last = item["lastName"]
    name = f"{first} {last}"
    agent = item.get("assignedAgent", "")
    
    print(f"[{i+1}/21] {name}")
    
    existing = search_lead(first, last)
    
    if existing:
        # Lead exists - add tags and note
        lid = existing["leadId"]
        existing_tags = [t.get("tagName", "") for t in existing.get("tags", [])]
        
        # Add PREFORECLOSURE tag if missing
        if "PREFORECLOSURE" not in existing_tags and "Preforeclosure" not in existing_tags:
            try:
                api_put(f"/leads/{lid}", {"tags": existing.get("tags", []) + [{"tagName": "PREFORECLOSURE"}]})
                print(f"  + Tag PREFORECLOSURE added")
            except Exception as e:
                print(f"  ! Tag failed: {e}")
        
        # Add note
        try:
            api_post(f"/leads/{lid}/activity", {"content": make_note(item), "type": "note"})
            print(f"  + Note added")
        except Exception as e:
            # Try alternative note endpoint
            try:
                api_post(f"/leads/{lid}/notes", {"note": make_note(item)})
                print(f"  + Note added (alt endpoint)")
            except Exception as e2:
                print(f"  ! Note failed: {e2}")
        
        updated += 1
        print(f"  = UPDATED (ID: {lid})")
    else:
        # Create new lead
        new_lead = {
            "firstName": first,
            "lastName": last,
            "source": "Legal News - Macomb Foreclosures",
            "leadTypes": [8],  # Homeowner
        }
        try:
            result = api_post("/leads", new_lead)
            new_id = result.get("leadId")
            print(f"  + CREATED (ID: {new_id})")
            
            # Add tags
            if new_id:
                try:
                    api_put(f"/leads/{new_id}", {"tags": [{"tagName": "PREFORECLOSURE"}, {"tagName": "Macomb Foreclosures"}, {"tagName": "Legal News"}]})
                    print(f"  + Tags added")
                except:
                    pass
                
                # Add note
                try:
                    api_post(f"/leads/{new_id}/activity", {"content": make_note(item), "type": "note"})
                    print(f"  + Note added")
                except:
                    pass
            
            created += 1
        except Exception as e:
            print(f"  ! CREATE FAILED: {e}")
            failed += 1
    
    time.sleep(1)

print(f"\n=== SUMMARY ===")
print(f"Updated (already existed): {updated}")
print(f"Created (new): {created}")
print(f"Failed: {failed}")
print(f"Total processed: {updated + created + failed}/21")
