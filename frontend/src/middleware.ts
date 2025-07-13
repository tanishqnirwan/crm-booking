import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Define protected routes that require authentication
const protectedRoutes = ['/user', '/facilitator', '/events'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Only check for basic authentication on protected routes
  // Let client-side handle role-based redirects
  if (protectedRoutes.some(route => pathname.startsWith(route))) {
    // For now, let the client-side handle auth checks
    // This prevents the middleware from interfering with client-side auth state
    return NextResponse.next();
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
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}; 