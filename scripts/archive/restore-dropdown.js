const fs = require('fs');

const logPath = 'C:\\Users\\jakeg\\.gemini\\antigravity\\brain\\98543e5a-82cf-4490-9313-f398060313d5\\.system_generated\\logs\\transcript_full.jsonl';
const targetPath = 'C:\\Users\\jakeg\\workspace\\realestatecrm\\src\\components\\UserProfileDropdown.tsx';

function restore() {
  const fileContent = fs.readFileSync(logPath, 'utf8');
  const lines = fileContent.split('\n');

  // Let's find the write_to_file for UserProfileDropdown.tsx
  for (const line of lines) {
    if (!line.trim()) continue;
    try {
      const obj = JSON.parse(line);
      if (obj.tool_calls) {
        const toolCall = obj.tool_calls.find(tc => 
          tc.name === 'write_to_file' && tc.args.TargetFile.includes('UserProfileDropdown.tsx')
        );
        if (toolCall) {
          const code = toolCall.args.CodeContent;
          fs.writeFileSync(targetPath, code, 'utf8');
          console.log(`Successfully restored UserProfileDropdown.tsx from step ${obj.step_index}!`);
          return;
        }
      }
    } catch (e) {
      // Ignore
    }
  }
  console.log('No write_to_file found for UserProfileDropdown.tsx.');
}

restore();
