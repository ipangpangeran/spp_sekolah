import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifySessionToken } from '@/lib/auth-token';

export async function middleware(request: NextRequest) {
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
    pathname === '/api/auth/login' ||
    pathname === '/api/auth/logout' ||
    pathname === '/api/client-error'
  ) {
    return NextResponse.next();
  }

  const sessionCookie = request.cookies.get('sisma_session');
  const sessionUser = await verifySessionToken(sessionCookie?.value);
  const isAuthenticated = Boolean(sessionUser);

  // If requesting API endpoint without valid session cookie -> return 401 Unauthorized
  if (pathname.startsWith('/api/')) {
    if (!isAuthenticated) {
      return NextResponse.json(
        { error: 'Akses ditolak. Sesi tidak sah atau telah berakhir.' },
        { status: 401 }
      );
    }

    // Restrict admin-only setup APIs
    if (
      (pathname.startsWith('/api/pengaturan') || pathname.startsWith('/api/master/users')) &&
      sessionUser?.level !== 'admin'
    ) {
      return NextResponse.json(
        { error: 'Akses ditolak. Hanya Administrator yang dapat mengakses menu pengaturan & setup.' },
        { status: 403 }
      );
    }

    return NextResponse.next();
  }

  // If requesting application page without valid session cookie -> redirect cleanly to /login
  if (!isAuthenticated) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  // Restrict admin-only setup pages
  if (
    (pathname.startsWith('/pengaturan') ||
      pathname.startsWith('/master/arsip-kelas') ||
      pathname.startsWith('/master/users')) &&
    sessionUser?.level !== 'admin'
  ) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
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
