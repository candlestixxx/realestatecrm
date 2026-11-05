/**
 * ContentPlanner API base URL for dashboard fetches.
 *
 * Why: the dashboard cannot call the ContentPlanner API directly — the API
 * requires a Bearer JWT the browser cannot safely hold. Dashboard fetches go
 * through the MAIN CRM's session-authenticated proxy at
 * /api/contentplanner/*, which signs a short-lived service JWT server-side.
 *
 * Local dev can set NEXT_PUBLIC_CONTENT_PLANNER_API_URL to point at the API
 * directly (e.g. http://localhost:3031) when running without the proxy.
 */
export function contentPlannerApiBase(): string {
  return process.env.NEXT_PUBLIC_CONTENT_PLANNER_API_URL || '/api/contentplanner';
}

/** Build a full ContentPlanner API URL from a route path. */
export function contentPlannerApiUrl(route: string): string {
  return `${contentPlannerApiBase()}${route.startsWith('/') ? route : `/${route}`}`;
}
