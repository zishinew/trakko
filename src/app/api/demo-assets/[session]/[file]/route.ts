import { demoMode } from '@/lib/config';
import { demoRoot, readDemo } from '@/lib/demo';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ session: string; file: string }> },
) {
  if (!demoMode) return new Response('Not found', { status: 404 });
  const { session, file } = await params;
  if (!/^[0-9a-f-]{36}$/.test(session) || !/^[0-9a-f-]{36}\.(mp3|jpg|jpeg|png|webp)$/.test(file))
    return new Response('Not found', { status: 404 });
  const state = await readDemo(session);
  const path = `${session}/${file}`;
  const allowed =
    state.files.some((f) => f.path === path && ['cover', 'preview'].includes(f.kind)) ||
    [state.store.avatar_url, state.store.banner_url].some(
      (url) => url === `/api/demo-assets/${path}`,
    );
  if (!allowed) return new Response('Not found', { status: 404 });
  try {
    const bytes = await readFile(join(demoRoot, path));
    const ext = file.split('.').pop();
    return new Response(bytes, {
      headers: {
        'Content-Type':
          ext === 'mp3'
            ? 'audio/mpeg'
            : ext === 'jpg' || ext === 'jpeg'
              ? 'image/jpeg'
              : `image/${ext}`,
        'Cache-Control': 'public,max-age=3600',
      },
    });
  } catch {
    return new Response('Not found', { status: 404 });
  }
}
