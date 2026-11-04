/**
 * Dashboard route wrapper for the Offer Draft wizard.
 * Consolidates /workflows/offer-draft under /dashboard/workflows/.
 */
import { redirect } from 'next/navigation';

export default function Page() {
  redirect('/workflows/offer-draft');
}
