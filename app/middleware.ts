// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  
  if (path.startsWith('/promoter/')) {
    try {
      const session = request.cookies.get('session');
      
      if (!session) {
        const url = new URL('/auth/login', request.url);
        url.searchParams.set('callbackUrl', path);
        return NextResponse.redirect(url);
      }
    } catch (error) {
      console.error('Auth middleware error:', error);
      const url = new URL('/auth/login', request.url);
      return NextResponse.redirect(url);
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: '/promoter/:path*',
};