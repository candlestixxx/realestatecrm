from pathlib import Path

LOADING = '''export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      <span className="ml-3 text-gray-500">Loading...</span>
    </div>
  );
}
'''

ERROR = """'use client';

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
      <p className="text-red-600 font-medium">Something went wrong.</p>
      <p className="text-gray-500 text-sm">{error.message}</p>
      <button onClick={reset} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
        Try Again
      </button>
    </div>
  );
}
"""

# Detail pages that need all three
detail_pages = [
    "src/app/dashboard/deals/[id]",
    "src/app/dashboard/leads/[id]",
]

# Pages needing only loading
loading_only = [
    "src/app/dashboard/agent-studio",
    "src/app/dashboard/approvals",
    "src/app/dashboard/map",
    "src/app/dashboard/social",
    "src/app/dashboard/workflows",
    "src/app/dashboard/settings",
    "src/app/dashboard/help-center",
    "src/app/dashboard/marketing-studio",
]

for page in detail_pages:
    p = Path(page)
    if not p.exists():
        print(f"SKIP {page}")
        continue
    (p / "loading.tsx").write_text(LOADING, encoding="utf-8")
    (p / "error.tsx").write_text(ERROR, encoding="utf-8")
    print(f"OK {page} (loading+error)")

for page in loading_only:
    p = Path(page)
    if not p.exists():
        print(f"SKIP {page}")
        continue
    loading_file = p / "loading.tsx"
    if not loading_file.exists():
        loading_file.write_text(LOADING, encoding="utf-8")
        print(f"OK {page} (loading)")
    else:
        print(f"SKIP {page} (loading exists)")

print("Done: detail pages + loading states")
