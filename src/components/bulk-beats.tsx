'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Beat, Workspace, FileKind, License } from '@/lib/types';
import { post, uploadFile } from '@/lib/client';
import { parsePrice } from '@/lib/business';
import { Button, Field, Modal, Notice } from './ui';
function stem(name: string) {
  return name
    .replace(/\.[^.]+$/, '')
    .replace(/[-_ ](preview|tagged|untagged|mp3|wav|stems)$/i, '')
    .toLowerCase();
}
export function BulkUploader({ demo, onClose }: { demo: boolean; onClose: () => void }) {
  const router = useRouter();
  const [previews, setPreviews] = useState<File[]>([]),
    [assets, setAssets] = useState<Partial<Record<FileKind, File[]>>>({}),
    [bpm, setBpm] = useState('140'),
    [key, setKey] = useState('C minor'),
    [tags, setTags] = useState(''),
    [publish, setPublish] = useState(false),
    [busy, setBusy] = useState(false),
    [messages, setMessages] = useState<string[]>([]),
    [error, setError] = useState('');
  const [created, setCreated] = useState<Record<string, Beat>>({});
  async function run(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    const log: string[] = [];
    const done = { ...created };
    try {
      for (const preview of previews) {
        if (done[preview.name]?.published) {
          log.push(`${preview.name}: already published`);
          continue;
        }
        let beat = done[preview.name];
        try {
          if (!beat) {
            beat = await post<Beat>('/api/manage', {
              action: 'beat',
              data: {
                title: preview.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' '),
                bpm: Number(bpm),
                musical_key: key,
                tags: tags
                  .split(',')
                  .map((t) => t.trim())
                  .filter(Boolean),
                description: '',
                published: false,
              },
            });
            done[preview.name] = beat;
            setCreated({ ...done });
          }
          await uploadFile(preview, 'preview', beat.id, demo);
          const included = new Set<string>();
          for (const [kind, files] of Object.entries(assets)) {
            const match = files?.find((f) => stem(f.name) === stem(preview.name));
            if (match) {
              await uploadFile(match, kind as FileKind, beat.id, demo);
              included.add(kind);
            }
          }
          // New licenses are copied on the server; obtain their IDs from the authenticated endpoint.
          const details = await post<{ licenses: License[] }>('/api/bulk', {
            action: 'licenses',
            id: beat.id,
          });
          let active = 0;
          for (const l of details.licenses) {
            const enable = l.deliverables.every((d) => included.has(d));
            if (enable) active++;
            await post('/api/manage', {
              action: 'license',
              id: l.id,
              beat_id: beat.id,
              data: { ...l, active: enable },
            });
          }
          if (publish) {
            if (!active)
              throw new Error(
                'Upload purchased files matching at least one license before publishing',
              );
            beat = await post<Beat>('/api/manage', {
              action: 'beat',
              id: beat.id,
              data: { ...beat, published: true },
            });
            done[preview.name] = beat;
            setCreated({ ...done });
          }
          log.push(
            `${preview.name}: ${publish ? 'published' : 'draft ready'} · ${included.size} matched files · ${active} available licenses`,
          );
        } catch (e) {
          log.push(
            `${preview.name}: ${(e as Error).message}. Draft retained; fix the files and retry.`,
          );
        }
        setMessages([...log]);
      }
      const unmatched = Object.values(assets)
        .flat()
        .filter((f): f is File => !!f)
        .filter((f) => !previews.some((p) => stem(p.name) === stem(f.name)));
      if (unmatched.length)
        log.push(`No matching preview: ${unmatched.map((f) => f.name).join(', ')}`);
      setMessages([...log]);
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal
      title="Bulk upload beats"
      onClose={() => {
        if (!busy) onClose();
      }}
      wide
    >
      <form onSubmit={run}>
        <p className="muted text-sm">
          Select up to 25 previews. Purchased files and covers match the preview’s filename without
          extensions; optional _preview, _untagged, _wav, or _stems suffixes are ignored. Files
          upload one beat at a time, and failed drafts can be retried.
        </p>
        <Field label="Preview MP3 files">
          <input
            type="file"
            accept="audio/mpeg"
            multiple
            required
            disabled={busy}
            onChange={(e) => {
              setPreviews(Array.from(e.target.files || []).slice(0, 25));
              setCreated({});
              setMessages([]);
            }}
          />
        </Field>
        <div className="form-two">
          <Field label="Default BPM">
            <input
              type="number"
              required
              min="30"
              max="300"
              value={bpm}
              onChange={(e) => setBpm(e.target.value)}
            />
          </Field>
          <Field label="Default musical key">
            <input value={key} onChange={(e) => setKey(e.target.value)} />
          </Field>
        </div>
        <Field label="Tags for these beats">
          <input
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="Trap, Melodic"
          />
        </Field>
        <div className="form-two">
          {(
            [
              ['mp3', 'Purchased MP3 files', 'audio/mpeg'],
              ['wav', 'Purchased WAV files', '.wav'],
              ['stems', 'Stems ZIP files', '.zip'],
              ['cover', 'Cover images', 'image/jpeg,image/png,image/webp'],
            ] as const
          ).map(([kind, label, accept]) => (
            <Field label={label} key={kind}>
              <input
                type="file"
                multiple
                accept={accept}
                disabled={busy}
                onChange={(e) =>
                  setAssets((a) => ({ ...a, [kind]: Array.from(e.target.files || []) }))
                }
              />
            </Field>
          ))}
        </div>
        <label className="check-row">
          <input
            type="checkbox"
            checked={publish}
            onChange={(e) => setPublish(e.target.checked)}
            disabled={busy}
          />
          Publish beats with complete files and licenses
        </label>
        {error && <Notice error>{error}</Notice>}
        {messages.length > 0 && (
          <div className="bulk-log" aria-live="polite">
            {messages.map((m, i) => (
              <p key={i}>{m}</p>
            ))}
          </div>
        )}
        <div className="modal-actions">
          <Button type="submit" busy={busy} disabled={!previews.length} className="primary">
            {Object.keys(created).length ? 'Retry / finish uploads' : 'Start bulk upload'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
export function BulkEditor({
  ids,
  data,
  onDone,
}: {
  ids: string[];
  data: Workspace;
  onDone: () => void;
}) {
  const router = useRouter();
  const [operation, setOperation] = useState('tags'),
    [value, setValue] = useState(''),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState('');
  async function apply() {
    setBusy(true);
    const results: string[] = [];
    for (const id of ids) {
      const beat = data.beats.find((b) => b.id === id);
      if (!beat) continue;
      try {
        if (operation === 'price') {
          const cents = parsePrice(value);
          for (const l of data.licenses.filter((l) => l.beat_id === id && l.active))
            await post('/api/manage', {
              action: 'license',
              id: l.id,
              beat_id: id,
              data: { ...l, price_cents: cents },
            });
        } else
          await post('/api/manage', {
            action: 'beat',
            id,
            data: {
              ...beat,
              ...(operation === 'tags'
                ? {
                    tags: value
                      .split(',')
                      .map((t) => t.trim())
                      .filter(Boolean),
                  }
                : operation === 'publish'
                  ? { published: true, release_at: null }
                  : { published: false, release_at: null }),
            },
          });
        results.push(`${beat.title}: updated`);
      } catch (e) {
        results.push(`${beat.title}: ${(e as Error).message}`);
      }
    }
    setMessage(results.join(' · '));
    setBusy(false);
    router.refresh();
  }
  return (
    <section className="bulk-bar">
      <strong>{ids.length} selected</strong>
      <select
        aria-label="Bulk action"
        value={operation}
        onChange={(e) => setOperation(e.target.value)}
      >
        <option value="tags">Replace tags</option>
        <option value="price">Set all active license prices</option>
        <option value="publish">Publish now</option>
        <option value="unpublish">Unpublish</option>
      </select>
      {['tags', 'price'].includes(operation) && (
        <input
          aria-label="Bulk value"
          placeholder={operation === 'price' ? 'Price in USD' : 'Comma-separated tags'}
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
      )}
      <Button busy={busy} onClick={apply}>
        Apply to selected
      </Button>
      <Button disabled={busy} onClick={onDone}>
        Clear selection
      </Button>
      {message && <p role="status">{message}</p>}
    </section>
  );
}
