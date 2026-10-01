const fs = require('fs');

const logPath = 'C:\\Users\\jakeg\\.gemini\\antigravity\\brain\\98543e5a-82cf-4490-9313-f398060313d5\\.system_generated\\logs\\transcript_full.jsonl';
const fileContent = fs.readFileSync(logPath, 'utf8');
const lines = fileContent.split('\n');

for (const line of lines) {
  if (!line.trim()) continue;
  const obj = JSON.parse(line);
  if (obj.type === 'PLANNER_RESPONSE') {
    const str = JSON.stringify(obj);
    if (str.includes('write_to_file') && str.includes('WebsitesClient.tsx')) {
      console.log(`Step ${obj.step_index} calls write_to_file for WebsitesClient.tsx!`);
    }
  }
}
