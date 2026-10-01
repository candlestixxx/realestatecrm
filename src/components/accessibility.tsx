'use client';

import React from 'react';

/**
 * Accessibility utilities and skip-to-content link for keyboard navigation.
 * Implements WCAG 2.1 AA essentials.
 */

export function SkipToContent() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[9999] focus:bg-blue-600 focus:text-white focus:px-4 focus:py-2 focus:rounded focus:outline-none"
    >
      Skip to main content
    </a>
  );
}

export function LiveRegion({ message, assertive = false }: { message: string; assertive?: boolean }) {
  return (
    <div
      role="status"
      aria-live={assertive ? 'assertive' : 'polite'}
      aria-atomic="true"
      className="sr-only"
    >
      {message}
    </div>
  );
}

export function AccessibleButton({
  children,
  onClick,
  label,
  variant = 'primary',
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { label: string; variant?: 'primary' | 'secondary' | 'danger' }) {
  const styles = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
    secondary: 'bg-gray-100 text-gray-700 hover:bg-gray-200',
    danger: 'bg-red-600 text-white hover:bg-red-700',
  };
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${styles[variant]}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function AccessibleTable({
  caption,
  headers,
  children,
}: {
  caption: string;
  headers: string[];
  children: React.ReactNode;
}) {
  return (
    <table className="w-full" role="table" aria-label={caption}>
      <caption className="sr-only">{caption}</caption>
      <thead>
        <tr>
          {headers.map((h, i) => (
            <th key={i} scope="col" className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-2">
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>{children}</tbody>
    </table>
  );
}
