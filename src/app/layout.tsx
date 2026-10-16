import type { Metadata, Viewport } from 'next';
import { brand } from '@/lib/brand';
import './globals.css';
import localFont from 'next/font/local';
const bodyFont = localFont({
  src: './fonts/Inter.ttf',
  variable: '--font-body',
  display: 'swap',
  weight: '100 900',
});
const displayFont = localFont({
  src: './fonts/Inter.ttf',
  variable: '--font-display',
  display: 'swap',
  weight: '100 900',
});
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  interactiveWidget: 'resizes-content',
  themeColor: '#09090b',
};

export const metadata: Metadata = {
  title: { default: `${brand.name} — Your beat store. Free.`, template: `%s · ${brand.name}` },
  description:
    'Your sound. Your storefront. Upload your beats and start selling. No subscriptions. No paid plans.',
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${bodyFont.variable} ${displayFont.variable}`}>
      <body>{children}</body>
    </html>
  );
}
