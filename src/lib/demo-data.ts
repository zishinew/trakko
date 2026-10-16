import type { Workspace, License } from './types';
export const DEMO_STORE_ID = '10000000-0000-4000-8000-000000000001';
export const defaultTerms =
  'Non-exclusive license for one new musical recording. You may distribute up to 100,000 streams and 5,000 downloads. Credit the producer. No resale, sublicensing, sample redistribution, or Content ID registration. The producer retains copyright to the original instrumental. This license does not transfer ownership.';
export function defaultLicenses(storeId: string, beatId: string | null, base = 1999): License[] {
  return [
    { name: 'MP3 Lease', price_cents: base, deliverables: ['mp3'] },
    { name: 'WAV Lease', price_cents: base + 1000, deliverables: ['mp3', 'wav'] },
    { name: 'Trackout Lease', price_cents: base + 3000, deliverables: ['mp3', 'wav', 'stems'] },
  ].map((l, i) => ({
    ...l,
    id: beatId
      ? `30000000-0000-4000-8${beatId.slice(-3)}-00000000000${i + 1}`
      : `30000000-0000-4000-8000-00000000000${i + 1}`,
    store_id: storeId,
    beat_id: beatId,
    terms: defaultTerms,
    active: true,
  })) as License[];
}
export function demoWorkspace(): Workspace {
  const store = {
    id: DEMO_STORE_ID,
    owner_id: '10000000-0000-4000-8000-000000000002',
    username: 'ziova',
    display_name: 'ziova',
    bio: 'For the late nights & the early mornings.\nIndependent sounds from Toronto.',
    avatar_url: '/demo/avatar.svg',
    banner_url: '',
    accent: '#626270',
    theme: 'light' as const,
    instagram: 'https://instagram.com',
    youtube: 'https://youtube.com',
    website: '',
    published: true,
    created_at: '2026-09-01T12:00:00Z',
  };
  const names = ['eyesight', 'after hours', 'no signal', 'velvet', 'somewhere else', 'blue room'];
  const bpms = [142, 128, 156, 92, 135, 110];
  const keys = ['F♯ minor', 'C minor', 'D minor', 'A minor', 'G♯ minor', 'E minor'];
  const tags = [
    ['Melodic', 'Trap'],
    ['R&B', 'Dark'],
    ['Trap', 'Hard'],
    ['Soul', 'R&B'],
    ['Ambient', 'Trap'],
    ['Lo-fi', 'Jazz'],
  ];
  const beats = names.map((title, i) => ({
    id: `20000000-0000-4000-8000-00000000000${i + 1}`,
    store_id: store.id,
    title,
    bpm: bpms[i],
    musical_key: keys[i],
    tags: tags[i],
    description: 'An original instrumental sketch. Find your pocket.',
    cover_url: `/demo/cover-${i + 1}.svg`,
    preview_url: `/demo/preview-${i + 1}.mp3`,
    published: true,
    created_at: `2026-09-${String(25 - i * 3).padStart(2, '0')}T12:00:00Z`,
  }));
  const licenses = [
    ...defaultLicenses(store.id, null),
    ...beats.flatMap((b, i) =>
      defaultLicenses(store.id, b.id, [1999, 2499, 2999, 1999, 2499, 1499][i]),
    ),
  ];
  const files = beats.flatMap((b) =>
    (['mp3', 'wav', 'stems'] as const).map((kind, i) => ({
      id: `40000000-0000-4000-8${b.id.slice(-3)}-00000000000${i + 1}`,
      beat_id: b.id,
      store_id: store.id,
      kind,
      path: `demo/${b.id}/${kind}`,
      name: `${b.title.replaceAll(' ', '-')}.${kind === 'stems' ? 'zip' : kind}`,
      size: 0,
    })),
  );
  return {
    store,
    beats,
    licenses,
    files,
    orders: [],
    plays: [],
    stripe: null,
    tools: { promotions: [], bundles: [], collaborators: [] },
    contacts: [],
    events: [],
    mail_jobs: [],
  };
}
