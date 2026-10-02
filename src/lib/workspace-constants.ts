/**
 * Workspace identifiers shared by server and client code.
 *
 * Why this module exists: `workspace-context.ts` imports `next/headers` and is
 * therefore server-only. Client components need the same cookie name and the
 * same default slug; importing the server module from a client component pulls
 * `next/headers` into the browser bundle and fails the build. Keeping the two
 * constants here lets both sides share one source of truth with no dependency
 * on Next.js server APIs.
 */

/**
 * Fallback workspace when neither a cookie nor a session slug is present.
 * This is the ONLY place the literal should appear in `src/`.
 */
export const DEFAULT_WORKSPACE_SLUG = 'excel-legacy-team';

/** Cookie set when the user switches the active workspace/tenant. */
export const WORKSPACE_COOKIE_NAME = 'x-workspace-slug';
