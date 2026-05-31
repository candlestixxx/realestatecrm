#!/usr/bin/env python3
"""Test the Lofty API key from .env.local with token prefix."""
import os, json, urllib.request, urllib.error

# Read key from .env.local
env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '.env.local')
api_key = None
with open(env_path) as f:
    for line in f:
        line = line.strip()
        if line.startswith('LOFTY_API_KEY=') and not line.startswith('#'):
            api_key = line.split('=', 1)[1].strip().strip('"').strip("'")
            break

if not api_key:
    print("ERROR: No LOFTY_API_KEY found in .env.local")
    exit(1)

print(f"Key length: {len(api_key)}")
print(f"Key prefix: {api_key[:20]}...")
print(f"Key suffix: ...{api_key[-10:]}")

# Test against Lofty API with 'token' prefix
url = "https://api.lofty.com/v1.0/leads?keyword=test"
req = urllib.request.Request(url, headers={
    "Authorization": f"token {api_key}",
    "Content-Type": "application/json"
})

try:
    with urllib.request.urlopen(req) as resp:
        body = json.loads(resp.read().decode())
        print(f"\n✅ Lofty API response:")
        print(f"  HTTP Status: {resp.status}")
        print(f"  Code: {body.get('code')}")
        print(f"  Message: {body.get('message')}")
        data = body.get('data', {})
        leads = data.get('leads', []) if isinstance(data, dict) else data if isinstance(data, list) else []
        print(f"  Leads found: {len(leads)}")
except urllib.error.HTTPError as e:
    body = json.loads(e.read().decode()) if e.readable() else {}
    print(f"\n❌ Lofty API error:")
    print(f"  HTTP Status: {e.code}")
    print(f"  Code: {body.get('code')}")
    print(f"  Message: {body.get('message')}")
except Exception as e:
    print(f"\n❌ Error: {e}")
