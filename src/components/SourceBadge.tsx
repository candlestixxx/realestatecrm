/**
 * SourceBadge — transparent labeling of where displayed data came from.
 *
 * Why: several API routes (property-data, skip-trace, avatar) return
 * generated placeholder records when their provider keys are not
 * configured. Without labeling, operators can't tell demo data from live
 * data — the worst failure mode for a CRM. This badge makes the provenance
 * explicit in the UI.
 *
 * Usage: pass the `source` field returned by the API. Known live sources
 * render neutral; anything else renders the demo treatment.
 */

const LIVE_SOURCES = new Set(['bsa', 'realcomp', 'whitepages', 'db', 'prisma']);

export default function SourceBadge({ source }: { source: string | undefined }) {
  if (!source) return null;
  const isLive = LIVE_SOURCES.has(source.toLowerCase());
  return (
    <span
      title={
        isLive
          ? 'Live data from: ' + source
          : 'Demo data — provider key not configured. Values are illustrative, not real records.'
      }
      className={
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border ' +
        (isLive
          ? 'bg-green-500/10 text-green-600 border-green-500/30'
          : 'bg-amber-500/10 text-amber-600 border-amber-500/30')
      }
    >
      <span className={'w-1.5 h-1.5 rounded-full ' + (isLive ? 'bg-green-500' : 'bg-amber-500')} />
      {isLive ? source : 'Demo Data'}
    </span>
  );
}
