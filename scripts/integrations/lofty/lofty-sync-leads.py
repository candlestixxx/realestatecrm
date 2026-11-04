#!/usr/bin/env python3
"""
Lofty API sync script — reads key from .env.local, tests connection,
and searches for leads to verify they exist in Lofty.
"""
import os, json, urllib.request, urllib.error, sys

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ENV_PATH = os.path.join(PROJECT_ROOT, '.env.local')
QUEUE_PATH = os.path.join(PROJECT_ROOT, 'data', 'sync-queue.json')

def load_api_key():
    with open(ENV_PATH) as f:
        for line in f:
            line = line.strip()
            if line.startswith('LOFTY_API_KEY=') and not line.startswith('#'):
                return line.split('=', 1)[1].strip().strip('"').strip("'")
    return None

def lofty_search(api_key, query):
    url = f"https://api.lofty.com/v1.0/leads?keyword={urllib.parse.quote(query)}"
    req = urllib.request.Request(url, headers={
        "Authorization": f"token {api_key}",
        "Content-Type": "application/json"
    })
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            body = json.loads(resp.read().decode())
            if body.get('code') != 0:
                return {"error": body.get('message', f"code {body.get('code')}"), "leads": []}
            data = body.get('data', {})
            leads = data.get('leads', []) if isinstance(data, dict) else data if isinstance(data, list) else []
            return {"error": None, "leads": leads}
    except urllib.error.HTTPError as e:
        try:
            body = json.loads(e.read().decode())
            return {"error": f"HTTP {e.code}: {body.get('message', 'unknown')}", "leads": []}
        except:
            return {"error": f"HTTP {e.code}", "leads": []}
    except Exception as e:
        return {"error": str(e), "leads": []}

def main():
    import urllib.parse

    # Load API key
    api_key = load_api_key()
    if not api_key:
        print("ERROR: No LOFTY_API_KEY in .env.local")
        sys.exit(1)

    print(f"API key loaded: {len(api_key)} chars")
    print(f"Key starts with: {api_key[:15]}...")
    print(f"Key ends with: ...{api_key[-8:]}")

    # Test connection
    print("\n--- Testing Lofty API connection ---")
    result = lofty_search(api_key, "test")
    if result["error"]:
        print(f"❌ API ERROR: {result['error']}")
        if "200058" in str(result["error"]):
            print("   → Auth prefix issue or invalid key")
        elif "20004" in str(result["error"]):
            print("   → Key is invalid or expired")
        sys.exit(1)
    else:
        print(f"✅ Lofty API connected. Found {len(result['leads'])} results for 'test'.")

    # Load sync queue
    print("\n--- Loading sync queue ---")
    with open(QUEUE_PATH) as f:
        queue = json.load(f)
    items = queue.get('items', [])
    print(f"Total queued: {len(items)}")

    # Search each lead in Lofty
    print("\n--- Searching each lead in Lofty ---")
    for i, item in enumerate(items):
        name = f"{item['firstName']} {item['lastName']}"
        print(f"\n[{i+1}/21] Searching: {name}")

        # Search by first name
        search_result = lofty_search(api_key, item['firstName'])
        if search_result["error"]:
            print(f"  ❌ Search failed: {search_result['error']}")
            continue

        leads = search_result["leads"]
        # Try to find exact match
        exact = None
        for lead in leads:
            lead_first = lead.get('firstName', lead.get('first_name', '')).lower()
            lead_last = lead.get('lastName', lead.get('last_name', '')).lower()
            if (lead_first == item['firstName'].lower() and
                lead_last == item['lastName'].lower().replace(item['lastName'].split()[-1], item['lastName'].split()[-1])):
                exact = lead
                break

        if exact:
            lead_id = exact.get('id', exact.get('leadId', 'unknown'))
            phone = exact.get('phone', exact.get('primaryPhone', 'N/A'))
            email = exact.get('email', exact.get('primaryEmail', 'N/A'))
            print(f"  ✅ FOUND in Lofty — ID: {lead_id}, Phone: {phone}, Email: {email}")
        else:
            print(f"  ⚠️  Not found as exact match ({len(leads)} partial results)")
            if leads:
                for partial in leads[:2]:
                    pf = partial.get('firstName', partial.get('first_name', '?'))
                    pl = partial.get('lastName', partial.get('last_name', '?'))
                    print(f"     Partial: {pf} {pl}")

    print("\n--- Done ---")

if __name__ == '__main__':
    main()
