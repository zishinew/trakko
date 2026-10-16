import 'server-only';
import { cookies } from 'next/headers';
import { randomUUID } from 'node:crypto';
import { readFile, writeFile, mkdir, rename } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { emptyTools } from './tools';
import { demoWorkspace } from './demo-data';
import { demoMode } from './config';
import type { Workspace } from './types';
export const demoRoot = join(tmpdir(), 'offgrid-demo-v1');
export async function demoSession(create = false) {
  if (!demoMode) throw new Error('Demo mode is disabled');
  const jar = await cookies();
  const value = jar.get('offgrid_demo')?.value;
  if (value && /^[0-9a-f-]{36}$/.test(value)) return value;
  if (!create) return 'default';
  const id = randomUUID();
  jar.set('offgrid_demo', id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 86400 * 7,
  });
  return id;
}
export async function readDemo(id: string): Promise<Workspace> {
  try {
    const state = JSON.parse(await readFile(join(demoRoot, `${id}.json`), 'utf8'));
    return {
      ...state,
      store: {
        ...state.store,
        accent: state.store.accent === '#177965' ? '#626270' : state.store.accent,
      },
      tools: state.tools || emptyTools(),
      contacts: state.contacts || [],
      events: state.events || [],
      mail_jobs: state.mail_jobs || [],
    };
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === 'ENOENT') return demoWorkspace();
    throw e;
  }
}
let queue: Promise<unknown> = Promise.resolve();
export async function mutateDemo<T>(
  id: string,
  change: (state: Workspace) => T | Promise<T>,
): Promise<T> {
  const run = queue.then(async () => {
    const state = await readDemo(id);
    const result = await change(state);
    await mkdir(demoRoot, { recursive: true });
    const temp = join(demoRoot, `${id}.${randomUUID()}.tmp`);
    await writeFile(temp, JSON.stringify(state));
    await rename(temp, join(demoRoot, `${id}.json`));
    return result;
  });
  queue = run.catch(() => {});
  return run;
}
