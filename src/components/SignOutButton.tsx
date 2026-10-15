'use client';

import { signOut } from 'next-auth/react';

export default function SignOutButton() {
  return (
    <button type="button"
      onClick={() => signOut({ callbackUrl: '/auth/signin' })}
      className="text-xs text-muted-foreground hover:text-foreground underline truncate"
    >
      Sign Out
    </button>
  );
}
