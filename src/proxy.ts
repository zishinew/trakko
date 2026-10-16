import { createServerClient } from '@supabase/ssr';
import { randomUUID } from 'node:crypto';
import { demoMode, configured } from '@/lib/config';
import { NextResponse, type NextRequest } from 'next/server';
export async function proxy(request: NextRequest) {
  if (!configured) {
    const value = request.cookies.get('offgrid_demo')?.value;
    if (demoMode && (!value || !/^[0-9a-f-]{36}$/.test(value))) {
      const id = randomUUID();
      request.cookies.set('offgrid_demo', id);
      const response = NextResponse.next({ request });
      response.cookies.set('offgrid_demo', id, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 86400 * 7,
      });
      return response;
    }
    return NextResponse.next();
  }
  let response = NextResponse.next({ request });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookieOptions: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
      },
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (list, headers) => {
          list.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          list.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
          Object.entries(headers ?? {}).forEach(([key, value]) => response.headers.set(key, value));
        },
      },
    },
  );
  await supabase.auth.getClaims();
  return response;
}
export const config = {
  matcher: [
    '/((?!api/uploads|_next/static|_next/image|favicon.ico|demo/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|wav)$).*)',
  ],
};
