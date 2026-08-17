import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { decrypt } from '@/lib/auth';

const publicRoutes = ['/login', '/api/auth/login', '/api/admin/seed'];
const adminRoutes = ['/developer', '/api/admin'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow static assets, images, next system files, and public routes
  if (
    pathname.startsWith('/_next') ||
    pathname.match(/\.(png|jpg|jpeg|gif|svg|ico)$/) ||
    publicRoutes.some((route) => pathname.startsWith(route))
  ) {
    return NextResponse.next();
  }

  // Verify authentication
  const sessionCookie = request.cookies.get('session')?.value;
  const session = await decrypt(sessionCookie);

  if (!session?.userId) {
    // Redirect unauthenticated users to login
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Protect admin routes
  if (adminRoutes.some((route) => pathname.startsWith(route))) {
    if (session.role !== 'admin') {
      // Redirect unauthorized users to dashboard
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  // Attach session data to headers for downstream API routes to consume
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-user-id', session.userId);
  requestHeaders.set('x-user-email', session.email);
  requestHeaders.set('x-user-role', session.role);

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes - handled separately or inside if needed)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
