#!/usr/bin/env node
/**
 * Tag all Ben Franklin-SHELBY TWP leads in Lofty with CircleProspect + Shelby Twp
 * and add them to the BEN FRANKLIN-SHELBY TWP segment.
 */
import { readFileSync } from 'fs';
import { resolve } from 'path';

const envPath = resolve(process.cwd(), '.env.local');
const envText = readFileSync(envPath, 'utf8');
const loftyKey = envText.split('\n').find(l => l.startsWith('LOFTY_API_KEY=')).spl...n('=');

const API = 'https://lofty.com/api/v1.0';
const TAGS = ['CircleProspect', 'Shelby Twp'];
const SEGMENT_NAME = 'BEN FRANKLIN-SHELBY TWP';

function headers() {
  return { 'Authorization': 'token ' + loftyKey, 'Content-Type': 'application/json' };
}

async function apiGet(path) {
  const res = await fetch(API + path, { headers: headers() });
  const body = await res.json();
  return body;
}

async function apiPost(path, data) {
  const res = await fetch(API + path, { method: 'POST', headers: headers(), body: JSON.stringify(data) });
  const body = await res.json();
  return body;
}

async function main() {
  console.log('=== Ben Franklin-SHELBY TWP Lead Tagger ===\n');

  // Test connection
  console.log('Testing API connection...');
  let r = await apiGet('/leads?pageSize=1');
  console.log('Status:', JSON.stringify(r.status || r.message || 'OK').substring(0, 200));
  
  if (r.status?.code === 100002) {
    console.error('API key expired! Please get a fresh key from Lofty.');
    process.exit(1);
  }

  // Search for Shelby Township leads
  console.log('\nSearching Shelby Township...');
  r = await apiGet('/leads?key=Shelby+Township&pageSize=5');
  const shData = r.data;
  const shLeads = Array.isArray(shData) ? shData : shData?.leads || shData?.items || [];
  console.log('Shelby Township: ' + shLeads.length + ' leads');
  if (shLeads.length > 0) {
    console.log('Sample:', JSON.stringify(shLeads[0]).substring(0, 200));
  }

  // Search for Ben Franklin leads
  console.log('\nSearching Ben Franklin...');
  r = await apiGet('/leads?key=Ben+Franklin&pageSize=5');
  const bfData = r.data;
  const bfLeads = Array.isArray(bfData) ? bfData : bfData?.leads || bfData?.items || [];
  console.log('Ben Franklin: ' + bfLeads.length + ' leads');

  // Search for CircleProspect
  console.log('\nSearching CircleProspect...');
  r = await apiGet('/leads?key=CircleProspect&pageSize=5');
  const cpData = r.data;
  const cpLeads = Array.isArray(cpData) ? cpData : cpData?.leads || cpData?.items || [];
  console.log('CircleProspect: ' + cpLeads.length + ' leads');

  // Search for my +plus leads
  console.log('\nSearching "my +plus leads"...');
  r = await apiGet('/leads?key=my+%2Bplus+leads&pageSize=5');
  const mpData = r.data;
  const mpLeads = Array.isArray(mpData) ? mpData : mpData?.leads || mpData?.items || [];
  console.log('my +plus leads: ' + mpLeads.length + ' leads');
  if (mpLeads.length > 0) {
    console.log('Sample:', JSON.stringify(mpLeads[0]).substring(0, 300));
  }

  // List segments
  console.log('\nListing segments...');
  r = await apiGet('/segments');
  console.log('Segments:', JSON.stringify(r).substring(0, 500));
}

main().catch(e => { console.error(e); process.exit(1); });
