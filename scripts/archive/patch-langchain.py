"""Force-patch @langchain/textsplitters to use relative imports for @langchain/core.
Also searches for duplicate copies of the package."""
from pathlib import Path
import re

root = Path("C:/Users/hyper/workspace/realestatecrm/apps/contentplanner")

# Find ALL text_splitter.cjs and text_splitter.js files
found = list(root.rglob("text_splitter.cjs")) + list(root.rglob("text_splitter.js"))
print(f"Found {len(found)} text_splitter files:")
for f in found:
    print(f"  {f}")

for f in found:
    content = f.read_text(encoding="utf-8")
    if "@langchain/core/documents" in content or "@langchain/core/utils" in content:
        # Patch CJS requires
        content = content.replace(
            'require("@langchain/core/documents")',
            'require("../../core/dist/documents/index.cjs")'
        )
        content = content.replace(
            'require("@langchain/core/utils/tiktoken")',
            'require("../../core/dist/utils/tiktoken.cjs")'
        )
        # Patch ESM imports
        content = content.replace(
            'from "@langchain/core/documents"',
            'from "../../core/dist/documents/index.js"'
        )
        content = content.replace(
            'from "@langchain/core/utils/tiktoken"',
            'from "../../core/dist/utils/tiktoken.js"'
        )
        f.write_text(content, encoding="utf-8")
        print(f"  PATCHED: {f}")
    else:
        print(f"  CLEAN: {f}")

# Also check for other files referencing @langchain/core subpaths
for f in root.rglob("*.cjs"):
    try:
        content = f.read_text(encoding="utf-8")
        if "@langchain/core/documents" in content or "@langchain/core/utils/tiktoken" in content:
            print(f"  STILL BROKEN: {f}")
    except:
        pass

print("Done.")
