const Database = require('better-sqlite3');
const fs = require('fs');
const db = new Database('/var/www/excellegacyrealtygroup/prisma/dev.db');
db.exec(fs.readFileSync('/tmp/create-chat-tables.sql', 'utf8'));
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'Chat%'").all();
console.log('Chat tables:', tables.map(t => t.name).join(', '));
db.close();
