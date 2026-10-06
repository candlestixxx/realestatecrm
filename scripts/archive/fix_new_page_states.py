from pathlib import Path

PAGES = ["avatar", "canva", "chat", "client-portal", "contracts", "imports", "objections", "property-data", "vault"]

LOADING_TEMPLATE = '''export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      <span className="ml-3 text-gray-500">Loading...</span>
    </div>
  );
}
'''

ERROR_TEMPLATE = """'use client';

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
      <p className="text-red-600 font-medium">Something went wrong.</p>
      <p className="text-gray-500 text-sm">{error.message}</p>
      <button
        onClick={reset}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Try Again
      </button>
    </div>
  );
}
"""

for page in PAGES:
    base = Path(f"src/app/dashboard/{page}")
    if not base.exists():
        print(f"SKIP {page} — dir not found")
        continue
    (base / "loading.tsx").write_text(LOADING_TEMPLATE, encoding="utf-8")
    (base / "error.tsx").write_text(ERROR_TEMPLATE, encoding="utf-8")
    print(f"OK {page}")

print("Done: loading + error states for 9 pages")
