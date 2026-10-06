/**
 * Redirect to consolidated websites page.
 * Builder was merged into /dashboard/websites as a single-page surface.
 * This route is kept for bookmarks and external links.
 */
import { redirect } from 'next/navigation';

export default function WebsiteBuilderRedirect() {
  redirect('/dashboard/websites');
}
