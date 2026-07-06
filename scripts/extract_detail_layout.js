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
    if (lineNumber === 3423) {
      const parsed = JSON.parse(line);
      console.log('--- LINE 3423 KEY CONTENT ---');
      console.log(parsed.tool_calls[0].args.CodeContent);
      break;
    }
  }
}

main().catch(console.error);
