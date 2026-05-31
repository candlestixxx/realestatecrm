'use server';

import { cookies } from 'next/headers';
import { WORKSPACE_COOKIE_NAME } from '@/lib/workspace-context';

export async function setWorkspaceAction(slug: string) {
  const cookieStore = await cookies();
  cookieStore.set(WORKSPACE_COOKIE_NAME, slug, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365, // 1 year
    sameSite: 'lax',
  });
}
