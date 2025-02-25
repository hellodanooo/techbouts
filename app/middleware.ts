// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  
  // Handle CORS for API routes
  if (path.startsWith('/api/')) {
    // For OPTIONS requests (preflight)
    if (request.method === 'OPTIONS') {
      const origin = request.headers.get('origin') || '*';
      
      return new NextResponse(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': origin,
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Embedded-Origin',
          'Access-Control-Max-Age': '86400',
          'Access-Control-Allow-Credentials': 'true',
        },
      });
    }
    
    // For regular API requests, add CORS headers to the response
    const origin = request.headers.get('origin') || '*';
    const response = NextResponse.next();
    
    response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    
    return response;
  }
    
  return NextResponse.next();
}

// Update the matcher to include both API and promoter routes
export const config = {
  matcher: ['/api/:path*',],
};