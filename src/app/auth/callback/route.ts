import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { appUrl } from '@/lib/config';
export async function GET(request: Request) {
  const url = new URL(request.url),
    code = url.searchParams.get('code');
  const next = url.searchParams.get('next');
  const target = next === '/update-password' ? next : '/onboarding';
  if (code) {
    const db = await supabaseServer();
    const { error } = await db.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${appUrl()}${target}`);
  }
  return NextResponse.redirect(`${appUrl()}/login?error=confirmation`);
}
