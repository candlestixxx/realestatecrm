import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const url = req.nextUrl;
    const hostname = req.headers.get('host') || '';

    // Handle multi-tenant website domain routing
    // e.g. If hostname is agent1.excellegacy.com or mycustomdomain.com
    // And it's not localhost or the main deployed application domain
    const isLocalhost = hostname.includes('localhost');
    const isMainDomain = hostname === process.env.NEXT_PUBLIC_APP_URL?.replace('https://', '').replace('http://', '');

    if (!isLocalhost && !isMainDomain && !url.pathname.startsWith('/api') && !url.pathname.startsWith('/_next')) {
      // Rewrite to the websites route group using the hostname as the identifier
      return NextResponse.rewrite(new URL(`/${hostname}${url.pathname}`, req.url));
    }

    return NextResponse.next();
  },
  {
    pages: {
      signIn: '/auth/signin',
    },
  }
);

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - auth/signin (sign in page)
     * - root (/) (landing page)
     * - site (explicit site viewer)
     * Note: /portal is implicitly protected by this matcher.
     */
    '/((?!api|_next/static|_next/image|favicon.ico|auth/signin|site|$).*)',
  ],
};
