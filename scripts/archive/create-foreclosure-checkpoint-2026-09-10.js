const fs = require('fs');
const path = require('path');
const root = '/mnt/c/Users/jakeg/workspace/realestatecrm';
const crm = JSON.parse(fs.readFileSync(path.join(root, 'data/crm-records.json'))).records;
const queue = JSON.parse(fs.readFileSync(path.join(root, 'data/sync-queue.json'))).items;
const windows = [
  {key:'2026-08-15_21', label:'Aug 15-21, 2026', source:path.join(root,'data/intake-artifacts/macomb-foreclosures-2026-08-15-21-source.json'), expectedProcessed:39},
  {key:'2026-08-22_28', label:'Aug 22-28, 2026', source:path.join(root,'data/intake-artifacts/macomb-foreclosures-2026-08-22-28-source.json'), expectedProcessed:12},
  {key:'2026-08-29_09-04', label:'Aug 29-Sep 4, 2026', source:'/home/user/Downloads/macomb-foreclosure-2026-08-29-09-04-live.json'}
];
function idOf(x){return String(x.notice_id ?? x.noticeId ?? x.id);}
function findCrm(id){return crm.find(r=>String(r.sourceRecordId ?? r.payload?.noticeId)===id);}
function findQ(id){return queue.find(r=>String(r.noticeId ?? r.sourceRecordId)===id);}
const out = {
  checkpointVersion: 1,
  createdAt: '2026-09-10T18:30:52Z',
  status: 'BLOCKED_PENDING_CONNECTED_FORECLOSURE_CDP',
  campaign: {name:'ELRT-Pre Foreclosure GPT', enrolled:0, verified:0, status:'NOT_VERIFIED'},
  browser: {requiredPort:9223, observed:'127.0.0.1:9223 refused connection; managed browser is not the authorized Windows Edge session', passwordsEntered:false},
  localStores: {crmRecordsPath:'data/crm-records.json', syncQueuePath:'data/sync-queue.json', sqlitePath:'prisma/dev.db', crmRecords:crm.length, queueItems:queue.length, sqliteVerified:false, repairApplied:false},
  windows: []
};
for(const w of windows){
  const src=JSON.parse(fs.readFileSync(w.source));
  const ids=src.map(idOf);
  const rows=ids.map(id=>{const r=findCrm(id), q=findQ(id); return {noticeId:id, localCrm:!!r, localQueue:!!q, loftyId:r?.payload?.loftyLeadId ?? r?.payload?.loftyId ?? null, phones:(r?.payload?.phones ?? []).map(p=>typeof p==='string'?p:p.phone), phoneProvenance:(r?.payload?.phones ?? []).map(p=>typeof p==='string'?'unknown':(p.source||'unknown')), assignment:r?.payload?.assignedAgent ?? q?.assignedAgent ?? null, campaign:'NOT_VERIFIED'};});
  const existing=rows.filter(r=>r.localCrm);
  const withPhones=rows.filter(r=>r.phones.length>0);
  const loftyIds=rows.map(r=>r.loftyId).filter(Boolean);
  const duplicates=[...new Set(loftyIds.filter((x,i,a)=>a.indexOf(x)!==i))];
  out.windows.push({key:w.key,label:w.label,sourcePath:w.source,sourceCount:rows.length,existingCrmCount:existing.length,existingQueueCount:rows.filter(r=>r.localQueue).length,phoneBearingLocalCount:withPhones.length,missingCrmNoticeIds:rows.filter(r=>!r.localCrm).map(r=>r.noticeId),missingQueueNoticeIds:rows.filter(r=>!r.localQueue).map(r=>r.noticeId),duplicateLoftyIds:duplicates,eligibleForCampaignCount:withPhones.length,campaignEnrolledCount:0,campaignVerifiedCount:0,rows});
}
fs.writeFileSync(path.join(root,'data/intake-artifacts/macomb-foreclosure-2026-08-15-to-09-04-checkpoint.json'), JSON.stringify(out,null,2)+'\n');
console.log(JSON.stringify(out.windows.map(w=>({window:w.label,source:w.sourceCount,crm:w.existingCrmCount,queue:w.existingQueueCount,phones:w.phoneBearingLocalCount,missingCrm:w.missingCrmNoticeIds.length,missingQueue:w.missingQueueNoticeIds.length,duplicates:w.duplicateLoftyIds})),null,2));
