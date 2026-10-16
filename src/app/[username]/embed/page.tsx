import { notFound } from 'next/navigation';
import { catalog } from '@/lib/data';
import { demoMode } from '@/lib/config';
import { Storefront } from '@/components/storefront';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Embedded beat store', robots: { index: false, follow: false } };
export default async function Page({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const data = await catalog(username);
  if (!data) notFound();
  return <Storefront catalog={data} demo={demoMode} embedded />;
}
