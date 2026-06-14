#!/usr/bin/env python3
"""Update sync queue to mark all 21 leads as SYNCED."""
import os, json, time

PROJECT = "/mnt/c/Users/jakeg/workspace/realestatecrm"
QUEUE = os.path.join(PROJECT, "data", "sync-queue.json")

# Lead IDs from Lofty sync
LOFTY_IDS = {
    "Danette Colbert": 1139657678595679,
    "Leon Phongsavath": 1141210384213111,
    "Ronald J. Legendre": 1147301718820389,
    "Ryan R. Amluxen": 1147301718982656,
    "Christian P. Klein": 1147301719230883,
    "Yvette Webb": 1139543425026574,
    "Robert C. Hauss 16830": 1147301719596233,
    "Robert C. Hauss 16840": 1147301719780513,
    "Nicholas J. Rancilio": 1147301720010072,
    "Brian Kaseta": 1147301720170489,
    "Anthony Bruce": 1144503601352159,
    "Subhan Group Inc": 1147301720363533,
    "Abdul Norwood": 1147301720804789,
    "Patti Turner": 1147301720957526,
    "Cadarrell Thomas Mcallister": 1147301721187622,
    "Shajbin Begum": 1147301721361043,
    "Anthony Scott": 1147301721570596,
    "Brian Bayer": 1143107415836279,
    "Stephen J. Clouse": 1147301722147919,
    "Megan A Konop": 1147301722338066,
    "Bradley S. Campbell": 1147301722576580,
}

with open(QUEUE) as f:
    queue = json.load(f)

now = time.strftime("%Y-%m-%dT%H:%M:%SZ")
for item in queue["items"]:
    name = f"{item['firstName']} {item['lastName']}"
    if name in LOFTY_IDS:
        item["status"] = "SYNCED"
        item["loftyContactId"] = str(LOFTY_IDS[name])
        item["syncedAt"] = now

with open(QUEUE, "w") as f:
    json.dump(queue, f, indent=2)

synced = sum(1 for i in queue["items"] if i["status"] == "SYNCED")
print(f"Queue updated: {synced}/21 marked as SYNCED")
