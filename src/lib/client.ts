import type { FileKind } from './types';
export async function post<T = Record<string, unknown>>(url: string, body: unknown): Promise<T> {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || 'Unable to complete this request');
  return result as T;
}
export async function uploadFile(
  file: File,
  kind: FileKind,
  beatId: string | undefined,
  demo: boolean,
) {
  if (demo) {
    const form = new FormData();
    form.set('file', file);
    form.set('kind', kind);
    if (beatId) form.set('beat_id', beatId);
    const response = await fetch('/api/uploads', { method: 'POST', body: form });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error);
    return result as { url?: string };
  }
  const { id, url } = await post<{ id: string; url: string }>('/api/uploads', {
    beat_id: beatId,
    kind,
    name: file.name,
    size: file.size,
    content_type: file.type,
  });
  const response = await fetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': file.type, 'x-upsert': 'false' },
    body: file,
  });
  if (!response.ok) throw new Error('Upload failed. Please try again');
  return await post<{ url?: string }>('/api/uploads', { finalize: true, id });
}
