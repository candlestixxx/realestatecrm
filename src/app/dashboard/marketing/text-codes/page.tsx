/**
 * Redirect to consolidated Marketing Hub SMS Text Codes tab.
 * Kept for bookmarks and external links.
 */
import { redirect } from 'next/navigation';

export default function TextCodesRedirect() {
  redirect('/dashboard/marketing?tab=text-codes');
}
