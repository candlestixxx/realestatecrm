import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import type { NextRequest } from 'next/server';

const AUTH_PAGES = ['/auth/signin'];
const PROTECTED_PATH_PREFIXES = ['/dashboard', '/contacts', '/deals', '/leads', '/tasks', '/portal', '/workflows'];
const PROTECTED_API_PREFIXES = ['/api/chat', '/api/crm-records', '/api/workflows'];

function isProtectedPath(pathname: string) {
  return (
    PROTECTED_PATH_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)) ||
    PROTECTED_API_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))
  );
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (AUTH_PAGES.includes(pathname)) {
    return NextResponse.next();
  }

  if (!isProtectedPath(pathname)) {
    return NextResponse.next();
  }

  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET ?? 'realestatecrm-dev-secret' });

  if (!token?.sub) {
    const signInUrl = new URL('/auth/signin', request.url);
    signInUrl.searchParams.set('callbackUrl', request.url);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/contacts/:path*', '/deals/:path*', '/leads/:path*', '/tasks/:path*', '/portal/:path*', '/workflows/:path*', '/api/chat', '/api/chat/:path*', '/api/crm-records/:path*', '/api/workflows/:path*', '/auth/signin'],
};
