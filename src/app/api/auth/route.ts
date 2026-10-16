import { NextResponse } from 'next/server';
import { z } from 'zod';
import { assertOrigin, apiError } from '@/lib/http';
import { demoMode, appUrl } from '@/lib/config';
import { demoSession } from '@/lib/demo';
import { supabaseServer } from '@/lib/supabase/server';
export async function POST(request: Request) {
  try {
    assertOrigin(request);
    const body = await request.json();
    const action = z
      .enum(['signup', 'login', 'logout', 'reset', 'password', 'demo'])
      .parse(body.action);
    if (demoMode) {
      if (action === 'demo') {
        await demoSession(true);
        return NextResponse.json({ url: '/onboarding' });
      }
      if (action === 'logout') {
        const jar = await (await import('next/headers')).cookies();
        jar.delete('offgrid_demo');
        return NextResponse.json({ url: '/' });
      }
      throw new Error(
        'Demo mode does not create accounts or send emails. Configure Supabase to enable authentication',
      );
    }
    const db = await supabaseServer();
    if (action === 'logout') {
      const { error } = await db.auth.signOut();
      if (error) throw error;
      return NextResponse.json({ url: '/' });
    }
    if (action === 'password') {
      const password = z.string().min(10).max(128).parse(body.password);
      const {
        data: { user },
        error: authError,
      } = await db.auth.getUser();
      if (authError || !user) throw new Error('Please log in');
      const { error } = await db.auth.updateUser({ password });
      if (error) throw error;
      return NextResponse.json({ url: '/dashboard/settings' });
    }
    const email = z.email().max(254).parse(body.email);
    if (action === 'reset') {
      const { error } = await db.auth.resetPasswordForEmail(email, {
        redirectTo: `${appUrl()}/auth/callback?next=/update-password`,
      });
      if (error) throw error;
      return NextResponse.json({
        message: 'If an account exists, a reset link is on its way. Check your email.',
      });
    }
    const password = z.string().min(10).max(128).parse(body.password);
    const { data, error } =
      action === 'signup'
        ? await db.auth.signUp({
            email,
            password,
            options: { emailRedirectTo: `${appUrl()}/auth/callback?next=/onboarding` },
          })
        : await db.auth.signInWithPassword({ email, password });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    if (!data.session)
      return NextResponse.json({
        message: 'Check your email to confirm your account, then create your store.',
      });
    return NextResponse.json({ url: action === 'signup' ? '/onboarding' : '/dashboard' });
  } catch (e) {
    return apiError(e);
  }
}
