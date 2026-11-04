/**
 * Dashboard route wrapper for the Listing Entry wizard.
 * Consolidates /workflows/listing-entry under /dashboard/workflows/.
 */
import { redirect } from 'next/navigation';

export default function Page() {
  redirect('/workflows/listing-entry');
}
