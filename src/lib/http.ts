import 'server-only';
import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { appUrl } from './config';
export function assertOrigin(request: Request) {
  const origin = request.headers.get('origin');
  if (!origin || origin !== appUrl()) throw new Error('Invalid request origin');
}
export function apiError(error: unknown) {
  const message =
    error instanceof ZodError
      ? error.issues.map((i) => i.message).join('. ')
      : error instanceof Error
        ? error.message
        : 'Something went wrong';
  const safe =
    /^(Please log in|Create your store first|Invalid|Unsupported|This |License |Beat |Store |Upload |File |Price |Enter |Payments |Demo |Checkout |Choose |Cannot |Connect |Username )/.test(
      message,
    ) || error instanceof ZodError;
  if (!safe) console.error(error);
  return NextResponse.json(
    { error: safe ? message : 'Unable to complete this request. Please try again.' },
    { status: message === 'Please log in' ? 401 : 400 },
  );
}
