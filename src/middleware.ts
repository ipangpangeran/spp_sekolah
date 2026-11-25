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
  let sessionUser: { level?: string } | null = null;
  if (sessionCookie?.value) {
    try {
      sessionUser = JSON.parse(sessionCookie.value);
    } catch {
      sessionUser = null;
    }
  }
  const isAuthenticated = Boolean(sessionUser);

  // If requesting API endpoint without valid session cookie -> return 401 Unauthorized
  if (pathname.startsWith('/api/')) {
    if (!isAuthenticated) {
      return NextResponse.json(
        { error: 'Akses ditolak. Sesi tidak sah atau telah berakhir.' },
        { status: 401 }
      );
    }

    // Restrict /api/pengaturan* strictly to admin role
    if (pathname.startsWith('/api/pengaturan') && sessionUser?.level !== 'admin') {
      return NextResponse.json(
        { error: 'Akses ditolak. Hanya Administrator yang dapat mengakses pengaturan sistem.' },
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

  // Restrict /pengaturan page strictly to admin role
  if (pathname.startsWith('/pengaturan') && sessionUser?.level !== 'admin') {
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
