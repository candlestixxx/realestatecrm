'use client';

import { useRouter } from 'next/navigation';
import { setWorkspaceAction } from '@/lib/actions/workspace';

export function WorkspaceSwitcher({
  workspaces,
  activeSlug,
}: {
  workspaces: { id: string; name: string }[];
  activeSlug: string;
}) {
  const router = useRouter();

  const handleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const slug = e.target.value;
    await setWorkspaceAction(slug);
    router.refresh();
  };

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="workspace-switcher" className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
        Workspace:
      </label>
      <select
        id="workspace-switcher"
        value={activeSlug}
        onChange={handleChange}
        className="bg-background border border-border rounded-md px-2 py-1 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-primary"
      >
        {workspaces.map((ws) => (
          <option key={ws.id} value={ws.id}>
            {ws.name}
          </option>
        ))}
      </select>
    </div>
  );
}
