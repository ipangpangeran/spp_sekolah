import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow static files, next internal assets, public logo, and auth API
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/icon.png') ||
    pathname.startsWith('/logo_sisma.png') ||
    pathname.startsWith('/Logo_SmaPersiapan.png') ||
    pathname === '/login' ||
    pathname === '/api/auth/login'
  ) {
    return NextResponse.next();
  }

  const sessionCookie = request.cookies.get('sisma_session');
  const isAuthenticated = Boolean(sessionCookie?.value);

  // If requesting API endpoint without valid session cookie -> return 401 Unauthorized
  if (pathname.startsWith('/api/')) {
    if (!isAuthenticated) {
      return NextResponse.json(
        { error: 'Akses ditolak. Sesi tidak sah atau telah berakhir.' },
        { status: 401 }
      );
    }
    return NextResponse.next();
  }

  // If requesting application page without valid session cookie -> redirect to /login
  if (!isAuthenticated) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('timeout', '1');
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for static assets
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
