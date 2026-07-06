const fs = require('fs');
const readline = require('readline');

async function main() {
  const fileStream = fs.createReadStream('C:/Users/jakeg/.gemini/antigravity/brain/98543e5a-82cf-4490-9313-f398060313d5/.system_generated/logs/transcript_full.jsonl');
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  let lineNumber = 0;
  for await (const line of rl) {
    lineNumber++;
    if (lineNumber === 980) {
      const parsed = JSON.parse(line);
      const content = parsed.content;
      
      // Clean prefix "Created At: ... Showing lines 1 to 67 ..."
      const actualCode = content.split('\n').slice(6).map(l => {
        const match = l.match(/^\d+:\s?(.*)$/);
        return match ? match[1] : l;
      }).join('\n');

      fs.writeFileSync('c:/Users/jakeg/workspace/realestatecrm/src/lib/sync-scheduler.ts', actualCode);
      console.log('Restored src/lib/sync-scheduler.ts successfully!');
      break;
    }
  }
}

main().catch(console.error);
