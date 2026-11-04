#!/usr/bin/env python3
"""Assign 21 leads round-robin to Hank/Harry + add to Preforeclosure segment in Lofty."""
import os, json, urllib.request, time

PROJECT = "/mnt/c/Users/jakeg/workspace/realestatecrm"
with open(os.path.join(PROJECT, ".env.local")) as f:
    for line in f:
        s = line.strip()
        if s.startswith("LOFTY") and "=" in s and not s.startswith("#"):
            KEY = s.split("=", 1)[1].strip().strip('"').strip("'")
            break

HANK_ID = 844766863199376
HARRY_ID = 844766901547858

# All 21 lead Lofty IDs in order
LEADS = [
    (1139657678595679, "Danette Colbert"),
    (1141210384213111, "Leon Phongsavath"),
    (1147301718820389, "Ronald Legendre"),
    (1147301718982656, "Ryan Amluxen"),
    (1147301719230883, "Christian Klein"),
    (1139543425026574, "Yvette Webb"),
    (1147301719596233, "Robert Hauss 16830"),
    (1147301719780513, "Robert Hauss 16840"),
    (1147301720010072, "Nicholas Rancilio"),
    (1147301720170489, "Brian Kaseta"),
    (1144503601352159, "Anthony Bruce"),
    (1147301720363533, "Subhan Group Inc"),
    (1147301720804789, "Abdul Norwood"),
    (1147301720957526, "Patti Turner"),
    (1147301721187622, "Cadarrell Mcallister"),
    (1147301721361043, "Shajbin Begum"),
    (1147301721570596, "Anthony Scott"),
    (1143107415836279, "Brian Bayer"),
    (1147301722147919, "Stephen Clouse"),
    (1147301722338066, "Megan Konop"),
    (1147301722576580, "Bradley Campbell"),
]

def lofty_put(path, data):
    url = f"https://api.lofty.com/v1.0{path}"
    body = json.dumps(data).encode()
    req = urllib.request.Request(url, data=body, method="PUT", headers={
        "Authorization": f"token {KEY}", "Content-Type": "application/json"
    })
    with urllib.request.urlopen(req, timeout=15) as resp:
        return json.loads(resp.read().decode())

def lofty_post(path, data):
    url = f"https://api.lofty.com/v1.0{path}"
    body = json.dumps(data).encode()
    req = urllib.request.Request(url, data=body, method="POST", headers={
        "Authorization": f"token {KEY}", "Content-Type": "application/json"
    })
    with urllib.request.urlopen(req, timeout=15) as resp:
        return json.loads(resp.read().decode())

# Step 1: Get current lead data to preserve existing tags
def get_lead(lid):
    url = f"https://api.lofty.com/v1.0/leads/{lid}"
    req = urllib.request.Request(url, headers={"Authorization": f"token {KEY}", "Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=10) as resp:
        return json.loads(resp.read().decode()).get("lead", {})

# Step 2: Assign round-robin and add segment
assigned_hank = 0
assigned_harry = 0

for i, (lid, name) in enumerate(LEADS):
    # Odd leads (0, 2, 4...) -> Hank, Even leads (1, 3, 5...) -> Harry
    agent_id = HANK_ID if i % 2 == 0 else HARRY_ID
    agent_name = "Hank Mendez" if i % 2 == 0 else "Harry Kourlos"
    
    print(f"[{i+1}/21] {name} -> {agent_name}")
    
    try:
        # Get current lead to preserve tags
        current = get_lead(lid)
        existing_tags = current.get("tags", [])
        tag_names = [t.get("tagName", "") for t in existing_tags]
        
        # Ensure #Preforeclosure tag is present
        if "#Preforeclosure" not in tag_names:
            tag_names.append("#Preforeclosure")
        
        # Build tag objects
        tag_objects = [{"tagName": t} for t in tag_names if t]
        
        # Assign + add segment + tags
        update_data = {
            "assignedUserId": agent_id,
            "segments": ["Preforeclosure"],
            "tags": tag_names,  # Send as string array
        }
        
        result = lofty_put(f"/leads/{lid}", update_data)
        
        if agent_id == HANK_ID:
            assigned_hank += 1
        else:
            assigned_harry += 1
        
        print(f"  = Assigned to {agent_name}, segment=Preforeclosure, tags={tag_names}")
        
    except Exception as e:
        print(f"  ! Error: {e}")
    
    time.sleep(0.5)

print(f"\n=== Lofty Assignment Complete ===")
print(f"Hank Mendez: {assigned_hank} leads")
print(f"Harry Kourlos: {assigned_harry} leads")
