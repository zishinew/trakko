import { NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { z } from 'zod';
import { assertOrigin, apiError } from '@/lib/http';
import { demoMode } from '@/lib/config';
import { demoSession, mutateDemo, demoRoot } from '@/lib/demo';
import { ownedStore } from '@/lib/data';
import { supabaseAdmin } from '@/lib/supabase/server';
import { uploadSchema, validateUpload } from '@/lib/validation';
import type { FileKind } from '@/lib/types';
const publicKinds = ['preview', 'cover', 'avatar', 'banner'];
export async function POST(request: Request) {
  try {
    assertOrigin(request);
    if (demoMode && request.headers.get('content-type')?.includes('multipart/form-data')) {
      const form = await request.formData();
      const file = form.get('file');
      if (!(file instanceof File)) throw new Error('File is required');
      const input = uploadSchema.parse({
        beat_id: form.get('beat_id') || undefined,
        kind: form.get('kind'),
        name: file.name,
        size: file.size,
        content_type: file.type,
      });
      validateUpload(input.kind, file.name, file.size, file.type);
      if (file.size > 100 * 1024 * 1024) throw new Error('Demo uploads are limited to 100 MB');
      const session = await demoSession(true);
      const id = randomUUID();
      const path = `${session}/${id}.${file.name.split('.').pop()!.toLowerCase()}`;
      const content = Buffer.from(await file.arrayBuffer());
      await mutateDemo(session, async (state) => {
        const beat = state.beats.find((b) => b.id === input.beat_id);
        if (!['avatar', 'banner'].includes(input.kind) && !beat)
          throw new Error('Beat unavailable');
        await mkdir(join(demoRoot, session), { recursive: true });
        await writeFile(join(demoRoot, path), content);
        const url = `/api/demo-assets/${session}/${path.split('/')[1]}`;
        if (input.kind === 'avatar') state.store.avatar_url = url;
        else if (input.kind === 'banner') state.store.banner_url = url;
        else if (beat) {
          state.files = state.files.filter(
            (f) => !(f.beat_id === beat.id && f.kind === input.kind),
          );
          state.files.push({
            id,
            beat_id: beat.id,
            store_id: state.store.id,
            kind: input.kind,
            path,
            name: file.name,
            size: file.size,
          });
          if (input.kind === 'cover') beat.cover_url = url;
          if (input.kind === 'preview') beat.preview_url = url;
        }
      });
      return NextResponse.json({ ok: true, url: `/api/demo-assets/${path}` });
    }
    if (demoMode) throw new Error('Demo uploads require a file');
    const { store } = await ownedStore();
    const db = supabaseAdmin();
    const body = await request.json();
    if (body.finalize) {
      const id = z.uuid().parse(body.id);
      const { data: intent, error } = await db
        .from('upload_intents')
        .select('*')
        .eq('id', id)
        .eq('store_id', store.id)
        .single();
      if (error || !intent) throw new Error('Upload unavailable');
      if (Date.now() - Date.parse(intent.created_at) > 2 * 60 * 60 * 1000)
        throw new Error('Upload expired. Please upload again');
      const bucket = publicKinds.includes(intent.kind) ? 'preview-assets' : 'beat-deliverables';
      const { data: info, error: infoError } = await db.storage.from(bucket).info(intent.path);
      if (infoError || !info) throw new Error('Upload has not finished');
      const size = Number(info.size ?? info.metadata?.size);
      validateUpload(
        intent.kind,
        intent.name,
        size,
        info.contentType ?? info.metadata?.mimetype ?? '',
      );
      if (size !== intent.size) throw new Error('Upload size does not match');
      const url = db.storage.from(bucket).getPublicUrl(intent.path).data.publicUrl;
      if (intent.kind === 'avatar' || intent.kind === 'banner') {
        const { error: e } = await db
          .from('stores')
          .update(intent.kind === 'avatar' ? { avatar_url: url } : { banner_url: url })
          .eq('id', store.id);
        if (e) throw e;
      } else {
        if (!intent.beat_id) throw new Error('Beat unavailable');
        const { error: e } = await db.from('beat_files').upsert(
          {
            id,
            store_id: store.id,
            beat_id: intent.beat_id,
            kind: intent.kind as FileKind,
            path: intent.path,
            name: intent.name,
            size,
          },
          { onConflict: 'beat_id,kind' },
        );
        if (e) throw e;
        if (intent.kind === 'cover' || intent.kind === 'preview') {
          const { error: e2 } = await db
            .from('beats')
            .update(intent.kind === 'cover' ? { cover_url: url } : { preview_url: url })
            .eq('id', intent.beat_id)
            .eq('store_id', store.id);
          if (e2) throw e2;
        }
      }
      await db.from('upload_intents').delete().eq('id', id);
      return NextResponse.json({
        ok: true,
        url: publicKinds.includes(intent.kind) ? url : undefined,
      });
    }
    const input = uploadSchema.parse(body);
    validateUpload(input.kind, input.name, input.size, input.content_type);
    if (!['avatar', 'banner'].includes(input.kind)) {
      const { data: beat } = await db
        .from('beats')
        .select('id')
        .eq('id', input.beat_id || '')
        .eq('store_id', store.id)
        .maybeSingle();
      if (!beat) throw new Error('Beat unavailable');
    }
    const id = randomUUID();
    const path = `${store.owner_id}/${store.id}/${input.beat_id || 'store'}/${id}.${input.name.split('.').pop()!.toLowerCase()}`;
    const bucket = publicKinds.includes(input.kind) ? 'preview-assets' : 'beat-deliverables';
    const { error } = await db
      .from('upload_intents')
      .insert({ ...input, id, path, store_id: store.id, beat_id: input.beat_id || null });
    if (error) throw error;
    const { data, error: uploadError } = await db.storage.from(bucket).createSignedUploadUrl(path);
    if (uploadError) throw uploadError;
    return NextResponse.json({ id, url: data.signedUrl });
  } catch (e) {
    return apiError(e);
  }
}
