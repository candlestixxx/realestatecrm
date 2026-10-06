/**
 * Redirect to consolidated reporting page.
 * Analytics was merged into /dashboard/reporting with tabbed views.
 * This route is kept for bookmarks and external links.
 */
import { redirect } from 'next/navigation';

export default function AnalyticsRedirect() {
  redirect('/dashboard/reporting');
}
