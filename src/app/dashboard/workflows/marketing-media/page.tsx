/**
 * Dashboard route wrapper for the Marketing Media pipeline.
 * Consolidates /workflows/marketing-media under /dashboard/workflows/.
 */
import { redirect } from 'next/navigation';

export default function Page() {
  redirect('/workflows/marketing-media');
}
