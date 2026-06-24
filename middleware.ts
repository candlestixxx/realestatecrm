import { getToken } from 'next-auth/jwt';
import { NextRequest, NextResponse } from 'next/server';

export default async function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const hostname = req.headers.get('host') || '';

  // 1. Multi-Tenant Handling (No auth required for public visitors)
  const isLocalhost = hostname.includes('localhost') || hostname.includes('127.0.0.1');
  const mainDomain = process.env.NEXT_PUBLIC_APP_URL?.replace('https://', '')?.replace('http://', '') || 'localhost:3000';
  const isMainDomain = hostname === mainDomain || isLocalhost;

  // Identify internal routes that should NOT be treated as tenant sites
  const isInternalRoute = url.pathname.startsWith('/api') ||
                          url.pathname.startsWith('/_next') ||
                          url.pathname.startsWith('/auth') ||
                          url.pathname.startsWith('/site') ||
                          url.pathname === '/favicon.ico';

  if (!isMainDomain && !isInternalRoute) {
    // Rewrite to the websites dynamic route group
    return NextResponse.rewrite(new URL(`/${hostname}${url.pathname}`, req.url));
  }

  // 2. CRM Auth Protection (Only for main domain)
  // Re-implement basic route protection here because we replaced withAuth wrapper
  const isProtectedRoute = url.pathname.startsWith('/dashboard') ||
                           url.pathname.startsWith('/portal') ||
                           url.pathname.startsWith('/workflows');

  if (isProtectedRoute) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET ?? 'realestatecrm-dev-secret' });
    if (!token) {
      const signInUrl = new URL('/auth/signin', req.url);
      signInUrl.searchParams.set('callbackUrl', req.url);
      return NextResponse.redirect(signInUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - auth/signin (sign in page)
     * Note: We removed the negative lookahead for root '$' and 'site' so that multi-tenant root paths correctly match
     */
    '/((?!api|_next/static|_next/image|favicon.ico|auth/signin).*)',
  ],
};
