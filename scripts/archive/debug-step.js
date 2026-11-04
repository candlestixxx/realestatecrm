const fs = require('fs');

const logPath = 'C:\\Users\\jakeg\\.gemini\\antigravity\\brain\\98543e5a-82cf-4490-9313-f398060313d5\\.system_generated\\logs\\transcript_full.jsonl';
const fileContent = fs.readFileSync(logPath, 'utf8');
const lines = fileContent.split('\n');

for (const line of lines) {
  if (!line.trim()) continue;
  const obj = JSON.parse(line);
  if (obj.step_index === 5002) {
    console.log('Keys:', Object.keys(obj));
    console.log('Type:', obj.type);
    console.log('Content (substring):', JSON.stringify(obj).substring(0, 1000));
    break;
  }
}
