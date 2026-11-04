/**
 * Client-safe workspace slug resolution.
 *
 * Why this exists alongside `workspace-context.ts`: that module imports
 * `next/headers` and therefore can only run on the server. Dashboard pages and
 * client components were hardcoding `workspaceId: 'excel-legacy-team'` in
 * fetch URLs and request bodies because they had no way to read the active
 * workspace. This module is the browser counterpart — same cookie, same
 * fallback chain — so a workspace switch is honored everywhere instead of
 * silently pinned to one tenant.
 *
 * Side effect: none. Pure string work on `document.cookie`.
 */
import { DEFAULT_WORKSPACE_SLUG, WORKSPACE_COOKIE_NAME } from './workspace-constants';

/**
 * Read the active workspace slug in the browser.
 *
 * Order: the workspace cookie (set when the user switches tenants) -> the
 * shared default. Session-derived slugs are not available client-side without
 * an extra round trip, so the cookie is the source of truth here; the server
 * helper still prefers the session when the cookie is absent.
 */
export function getClientWorkspaceSlug(): string {
  if (typeof document === 'undefined') return DEFAULT_WORKSPACE_SLUG;

  const match = document.cookie
    .split(';')
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${WORKSPACE_COOKIE_NAME}=`));

  if (!match) return DEFAULT_WORKSPACE_SLUG;
  const value = decodeURIComponent(match.slice(WORKSPACE_COOKIE_NAME.length + 1));
  return value || DEFAULT_WORKSPACE_SLUG;
}

/**
 * Build a URLSearchParams that always carries the active workspaceId.
 * Use this instead of hand-rolling `new URLSearchParams({ workspaceId: '...' })`.
 */
export function withWorkspace(params?: Record<string, string>): URLSearchParams {
  const p = new URLSearchParams(params);
  if (!p.has('workspaceId')) p.set('workspaceId', getClientWorkspaceSlug());
  return p;
}

/**
 * Merge the active workspaceId into a JSON request body.
 * Use this instead of hand-rolling `{ ...form, workspaceId: '...' }`.
 */
export function withWorkspaceBody<T extends Record<string, unknown>>(body: T): T & { workspaceId: string } {
  return { ...body, workspaceId: (body.workspaceId as string) || getClientWorkspaceSlug() };
}
