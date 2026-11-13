const fs = require('fs');
const p = 'C:/Users/hyper/workspace/realestatecrm/apps/leadg/src/app/api/leads/route.ts';
let c = fs.readFileSync(p, 'utf8');
const old = "  } catch (error) {\r\n    return NextResponse.json({ error: 'Failed to create lead' }, { status: 500 });\r\n  }\r\n}";
const neu = "  } catch (error) {\r\n    console.error('Lead create error:', error);\r\n    return NextResponse.json({ error: 'Failed to create lead' }, { status: 500 });\r\n  }\r\n}";
if (c.includes(old)) {
  c = c.replace(old, neu);
  fs.writeFileSync(p, c);
  console.log('FIXED');
} else {
  console.log('NOT FOUND');
}
