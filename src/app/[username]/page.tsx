import { notFound } from 'next/navigation';
import { catalog } from '@/lib/data';
import { demoMode } from '@/lib/config';
import { Storefront } from '@/components/storefront';
export const dynamic = 'force-dynamic';
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ username: string }>;
  searchParams: Promise<{ beat?: string }>;
}) {
  const { username } = await params;
  const data = await catalog(username);
  if (!data) notFound();
  const { beat } = await searchParams;
  return <Storefront catalog={data} demo={demoMode} initialBeatId={beat} />;
}
export async function generateMetadata({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const data = await catalog(username);
  return {
    title: data ? `${data.store.display_name} — Beat store` : 'Store not found',
    description: data?.store.bio,
  };
}
