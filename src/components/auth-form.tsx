'use client';
import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, ArrowLeft } from 'lucide-react';
import { Logo, Button, Field, Notice } from './ui';
import { post } from '@/lib/client';
type Mode = 'signup' | 'login' | 'reset' | 'password';
export function AuthForm({ mode, demo }: { mode: Mode; demo: boolean }) {
  const [email, setEmail] = useState(''),
    [password, setPassword] = useState(''),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState(''),
    [error, setError] = useState('');
  const titles = {
    signup: 'Your sound starts here.',
    login: 'Back to your sound.',
    reset: 'Let’s get you back in.',
    password: 'A fresh password.',
  };
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const result = await post<{ url?: string; message?: string }>('/api/auth', {
        action: demo ? 'demo' : mode,
        email,
        password,
      });
      if (result.url) window.location.assign(result.url);
      else setMessage(result.message || 'Saved.');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="auth-page">
      <Link href="/" className="auth-back">
        <ArrowLeft size={15} /> Home
      </Link>
      <div className="auth-card">
        <Logo />
        <h1>{titles[mode]}</h1>
        <p>
          {mode === 'signup'
            ? 'A home for your beats. No monthly bill.'
            : mode === 'login'
              ? 'Log in to your producer dashboard.'
              : mode === 'reset'
                ? 'Enter your email to receive a reset link.'
                : 'Choose a password with at least 10 characters.'}
        </p>
        {demo ? (
          <Notice>
            Local demo · Accounts and email are disabled until Supabase is configured. Explore a
            private demo workspace below.
          </Notice>
        ) : null}
        <form onSubmit={submit}>
          {!demo && (
            <>
              {mode !== 'password' && (
                <Field label="Email">
                  <input
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                  />
                </Field>
              )}
              {mode !== 'reset' && (
                <Field label="Password" hint="At least 10 characters.">
                  <input
                    type="password"
                    autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                    required
                    minLength={10}
                    maxLength={128}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </Field>
              )}
            </>
          )}
          {error && <Notice error>{error}</Notice>}
          {message && <Notice>{message}</Notice>}
          <Button type="submit" busy={busy} className="primary full">
            {demo
              ? 'Enter demo workspace'
              : mode === 'signup'
                ? 'Create account'
                : mode === 'login'
                  ? 'Log in'
                  : mode === 'reset'
                    ? 'Send reset link'
                    : 'Save password'}
            <ArrowRight size={16} />
          </Button>
        </form>
        {mode === 'login' && (
          <Link className="auth-link" href="/reset-password">
            Forgot your password?
          </Link>
        )}
        <p className="auth-switch">
          {mode === 'signup' ? 'Already have a store?' : 'New here?'}{' '}
          <Link href={mode === 'signup' ? '/login' : '/signup'}>
            {mode === 'signup' ? 'Log in' : 'Create your store'}
          </Link>
        </p>
      </div>
    </main>
  );
}
