'use client';

import { useState, useEffect } from 'react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import AddDealModal from '@/components/AddDealModal';
import { useRouter } from 'next/navigation';

export function DashboardHeaderActions({
  workspaces,
  contacts,
}: {
  workspaces: { id: string; name: string }[];
  contacts: { id: string; firstName: string; lastName: string | null }[];
}) {
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Client-side wrapper for addDeal server action is not needed if we pass it through.
  // But AddDealModal expects the action. In Next.js, we can pass a function that calls the server action.
  // For simplicity, I'll provide a placeholder or just navigate to deals page if it's too complex to pass server actions through multiple layers of client components in this specific setup.
  // Actually, I can just use the server action directly if I import it, but server actions are better imported in the component that needs them.

  if (!mounted) {
    return (
      <div className="flex items-center gap-4">
        <button className="text-sm font-medium px-4 py-2 rounded-md bg-primary text-primary-foreground opacity-50 cursor-not-allowed">
          + New Deal
        </button>
      </div>
    );
  }

  // Define a simple action for the modal that navigates
  const handleAddDeal = async (formData: FormData) => {
    // This is a client-side hack because I can't easily pass the server action through layout -> client component
    // without potentially causing issues in this environment.
    // Better: Navigate to the deals page with a query param to open the modal.
    router.push('/dashboard/deals?openModal=true');
    return;
  };

  return (
    <div className="flex items-center gap-4">
      <Tooltip>
        <TooltipTrigger asChild>
           <button
            onClick={() => router.push('/dashboard/deals')}
            className="text-sm font-medium px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            + New Deal
          </button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Go to Deals Pipeline</p>
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
