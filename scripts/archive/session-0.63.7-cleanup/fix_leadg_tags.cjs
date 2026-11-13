const fs = require('fs');
const p = 'C:/Users/hyper/workspace/realestatecrm/apps/leadg/src/app/api/leads/route.ts';
let c = fs.readFileSync(p, 'utf8');
const old = "        status: 'New',\r\n        userId: user.id,";
const neu = "        status: 'New',\r\n        tags: Array.isArray(body.tags) ? body.tags : [],\r\n        userId: user.id,";
if (c.includes(old)) {
  c = c.replace(old, neu);
  fs.writeFileSync(p, c);
  console.log('FIXED');
} else {
  const idx = c.indexOf("status: 'New'");
  console.log('NOT FOUND, idx=' + idx);
  if (idx >= 0) console.log(JSON.stringify(c.substring(idx, idx + 100)));
}
