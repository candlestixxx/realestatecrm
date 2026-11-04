/**
 * Dashboard route wrapper for the Foreclosure Intake wizard.
 * Consolidates /workflows/foreclosure-intake under /dashboard/workflows/ for
 * unified navigation. The original route still works for backwards compat.
 */
import { redirect } from 'next/navigation';

export default function Page() {
  redirect('/workflows/foreclosure-intake');
}
