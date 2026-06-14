#!/usr/bin/env python3
import os, json, urllib.request, urllib.error, urllib.parse

key = None
with open("/mnt/c/Users/jakeg/workspace/realestatecrm/.env.local") as f:
    for line in f:
        s = line.strip()
        if s.startswith("LOFTY") and "=" in s and not s.startswith("#"):
            key = s.split("=", 1)[1].strip().strip('"').strip("'")
            break

print("Key length:", len(key))

url = "https://api.lofty.com/v1.0/leads?keyword=test"
req = urllib.request.Request(url, headers={
    "Authorization": "token " + key,
    "Content-Type": "application/json"
})

try:
    with urllib.request.urlopen(req, timeout=15) as resp:
        raw = resp.read().decode()
        print("HTTP", resp.status)
        print("Response:", raw[:800])
except urllib.error.HTTPError as e:
    raw = e.read().decode()
    print("HTTP ERROR", e.code)
    print("Response:", raw[:800])
except Exception as e:
    print("Exception:", e)
