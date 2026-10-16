'use client';
import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, Plus, ArrowUpRight, Pencil, Trash2, ChevronDown } from 'lucide-react';
import type { Workspace, Beat } from '@/lib/types';
import { post } from '@/lib/client';
import { money } from '@/lib/business';
import { PageHeading } from './dashboard-shell';
import { Button, Modal, Notice, Empty } from './ui';
import { BulkUploader, BulkEditor } from './bulk-beats';
import { BeatEditor } from './beat-editor';
export function BeatManager({ data, demo }: { data: Workspace; demo: boolean }) {
  const params = useSearchParams(),
    router = useRouter();
  const [selected, setSelected] = useState<Beat | 'new' | null>(
      params.get('upload') ? 'new' : null,
    ),
    [query, setQuery] = useState(''),
    [status, setStatus] = useState('all'),
    [error, setError] = useState(''),
    [deleting, setDeleting] = useState<Beat | null>(null),
    [busy, setBusy] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false),
    [bulkIds, setBulkIds] = useState<string[]>([]);
  const beats = data.beats.filter(
    (b) =>
      `${b.title} ${b.tags.join(' ')}`.toLowerCase().includes(query.toLowerCase()) &&
      (status === 'all' ||
        (status === 'scheduled'
          ? b.published &&
            !!b.release_at &&
            Date.parse(b.release_at) > Date.parse(data.as_of || '1970-01-01')
          : b.published === (status === 'published'))),
  );
  async function toggle(beat: Beat) {
    setError('');
    try {
      await post('/api/manage', {
        action: 'beat',
        id: beat.id,
        data: { ...beat, published: !beat.published },
      });
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    }
  }
  async function remove() {
    if (!deleting) return;
    setBusy(true);
    try {
      await post('/api/manage', { action: 'delete-beat', id: deleting.id });
      setDeleting(null);
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const current =
    selected && selected !== 'new'
      ? data.beats.find((b) => b.id === selected.id) || selected
      : null;
  return (
    <>
      <PageHeading
        eyebrow="THE LIBRARY"
        title="Your beats."
        description="Good music deserves to be heard. Give it a home."
      >
        <Button onClick={() => setBulkOpen(true)}>Bulk upload</Button>
        <Button className="primary" onClick={() => setSelected('new')}>
          <Plus size={16} /> Upload beat
        </Button>
      </PageHeading>
      <div className="library-toolbar">
        <div className="search-input">
          <Search size={17} />
          <input
            aria-label="Search your beats"
            placeholder="Search your library…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <label className="sort-control">
          <select
            aria-label="Published status filter"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="all">All beats ({data.beats.length})</option>
            <option value="published">Published</option>
            <option value="draft">Drafts</option>
            <option value="scheduled">Scheduled</option>
          </select>
          <ChevronDown size={14} />
        </label>
      </div>
      {error && <Notice error>{error}</Notice>}
      <label className="check-row">
        <input
          type="checkbox"
          checked={beats.length > 0 && beats.every((b) => bulkIds.includes(b.id))}
          onChange={(e) => setBulkIds(e.target.checked ? beats.map((b) => b.id) : [])}
        />
        Select visible beats
      </label>
      {bulkIds.length > 0 && <BulkEditor ids={bulkIds} data={data} onDone={() => setBulkIds([])} />}
      {bulkOpen && <BulkUploader demo={demo} onClose={() => setBulkOpen(false)} />}
      <div className="library-grid">
        {beats.map((b) => {
          const prices = data.licenses
            .filter((l) => l.beat_id === b.id && l.active)
            .map((l) => l.price_cents);
          return (
            <article className="library-card" key={b.id}>
              <label className="card-select">
                <input
                  type="checkbox"
                  aria-label={`Select ${b.title}`}
                  checked={bulkIds.includes(b.id)}
                  onChange={(e) =>
                    setBulkIds(
                      e.target.checked ? [...bulkIds, b.id] : bulkIds.filter((id) => id !== b.id),
                    )
                  }
                />
                Select
              </label>
              <button
                className="library-art"
                aria-label={`Edit ${b.title}`}
                onClick={() => setSelected(b)}
              >
                <img src={b.cover_url || '/demo/cover-1.svg'} alt={`${b.title} cover`} />
                <span className={`art-status ${b.published ? 'published' : ''}`}>
                  <span className="status-dot" />
                  {b.published &&
                  b.release_at &&
                  Date.parse(b.release_at) > Date.parse(data.as_of || '1970-01-01')
                    ? `Scheduled ${`${b.release_at.slice(0, 16).replace('T', ' ')} UTC`}`
                    : b.published
                      ? 'Published'
                      : 'Draft'}
                </span>
                <span className="art-edit">
                  <Pencil size={17} />
                </span>
              </button>
              <div className="library-card-info">
                <div>
                  <h2>{b.title}</h2>
                  <p>
                    {b.bpm} BPM <span>·</span> {b.musical_key}
                  </p>
                </div>
                <b>{prices.length ? money(Math.min(...prices)) : 'No license'}</b>
              </div>
              <div className="library-card-bottom">
                <button className="text-link muted" onClick={() => toggle(b)}>
                  {b.published ? 'Unpublish' : 'Publish'}
                  <ArrowUpRight size={13} />
                </button>
                <div>
                  <button
                    className="icon-button"
                    aria-label={`Edit ${b.title}`}
                    onClick={() => setSelected(b)}
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    className="icon-button"
                    aria-label={`Delete ${b.title}`}
                    onClick={() => setDeleting(b)}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>
      {!beats.length && (
        <Empty
          title="Room for your next idea."
          description="Upload your first beat, or try another search."
        >
          <Button className="primary" onClick={() => setSelected('new')}>
            <Plus size={15} /> Upload beat
          </Button>
        </Empty>
      )}
      {selected && (
        <BeatEditor
          key={current?.id || 'new'}
          beat={current}
          data={data}
          demo={demo}
          onClose={() => {
            setSelected(null);
            router.replace('/dashboard/beats');
          }}
          onCreated={setSelected}
        />
      )}{' '}
      {deleting && (
        <Modal title={`Delete “${deleting.title}”?`} onClose={() => setDeleting(null)}>
          <p className="muted">
            This removes the beat from your catalog. Existing customers keep access to their
            purchased files and license.
          </p>
          <div className="modal-actions">
            <Button className="secondary" onClick={() => setDeleting(null)}>
              Keep beat
            </Button>
            <Button className="danger" busy={busy} onClick={remove}>
              Delete beat
            </Button>
          </div>
        </Modal>
      )}
    </>
  );
}
