import { cookies } from 'next/headers';
import type { Session } from 'next-auth';

export const DEFAULT_WORKSPACE_SLUG = 'excel-legacy-team';
export const WORKSPACE_COOKIE_NAME = 'x-workspace-slug';

export async function getActiveWorkspaceSlug(session?: Session | null) {
  const cookieStore = await cookies();
  const cookieValue = cookieStore.get(WORKSPACE_COOKIE_NAME)?.value;
  
  if (cookieValue) {
    return cookieValue;
  }

  return session?.user?.workspaceSlug ?? DEFAULT_WORKSPACE_SLUG;
}

export function getActorId(session?: Session | null) {
  return session?.user?.id ?? null;
}

export async function getWorkspaceScope(session?: Session | null) {
  return {
    workspaceSlug: await getActiveWorkspaceSlug(session),
    actorId: getActorId(session),
  };
}
