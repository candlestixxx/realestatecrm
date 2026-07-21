const fs = require('fs');

const logPath = 'C:\\Users\\jakeg\\.gemini\\antigravity\\brain\\98543e5a-82cf-4490-9313-f398060313d5\\.system_generated\\logs\\transcript_full.jsonl';
const targetPath = 'C:\\Users\\jakeg\\workspace\\realestatecrm\\src\\components\\websites\\WebsitesClient.tsx';

function restore() {
  const fileContent = fs.readFileSync(logPath, 'utf8');
  const lines = fileContent.split('\n');

  // Let's search for step 5159 (which had the copy/delete actions and useSearchParams)
  const targets = [5159, 5154, 5150, 5095];

  for (const stepId of targets) {
    console.log(`Checking step ${stepId}...`);
    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const obj = JSON.parse(line);
        if (obj.step_index === stepId && obj.tool_calls) {
          // Check if there's an edit targeting WebsitesClient.tsx
          const toolCall = obj.tool_calls.find(tc => 
            (tc.name === 'write_to_file' || tc.name === 'replace_file_content' || tc.name === 'multi_replace_file_content') && 
            tc.args.TargetFile.includes('WebsitesClient.tsx')
          );
          if (toolCall) {
            console.log(`Step ${stepId} found! Name: ${toolCall.name}`);
            if (toolCall.name === 'write_to_file') {
              fs.writeFileSync(targetPath, toolCall.args.CodeContent, 'utf8');
              console.log(`Successfully restored WebsitesClient.tsx to step ${stepId} version!`);
              return;
            } else {
              console.log(`Step ${stepId} is a replace/edit tool call (not write_to_file). We will try step 5095 first then apply this or find the next write_to_file.`);
            }
          }
        }
      } catch (e) {
        // Skip invalid JSON lines
      }
    }
  }
}

restore();
