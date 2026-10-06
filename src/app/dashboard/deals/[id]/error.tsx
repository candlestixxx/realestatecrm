'use client';

/**
 * Error boundary for deals/[id] detail page.
 * Required so layout crashes (WorkspaceAccessError, DB errors) render
 * error UI instead of 404.
 */
export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="p-6">
      <h2 className="text-lg font-semibold mb-2">Something went wrong</h2>
      <p className="text-sm text-muted-foreground mb-4">{error.message}</p>
      <button onClick={reset} className="px-4 py-2 bg-primary text-primary-foreground rounded text-sm">
        Try again
      </button>
    </div>
  );
}
