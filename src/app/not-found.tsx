import Link from 'next/link';
import { Logo } from '@/components/ui';
export default function NotFound() {
  return (
    <main className="error-page">
      <Logo />
      <span className="eyebrow">404 / OFF THE RECORD</span>
      <h1>This sound isn’t here.</h1>
      <p>The store or purchase link may be private or unavailable.</p>
      <Link className="button primary" href="/">
        Back home
      </Link>
    </main>
  );
}
