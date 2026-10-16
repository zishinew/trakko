import 'server-only';
import { percentToBasisPoints } from './business';
export const configured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
);
export const demoMode =
  !process.env.NEXT_PUBLIC_SUPABASE_URL &&
  !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY &&
  (process.env.NODE_ENV !== 'production' || process.env.ALLOW_DEMO === 'true');
export const feeBasisPoints = () => percentToBasisPoints(process.env.PLATFORM_FEE_PERCENT || '8');
export function appUrl() {
  const url = process.env.APP_URL || 'http://localhost:3000';
  if (process.env.NODE_ENV === 'production' && !process.env.APP_URL)
    throw new Error('APP_URL is required in production');
  return new URL(url).origin;
}
