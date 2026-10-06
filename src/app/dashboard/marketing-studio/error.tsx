'use client';

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center space-y-4">
        <div className="text-4xl">⚠️</div>
        <h2 className="text-lg font-bold text-foreground">Something went wrong</h2>
        <p className="text-sm text-muted-foreground max-w-md">
          {error.message || 'An unexpected error occurred while loading this section.'}
        </p>
        <button
          onClick={reset}
          className="px-4 py-2 bg-secondary text-secondary-foreground text-sm font-bold rounded-lg hover:bg-secondary/90 transition-colors"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
