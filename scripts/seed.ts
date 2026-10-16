import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import sharp from 'sharp';
import { demoWorkspace } from '../src/lib/demo-data';
import type { Database } from '../src/lib/supabase/database';
try {
  process.loadEnvFile('.env.local');
} catch {
  /* CI may supply environment directly. */
}
async function seed() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL,
    key = process.env.SUPABASE_SERVICE_ROLE_KEY,
    email = process.env.SEED_EMAIL,
    password = process.env.SEED_PASSWORD;
  if (!url || !key || !email || !password || password.length < 10)
    throw new Error(
      'Set Supabase URL, service-role key, SEED_EMAIL, and a SEED_PASSWORD of at least 10 characters. Use a test project.',
    );
  const db = createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const data = demoWorkspace();
  const { data: existing, error: lookupError } = await db
    .from('stores')
    .select('*')
    .eq('username', 'ziova')
    .maybeSingle();
  if (lookupError) throw lookupError;
  let userId: string;
  if (existing) {
    const {
      data: { user },
      error,
    } = await db.auth.admin.getUserById(existing.owner_id);
    if (error || user?.email !== email)
      throw new Error('The ziova username belongs to a different account. Seed aborted.');
    userId = existing.owner_id;
    data.store.id = existing.id;
  } else {
    const {
      data: { user },
      error,
    } = await db.auth.admin.createUser({ email, password, email_confirm: true });
    if (error || !user)
      throw error || new Error('Unable to create seed producer. Use an unused SEED_EMAIL.');
    userId = user.id;
  }
  const { error: profileError } = await db.from('profiles').upsert({ id: userId, email });
  if (profileError) throw profileError;
  async function upload(bucket: string, path: string, bytes: Buffer, mime: string) {
    const { error } = await db.storage
      .from(bucket)
      .upload(path, bytes, { contentType: mime, upsert: true });
    if (error) throw error;
    return db.storage.from(bucket).getPublicUrl(path).data.publicUrl;
  }
  const prefix = `${userId}/${data.store.id}`;
  data.store.owner_id = userId;
  data.store.avatar_url = await upload(
    'preview-assets',
    `${prefix}/avatar.png`,
    await sharp(await readFile('public/demo/avatar.svg'))
      .png()
      .toBuffer(),
    'image/png',
  );
  const { error: storeError } = await db.from('stores').upsert(data.store);
  if (storeError) throw storeError;
  for (const [i, beat] of data.beats.entries()) {
    beat.store_id = data.store.id;
    beat.cover_url = await upload(
      'preview-assets',
      `${prefix}/${beat.id}/cover.png`,
      await sharp(await readFile(`public/demo/cover-${i + 1}.svg`))
        .png()
        .toBuffer(),
      'image/png',
    );
    beat.preview_url = await upload(
      'preview-assets',
      `${prefix}/${beat.id}/preview.mp3`,
      await readFile(`public/demo/preview-${i + 1}.mp3`),
      'audio/mpeg',
    );
    const { error } = await db.from('beats').upsert(beat);
    if (error) throw error;
    for (const kind of ['mp3', 'wav', 'stems'] as const) {
      const extension = kind === 'stems' ? 'zip' : kind,
        bytes = await readFile(`demo-private/sample.${extension}`),
        path = `${prefix}/${beat.id}/sample.${extension}`;
      await upload(
        'beat-deliverables',
        path,
        bytes,
        kind === 'mp3' ? 'audio/mpeg' : kind === 'wav' ? 'audio/wav' : 'application/zip',
      );
      const { error: e } = await db
        .from('beat_files')
        .upsert(
          {
            id: randomUUID(),
            beat_id: beat.id,
            store_id: data.store.id,
            kind,
            path,
            name: `${beat.title.replaceAll(' ', '-')}.${extension}`,
            size: bytes.length,
          },
          { onConflict: 'beat_id,kind' },
        );
      if (e) throw e;
    }
  }
  for (const license of data.licenses) {
    const { deliverables, ...payload } = license;
    payload.store_id = data.store.id;
    const { error } = await db.rpc('save_license', { payload, included: deliverables });
    if (error) throw error;
  }
  console.log(
    'Seed complete. Log in with SEED_EMAIL / SEED_PASSWORD and open /ziova. Connect a Stripe test account before purchasing.',
  );
}
seed().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exitCode = 1;
});
