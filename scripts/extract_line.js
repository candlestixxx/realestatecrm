const fs = require('fs');
const readline = require('readline');

async function main() {
  const fileStream = fs.createReadStream('C:/Users/jakeg/.gemini/antigravity/brain/98543e5a-82cf-4490-9313-f398060313d5/.system_generated/logs/transcript_full.jsonl');
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  let lineNumber = 0;
  const targetLines = [974, 979, 980, 982, 983, 1118, 1196, 1608];

  for await (const line of rl) {
    lineNumber++;
    if (targetLines.includes(lineNumber)) {
      console.log(`=== LINE ${lineNumber} ===`);
      const parsed = JSON.parse(line);
      console.log(JSON.stringify(parsed, null, 2).substring(0, 1000));
    }
  }
}

main().catch(console.error);
