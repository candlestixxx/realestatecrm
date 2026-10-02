import { cookies } from 'next/headers';
import type { Session } from 'next-auth';
// Constants live in workspace-constants.ts so client code can share them
// without dragging `next/headers` into the browser bundle.
import { DEFAULT_WORKSPACE_SLUG, WORKSPACE_COOKIE_NAME } from './workspace-constants';

export { DEFAULT_WORKSPACE_SLUG, WORKSPACE_COOKIE_NAME };

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
