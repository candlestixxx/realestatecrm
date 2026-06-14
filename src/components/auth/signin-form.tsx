"use client";

import { useMemo, useState } from 'react';
import { signIn, useSession } from 'next-auth/react';
import type { FormEvent } from 'react';

type SignInFormProps = {
  error?: string | null;
};

const errorMessages: Record<string, string> = {
  CredentialsSignin: 'The username/email or password was not recognized.',
  AccessDenied: 'Access was denied for this account.',
  default: 'Sign in failed. Please try again.',
};

export function SignInForm({ error }: SignInFormProps) {
  const { status } = useSession();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const message = useMemo(() => {
    if (!error) return null;
    return errorMessages[error] ?? errorMessages.default;
  }, [error]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);

    try {
      await signIn('credentials', {
        email,
        password,
        callbackUrl: '/dashboard',
        redirect: true,
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(30,64,175,0.18),_transparent_35%),linear-gradient(180deg,_var(--background),_var(--background))] px-4">
      <div className="w-full max-w-md space-y-8 rounded-3xl border border-border bg-background p-8 shadow-2xl shadow-black/10">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary text-2xl font-bold text-secondary-foreground">
            EL
          </div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-secondary">Excel Legacy Realty</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground">Sign in to continue</h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Access live CRM records, workflow drafts, and partner-ready dashboards.
          </p>
        </div>

        {message ? (
          <div className="rounded-2xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-200">
            {message}
          </div>
        ) : null}

        {status === 'authenticated' ? (
          <div className="rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200">
            You are already signed in. Redirecting to the dashboard...
          </div>
        ) : null}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium text-foreground">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-2xl border border-border bg-muted/40 px-4 py-3 text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary"
              placeholder="jsmith@example.com"
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium text-foreground">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-2xl border border-border bg-muted/40 px-4 py-3 text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary"
              placeholder="Enter your secure password"
              required
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <div className="rounded-2xl border border-border bg-muted/20 p-4 text-sm text-muted-foreground">
          Production mode uses Prisma/Postgres + credentialed users. Local dev still falls back to seeded data if
          the database is not configured.
        </div>
      </div>
    </div>
  );
}
