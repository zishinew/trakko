import { NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { assertOrigin, apiError } from '@/lib/http';
import { demoMode } from '@/lib/config';
import { demoSession, mutateDemo } from '@/lib/demo';
import { producer, ownedStore, hydrateLicenses } from '@/lib/data';
import { beatSchema, licenseSchema, storeSchema } from '@/lib/validation';
import { defaultLicenses } from '@/lib/demo-data';
import { licenseFiles } from '@/lib/business';
import type { License } from '@/lib/types';
export async function POST(request: Request) {
  try {
    assertOrigin(request);
    const body = await request.json();
    const action = z
      .enum(['store', 'beat', 'delete-beat', 'license', 'delete-license'])
      .parse(body.action);
    const id = body.id ? z.uuid().parse(body.id) : randomUUID();
    if (demoMode) {
      const session = await demoSession(true);
      const result = await mutateDemo(session, (state) => {
        if (action === 'store') {
          const input = storeSchema.parse(body.data);
          state.store = { ...state.store, ...input };
          return state.store;
        }
        if (action === 'delete-beat') {
          state.beats = state.beats.filter((b) => b.id !== id);
          state.licenses = state.licenses.filter((l) => l.beat_id !== id);
          // Files remain for already-purchased order snapshots.
          return { id };
        }
        if (action === 'beat') {
          const input = beatSchema.parse(body.data);
          const existing = state.beats.find((b) => b.id === id);
          if (input.published && !existing?.preview_url)
            throw new Error('Upload a preview before publishing');
          if (input.published) {
            const active = state.licenses.filter((l) => l.beat_id === id && l.active);
            if (!active.length) throw new Error('Choose at least one active license');
            active.forEach((l) => licenseFiles(l, state.files));
          }
          const beat = {
            id,
            store_id: state.store.id,
            cover_url: '',
            preview_url: '',
            created_at: new Date().toISOString(),
            ...existing,
            ...input,
          };
          state.beats = [beat, ...state.beats.filter((b) => b.id !== id)];
          if (!existing)
            state.licenses.push(
              ...state.licenses
                .filter((l) => l.beat_id === null)
                .map((l) => ({ ...l, id: randomUUID(), beat_id: id })),
            );
          return beat;
        }
        if (action === 'delete-license') {
          state.licenses = state.licenses.filter((l) => l.id !== id);
          return { id };
        }
        const input = licenseSchema.parse(body.data);
        const beatId = body.beat_id ? z.uuid().parse(body.beat_id) : null;
        if (beatId && !state.beats.some((b) => b.id === beatId))
          throw new Error('Beat unavailable');
        const license: License = { ...input, id, store_id: state.store.id, beat_id: beatId };
        state.licenses = [...state.licenses.filter((l) => l.id !== id), license];
        return license;
      });
      return NextResponse.json(result);
    }
    if (action === 'store') {
      const { db, user } = await producer();
      const input = storeSchema.parse(body.data);
      const { data: existing, error: lookupError } = await db
        .from('stores')
        .select('*')
        .eq('owner_id', user.id)
        .maybeSingle();
      if (lookupError) throw lookupError;
      // Asset URLs can only be set by the validated upload endpoint.
      if (
        input.avatar_url !== (existing?.avatar_url || '') ||
        input.banner_url !== (existing?.banner_url || '')
      )
        throw new Error('Invalid asset URL');
      const { data: store, error } = existing
        ? await db.from('stores').update(input).eq('id', existing.id).select().single()
        : await db
            .from('stores')
            .insert({ ...input, owner_id: user.id })
            .select()
            .single();
      if (error) {
        if (error.code === '23505') throw new Error('Username is already taken');
        throw error;
      }
      if (!existing) {
        await db.from('profiles').upsert({ id: user.id, email: user.email || '' });
        for (const l of defaultLicenses(store.id, null)) {
          const { deliverables, ...data } = l;
          const { error: e } = await db.rpc('save_license', {
            payload: { ...data, id: randomUUID() },
            included: deliverables,
          });
          if (e) throw e;
        }
      }
      return NextResponse.json(store);
    }
    const { db, store } = await ownedStore();
    if (action === 'beat' || action === 'delete-beat') {
      const { data: existing } = await db
        .from('beats')
        .select('*')
        .eq('id', id)
        .eq('store_id', store.id)
        .maybeSingle();
      if (body.id && !existing) throw new Error('Beat unavailable');
      if (action === 'delete-beat') {
        const { error } = await db.from('beats').delete().eq('id', id).eq('store_id', store.id);
        if (error) throw error;
        return NextResponse.json({ id });
      }
      const input = beatSchema.parse(body.data);
      if (input.published) {
        if (!existing?.preview_url) throw new Error('Upload a preview before publishing');
        const licenses = (await hydrateLicenses(store.id, db)).filter(
          (l) => l.beat_id === id && l.active,
        );
        if (!licenses.length) throw new Error('Choose at least one active license');
        const { data: files, error } = await db.from('beat_files').select('*').eq('beat_id', id);
        if (error) throw error;
        licenses.forEach((l) => licenseFiles(l, files || []));
      }
      const { data: beat, error } = existing
        ? await db
            .from('beats')
            .update(input)
            .eq('id', id)
            .eq('store_id', store.id)
            .select()
            .single()
        : await db
            .from('beats')
            .insert({ ...input, id, store_id: store.id })
            .select()
            .single();
      if (error) throw error;
      if (!existing) {
        const templates = (await hydrateLicenses(store.id, db)).filter((l) => !l.beat_id);
        for (const l of templates) {
          const { deliverables, ...data } = l;
          const { error: e } = await db.rpc('save_license', {
            payload: { ...data, id: randomUUID(), beat_id: id },
            included: deliverables,
          });
          if (e) throw e;
        }
      }
      return NextResponse.json(beat);
    }
    const { data: existing } = await db
      .from('licenses')
      .select('*')
      .eq('id', id)
      .eq('store_id', store.id)
      .maybeSingle();
    if (body.id && !existing) throw new Error('License unavailable');
    if (action === 'delete-license') {
      const { error } = await db.from('licenses').delete().eq('id', id).eq('store_id', store.id);
      if (error) throw error;
      return NextResponse.json({ id });
    }
    const input = licenseSchema.parse(body.data);
    const beatId = existing?.beat_id ?? (body.beat_id ? z.uuid().parse(body.beat_id) : null);
    if (beatId) {
      const { data: beat } = await db
        .from('beats')
        .select('id')
        .eq('id', beatId)
        .eq('store_id', store.id)
        .maybeSingle();
      if (!beat) throw new Error('Beat unavailable');
    }
    const { deliverables, ...data } = input;
    const { error } = await db.rpc('save_license', {
      payload: { ...data, id, store_id: store.id, beat_id: beatId },
      included: deliverables,
    });
    if (error) throw error;
    return NextResponse.json({ id });
  } catch (e) {
    return apiError(e);
  }
}
