'use client';

import { signOut } from 'next-auth/react';

export default function PortalSignOut() {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: '/auth/signin' })}
      className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
    >
      Sign Out
    </button>
  );
}
