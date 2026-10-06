/**
 * Redirect to consolidated marketing page.
 * Text Codes was merged into /dashboard/marketing as a single-page surface.
 * This route is kept for bookmarks and external links.
 */
import { redirect } from 'next/navigation';

export default function TextCodesRedirect() {
  redirect('/dashboard/marketing');
}
