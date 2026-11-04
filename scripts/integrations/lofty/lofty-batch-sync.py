#!/usr/bin/env python3
"""
Sync 21 preforeclosure leads into Lofty via direct API.
Reads key from .env.local, searches/creates leads, adds tags and notes.
"""
import os, json, urllib.request, urllib.error, urllib.parse, sys, time

PROJECT = "/mnt/c/Users/jakeg/workspace/realestatecrm"
ENV = os.path.join(PROJECT, ".env.local")
QUEUE = os.path.join(PROJECT, "data", "sync-queue.json")
RESULTS = os.path.join(PROJECT, "data", "sync-results.json")

def load_key():
    with open(ENV) as f:
        for line in f:
            s = line.strip()
            if s.startswith("LOFTY") and "=" in s and not s.startswith("#"):
                return s.split("=", 1)[1].strip().strip('"').strip("'")
    return None

def lofty_get(api_key, path):
    url = f"https://api.lofty.com/v1.0{path}"
    req = urllib.request.Request(url, headers={
        "Authorization": f"token {api_key}",
        "Content-Type": "application/json"
    })
    with urllib.request.urlopen(req, timeout=15) as resp:
        return json.loads(resp.read().decode())

def lofty_post(api_key, path, data):
    url = f"https://api.lofty.com/v1.0{path}"
    body = json.dumps(data).encode()
    req = urllib.request.Request(url, data=body, method="POST", headers={
        "Authorization": f"token {api_key}",
        "Content-Type": "application/json"
    })
    with urllib.request.urlopen(req, timeout=15) as resp:
        return json.loads(resp.read().decode())

def search_leads(api_key, name):
    """Search Lofty leads by name keyword."""
    encoded = urllib.parse.quote(name)
    result = lofty_get(api_key, f"/leads?keyword={encoded}")
    # Response: { "_metadata": {...}, "leads": [...] }
    return result.get("leads", [])

def find_exact_lead(leads, first, last):
    """Find exact name match in search results."""
    first_lower = first.lower().strip()
    last_lower = last.lower().strip()
    for lead in leads:
        lf = (lead.get("firstName", "") or "").lower().strip()
        ll = (lead.get("lastName", "") or "").lower().strip()
        if lf == first_lower and ll == last_lower:
            return lead
    return None

def add_lead_note(api_key, lead_id, note_text):
    """Add a note to a Lofty lead."""
    try:
        result = lofty_post(api_key, f"/leads/{lead_id}/notes", {"note": note_text})
        return True
    except Exception as e:
        print(f"    Note failed: {e}")
        return False

def add_lead_tags(api_key, lead_id, tags):
    """Add tags to a Lofty lead."""
    try:
        result = lofty_post(api_key, f"/leads/{lead_id}/tags", {"tags": tags})
        return True
    except Exception as e:
        print(f"    Tag failed: {e}")
        return False

def main():
    api_key = load_key()
    if not api_key:
        print("ERROR: No LOFTY_API_KEY")
        sys.exit(1)

    print(f"API key: {len(api_key)} chars")
    
    # Load queue
    with open(QUEUE) as f:
        queue = json.load(f)
    items = queue.get("items", [])
    print(f"Queue: {len(items)} leads\n")

    results = []
    
    for i, item in enumerate(items):
        first = item["firstName"]
        last = item["lastName"]
        name = f"{first} {last}"
        agent = item.get("assignedAgent", "")
        lead_id = item.get("leadId", "")
        
        print(f"[{i+1}/21] {name} (Agent: {agent})")
        
        # Search in Lofty
        search_results = search_leads(api_key, first)
        exact = find_exact_lead(search_results, first, last)
        
        if exact:
            lofty_id = exact.get("leadId", "unknown")
            phones = exact.get("phones", [])
            emails = exact.get("emails", [])
            print(f"  FOUND in Lofty — ID: {lofty_id}")
            print(f"  Phones: {phones[:3]}")
            print(f"  Emails: {emails[:2]}")
            
            # Add preforeclosure tags
            tag_result = add_lead_tags(api_key, lofty_id, ["PREFORECLOSURE"])
            print(f"  Tags: {'OK' if tag_result else 'FAIL'}")
            
            # Add notice note
            note = (
                f"DISPOSITION: Preforeclosure - Ready for outreach\n"
                f"SOURCE: Legal News - Macomb Foreclosures\n"
                f"ASSIGNED AGENT: {agent}\n"
                f"SYNC DATE: {time.strftime('%Y-%m-%d %H:%M')}\n"
                f"CRM QUEUE ID: {lead_id}\n\n"
                f"Note: Lead imported from weekly Macomb County foreclosure notices via Legal News. "
                f"Enriched and synced from RealEstateCRM sync queue."
            )
            note_result = add_lead_note(api_key, lofty_id, note)
            print(f"  Note: {'OK' if note_result else 'FAIL'}")
            
            results.append({
                "name": name, "agent": agent,
                "lofty_id": lofty_id, "status": "SYNCED",
                "phones": phones[:3], "emails": emails[:2]
            })
        else:
            print(f"  NOT FOUND in Lofty ({len(search_results)} partial matches)")
            # Show partial matches
            for p in search_results[:2]:
                pf = p.get("firstName", "?")
                pl = p.get("lastName", "?")
                print(f"    Partial: {pf} {pl}")
            
            results.append({
                "name": name, "agent": agent,
                "lofty_id": None, "status": "NOT_FOUND",
                "partial_matches": len(search_results)
            })
        
        # Rate limit: 1 request per second
        time.sleep(1)
    
    # Save results
    with open(RESULTS, "w") as f:
        json.dump({"results": results, "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ")}, f, indent=2)
    
    # Summary
    synced = sum(1 for r in results if r["status"] == "SYNCED")
    not_found = sum(1 for r in results if r["status"] == "NOT_FOUND")
    print(f"\n=== SUMMARY ===")
    print(f"Synced: {synced}/21")
    print(f"Not found: {not_found}/21")
    print(f"Results saved to: {RESULTS}")

if __name__ == "__main__":
    main()
