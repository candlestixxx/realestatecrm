'use client';

import { SessionProvider } from 'next-auth/react';
import { ThemeProvider } from 'next-themes';
import { Toaster } from 'react-hot-toast';
import { TooltipProvider } from '@/components/ui/tooltip';

// Silence false-positive React 19 script tag injection warning from next-themes in dev mode
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  const originalError = console.error;
  console.error = (...args: any[]) => {
    if (typeof args[0] === 'string' && args[0].includes('Encountered a script tag')) {
      return;
    }
    if (typeof args[0] === 'string' && args[0].includes('DialogContent') && args[0].includes('DialogTitle')) {
      return;
    }
    if (typeof args[0] === 'string' && (args[0].includes('decryption operation failed') || args[0].includes('JWT_SESSION_ERROR'))) {
      return;
    }
    if (args[1] && typeof args[1] === 'string' && (args[1].includes('decryption operation failed') || args[1].includes('JWT_SESSION_ERROR'))) {
      return;
    }
    originalError.apply(console, args);
  };
}

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <SessionProvider>
        <TooltipProvider>
          {children}
        </TooltipProvider>
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: 'var(--background)',
              color: 'var(--foreground)',
              border: '1px solid var(--border)',
            },
            success: {
              iconTheme: {
                primary: '#d4af37',
                secondary: '#fff',
              },
            },
          }}
        />
      </SessionProvider>
    </ThemeProvider>
  );
}
