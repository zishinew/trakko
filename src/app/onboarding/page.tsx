import { redirect } from 'next/navigation';
import { StoreEditor } from '@/components/store-editor';
import { demoMode } from '@/lib/config';
import { producer } from '@/lib/data';
import { demoSession, readDemo } from '@/lib/demo';
import { demoWorkspace } from '@/lib/demo-data';
export const dynamic = 'force-dynamic';
export default async function Page() {
  if (demoMode) return <StoreEditor data={await readDemo(await demoSession())} demo onboarding />;
  const { db, user } = await producer().catch(() => redirect('/login'));
  const { data: store } = await db
    .from('stores')
    .select('id')
    .eq('owner_id', user.id)
    .maybeSingle();
  if (store) redirect('/dashboard');
  const data = demoWorkspace();
  data.beats = [];
  data.licenses = [];
  data.files = [];
  data.store = {
    ...data.store,
    id: '',
    owner_id: user.id,
    username: '',
    display_name: '',
    bio: '',
    avatar_url: '',
    instagram: '',
    youtube: '',
  };
  return <StoreEditor data={data} demo={false} onboarding />;
}
