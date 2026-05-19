import { type NextRequest, NextResponse } from 'next/server';
import { createMiddlewareSupabaseClient } from '@/lib/db/middleware';
import { applyCors, handleCorsPreflight } from '@/lib/security/cors';
import { incrementRateLimit } from '@/lib/redis/client';
import { env } from '@/lib/env';

const publicPaths = ['/login', '/register', '/callback'];
const adminPaths = ['/settings/team'];
const apiPaths = ['/api/'];

const securityHeaders: Record<string, string> = {
  'X-DNS-Prefetch-Control': 'on',
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy':
    'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
  'X-XSS-Protection': '0',
};

if (env.CSP_POLICY) {
  securityHeaders['Content-Security-Policy'] = env.CSP_POLICY;
}

export async function middleware(request: NextRequest) {
  const preflight = handleCorsPreflight(request);
  if (preflight) return preflight;

  const { supabase, response } = createMiddlewareSupabaseClient(request);

  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const pathname = request.nextUrl.pathname;
  const isApiPath = apiPaths.some((p) => pathname.startsWith(p));
  const isPublicPath = publicPaths.some((p) => pathname.startsWith(p));
  const isDashboardPath = pathname.startsWith('/dashboard') || pathname === '/';
  const isAdminPath = adminPaths.some((p) => pathname.startsWith(p));
  const isRootPath = pathname === '/';

  if (isApiPath && session) {
    const rateLimitResult = await incrementRateLimit(
      session.user.id,
      env.RATE_LIMIT_WINDOW_MS
    );

    response.headers.set('X-RateLimit-Limit', String(env.RATE_LIMIT_MAX_REQUESTS));
    response.headers.set('X-RateLimit-Remaining', String(rateLimitResult.remaining));
    response.headers.set('X-RateLimit-Reset', String(rateLimitResult.resetAt));

    if (rateLimitResult.count > env.RATE_LIMIT_MAX_REQUESTS) {
      return new NextResponse(
        JSON.stringify({ error: 'Rate limit exceeded. Try again later.' }),
        { status: 429, headers: { 'Content-Type': 'application/json' } }
      );
    }
  }

  if (session) {
    const lastActivity = request.cookies.get('last_activity')?.value;
    if (lastActivity) {
      const elapsed = Date.now() - parseInt(lastActivity, 10);
      const maxAge = env.SESSION_MAX_AGE * 1000;

      if (elapsed > maxAge && !isPublicPath) {
        const redirectUrl = new URL('/login', request.url);
        redirectUrl.searchParams.set('reason', 'session_expired');
        const expiredResponse = NextResponse.redirect(redirectUrl);
        expiredResponse.cookies.delete('sb-token');
        return expiredResponse;
      }
    }

    response.cookies.set('last_activity', String(Date.now()), {
      maxAge: env.SESSION_MAX_AGE,
      path: '/',
      httpOnly: true,
      secure: env.NEXT_PUBLIC_APP_ENV === 'production',
      sameSite: 'lax',
    });
  }

  if (!session && !isPublicPath && isDashboardPath) {
    const redirectUrl = new URL('/login', request.url);
    redirectUrl.searchParams.set('redirectTo', pathname);
    return NextResponse.redirect(redirectUrl);
  }

  if (session && (isPublicPath || isRootPath)) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  if (session && isAdminPath) {
    const { data: user } = await supabase
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (user?.role !== 'admin') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  return applyCors(request, response);
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|manifest.json|sw.js|icons|robots.txt|sitemap.xml).*)',
  ],
};
