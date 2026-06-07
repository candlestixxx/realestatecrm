import { SignInForm } from '@/components/auth/signin-form';

type SignInPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function extractError(searchParams: unknown) {
  if (!searchParams) return null;

  const params = searchParams as Record<string, unknown> & {
    get?: (name: string) => string | null;
  };

  if (typeof params.get === 'function') {
    return params.get('error');
  }

  const candidate = params.error;
  if (typeof candidate === 'string') {
    return candidate;
  }

  if (Array.isArray(candidate)) {
    return candidate[0] ?? null;
  }

  return null;
}

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const resolvedParams = searchParams ? await searchParams : {};
  return <SignInForm error={extractError(resolvedParams)} />;
}
