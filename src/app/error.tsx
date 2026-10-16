'use client';
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="error-page">
      <span className="eyebrow">LET’S TRY THAT AGAIN</span>
      <h1>Something skipped a beat.</h1>
      <p>We couldn’t load this page. Check your connection and try again.</p>
      <button className="button primary" onClick={reset}>
        Try again
      </button>
    </main>
  );
}
