#!/usr/bin/env node
const LOFTY_KEY = "eyJhbGciOiJIUzI1NiJ9.eyJleHQiOjMzMTg2OTY3NzQ0NDgsInVzZXJfaWQiOjg0NDc2NzIyNDE2MjA3Nywic2NvcGUiOiI1IiwiaWF0IjoxNzQxODk2Nzc0NDQ4fQ.iUf1QwkNM1hBEYpG98eBa3TwOLJUrw5wW-CbWFlB24k";
const API = "https://lofty.com/api/v1.0";
const TAGS = ["CircleProspect", "Shelby Twp"];
const SEGMENT_NAME = "BEN FRANKLIN-SHELBY TWP";

function headers() {
  return { "Authorization": "token " + LOFTY_KEY, "Content-Type": "application/json" };
}

async function apiGet(path) {
  const res = await fetch(API + path, { headers: headers() });
  return await res.json();
}

async function apiPost(path, data) {
  const res = await fetch(API + path, { method: "POST", headers: headers(), body: JSON.stringify(data) });
  return await res.json();
}

async function searchAll(keyword) {
  const all = [];
  let page = 1;
  while (true) {
    const r = await apiGet("/leads?key=" + encodeURIComponent(keyword) + "&pageSize=100&page=" + page);
    const data = r.data;
    const leads = Array.isArray(data) ? data : data?.leads || data?.items || [];
    if (leads.length === 0) break;
    all.push(...leads);
    if (leads.length < 100) break;
    page++;
  }
  return all;
}

async function main() {
  console.log("=== Ben Franklin-SHELBY TWP Lead Tagger ===");

  // Test connection
  let r = await apiGet("/leads?pageSize=1");
  if (r.status?.code === 100002) {
    console.error("API key expired!");
    process.exit(1);
  }
  console.log("API connected OK. Status:", JSON.stringify(r.status).substring(0, 100));

  // Search for all relevant leads
  const seen = new Set();
  const allLeads = [];

  for (const kw of ["Shelby Township", "Ben Franklin", "my +plus leads"]) {
    const leads = await searchAll(kw);
    console.log(kw + ": " + leads.length + " leads");
    for (const lead of leads) {
      const id = lead.id || lead.leadId;
      if (id && !seen.has(id)) {
        seen.add(id);
        allLeads.push(lead);
      }
    }
  }

  console.log("Total unique leads: " + allLeads.length);
  if (allLeads.length === 0) {
    console.log("No leads found. Checking raw response...");
    r = await apiGet("/leads?pageSize=3");
    console.log("Raw:", JSON.stringify(r).substring(0, 500));
    process.exit(0);
  }

  // Add tags
  let tagged = 0;
  let already = 0;
  for (const lead of allLeads) {
    const id = lead.id || lead.leadId;
    const existing = lead.tags || lead.tagList || [];
    if (TAGS.every(t => existing.includes(t))) {
      already++;
      continue;
    }
    const r = await apiPost("/leads/" + id + "/tags", { tags: TAGS });
    if (!r.status?.code || r.status?.code === 0) {
      tagged++;
    } else {
      console.error("Tag fail " + id + ": " + r.status?.msg);
    }
    if (tagged % 20 === 0 && tagged > 0) console.log("  Tagged " + tagged + "...");
  }
  console.log("Tagged: " + tagged + ", Already: " + already);

  // Segment
  let segmentId = null;
  try {
    const sr = await apiGet("/segments");
    const segs = sr.data?.segments || sr.data || [];
    if (Array.isArray(segs)) {
      const found = segs.find(s => s.name === SEGMENT_NAME);
      if (found) segmentId = found.id;
    }
  } catch (e) {}

  if (!segmentId) {
    try {
      const sr = await apiPost("/segments", { name: SEGMENT_NAME });
      segmentId = sr.data?.segmentId || sr.data?.id;
    } catch (e) {
      console.error("Create segment failed: " + e.message);
    }
  }
  console.log("Segment ID: " + segmentId);

  if (segmentId) {
    const ids = allLeads.map(l => l.id || l.leadId);
    for (let i = 0; i < ids.length; i += 50) {
      const batch = ids.slice(i, i + 50);
      try {
        await apiPost("/segments/" + segmentId + "/leads", { leadIds: batch });
        console.log("Added batch " + (Math.floor(i/50)+1));
      } catch (e) {
        console.error("Batch fail: " + e.message);
      }
    }
    console.log("Added " + ids.length + " leads to segment");
  }

  console.log("Done!");
}

main().catch(e => { console.error(e); process.exit(1); });
