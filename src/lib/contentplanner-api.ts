/**
 * ContentPlanner API base URL.
 *
 * Why: the dashboard previously hardcoded `http://localhost:3031` in fetch
 * calls, which only works when the browser runs on the server itself. In
 * production the ContentPlanner API is proxied by nginx at
 * `/contentplanner-api/`, so the default is a RELATIVE path that works on
 * any host. Local dev can set NEXT_PUBLIC_CONTENT_PLANNER_API_URL to
 * http://localhost:3031.
 */
export function contentPlannerApiBase(): string {
  return process.env.NEXT_PUBLIC_CONTENT_PLANNER_API_URL || '/contentplanner-api';
}

/** Build a full ContentPlanner API URL from a route path. */
export function contentPlannerApiUrl(route: string): string {
  return `${contentPlannerApiBase()}${route.startsWith('/') ? route : `/${route}`}`;
}
