import { redirect } from 'next/navigation';

export default function ReportingRedirectPage() {
  redirect('/dashboard/agent-websites?tab=analytics');
}
