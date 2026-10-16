'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowUpRight, Upload, FileAudio, Image as ImageIcon, Check } from 'lucide-react';
import type { Beat, Workspace, FileKind } from '@/lib/types';
import { post, uploadFile } from '@/lib/client';
import { Modal, Button, Field, Notice } from './ui';
import { LicenseEditor } from './license-editor';
export function BeatEditor({
  beat,
  data,
  demo,
  onClose,
  onCreated,
}: {
  beat: Beat | null;
  data: Workspace;
  demo: boolean;
  onClose: () => void;
  onCreated: (beat: Beat) => void;
}) {
  const router = useRouter();
  const [title, setTitle] = useState(beat?.title || ''),
    [bpm, setBpm] = useState(String(beat?.bpm || 140)),
    [key, setKey] = useState(beat?.musical_key || 'C minor'),
    [tags, setTags] = useState(beat?.tags.join(', ') || ''),
    [description, setDescription] = useState(beat?.description || ''),
    [busy, setBusy] = useState(false),
    [uploading, setUploading] = useState(''),
    [error, setError] = useState(''),
    [message, setMessage] = useState('');
  const [release, setRelease] = useState(
      beat?.release_at
        ? new Date(
            Date.parse(beat.release_at) - new Date(beat.release_at).getTimezoneOffset() * 60000,
          )
            .toISOString()
            .slice(0, 16)
        : '',
    ),
    [free, setFree] = useState(!!beat?.free_download),
    [freeTerms, setFreeTerms] = useState(
      beat?.free_download_terms ||
        'Non-commercial demo use only. Credit the producer. No distribution, resale, or Content ID registration.',
    );
  async function save(e: React.FormEvent, publish = false) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const result = await post<Beat>('/api/manage', {
        action: 'beat',
        id: beat?.id,
        data: {
          title,
          bpm: Number(bpm),
          musical_key: key,
          tags: tags
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean),
          description,
          published: publish || !!beat?.published || (!!beat && !!release),
          release_at: release ? new Date(release).toISOString() : null,
          free_download: free,
          free_download_terms: freeTerms,
        },
      });
      router.refresh();
      if (!beat) onCreated(result);
      else {
        setMessage(publish ? 'Beat published. Your sound is live.' : 'Beat saved.');
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function upload(file: File | undefined, kind: FileKind) {
    if (!file || !beat) return;
    setUploading(kind);
    setError('');
    try {
      await uploadFile(file, kind, beat.id, demo);
      setMessage(`${kind.toUpperCase()} uploaded.`);
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setUploading('');
    }
  }
  const uploads: [FileKind, string, string, string][] = [
    ['cover', 'Cover artwork', 'image/jpeg,image/png,image/webp', 'JPG, PNG, WebP · 8 MB'],
    ['preview', 'Tagged preview', 'audio/mpeg', 'MP3 · 30 MB'],
    ['mp3', 'Untagged MP3', 'audio/mpeg', 'MP3 · 100 MB'],
    ['wav', 'High-quality WAV', '.wav', 'WAV · 500 MB'],
    ['stems', 'Trackout / stems', '.zip', 'ZIP · 1 GB'],
  ];
  return (
    <Modal title={beat ? `Edit ${beat.title}` : 'Upload a beat'} onClose={onClose} wide>
      <form onSubmit={save}>
        <div className="form-two">
          <Field label="Beat title">
            <input
              required
              maxLength={100}
              placeholder="Give your beat a name"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </Field>
          <div className="form-two">
            <Field label="BPM">
              <input
                type="number"
                required
                min={30}
                max={300}
                value={bpm}
                onChange={(e) => setBpm(e.target.value)}
              />
            </Field>
            <Field label="Key">
              <select value={key} onChange={(e) => setKey(e.target.value)}>
                {['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'].flatMap((n) =>
                  ['minor', 'major'].map((m) => (
                    <option key={`${n} ${m}`}>
                      {n} {m}
                    </option>
                  )),
                )}
              </select>
            </Field>
          </div>
        </div>
        <Field label="Tags" hint="Separate with commas. Up to 8 tags.">
          <input
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="Trap, Melodic, Late night"
          />
        </Field>
        <Field label="Description (optional)">
          <textarea
            rows={2}
            maxLength={2000}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </Field>
        {!beat && (
          <Notice>Create a draft first. Then add your files and choose your licenses.</Notice>
        )}
        {error && <Notice error>{error}</Notice>}
        {message && <Notice>{message}</Notice>}
        <div className="modal-actions">
          <Button className="secondary" type="submit" busy={busy} disabled={!!uploading}>
            {beat ? 'Save changes' : 'Create draft'}
          </Button>
          {beat && !beat.published && (
            <Button
              className="primary"
              type="button"
              busy={busy}
              disabled={!!uploading}
              onClick={(e) => save(e, true)}
            >
              Publish beat <ArrowUpRight size={15} />
            </Button>
          )}
        </div>
      </form>
      {beat && (
        <>
          <div className="editor-section">
            <h3>Audio & artwork</h3>
            <p>Previews are public. Purchased files stay private.</p>
            <div className="upload-grid">
              {uploads.map(([kind, label, accept, hint]) => {
                const file = data.files.find((f) => f.beat_id === beat.id && f.kind === kind);
                const present =
                  !!file ||
                  (kind === 'cover' && beat.cover_url) ||
                  (kind === 'preview' && beat.preview_url);
                return (
                  <label className="upload-box" key={kind}>
                    {kind === 'cover' ? <ImageIcon size={20} /> : <FileAudio size={20} />}
                    <strong>{label}</strong>
                    <span>
                      {uploading === kind ? (
                        'Uploading…'
                      ) : present ? (
                        <>
                          <Check size={12} /> {file?.name || 'Ready'}
                        </>
                      ) : (
                        hint
                      )}
                    </span>
                    <input
                      type="file"
                      accept={accept}
                      disabled={!!uploading || busy}
                      onChange={(e) => {
                        void upload(e.target.files?.[0], kind);
                        e.target.value = '';
                      }}
                    />
                    <small>
                      <Upload size={12} />
                      {present ? 'Replace file' : 'Choose file'}
                    </small>
                  </label>
                );
              })}
            </div>
            {demo && <p className="text-sm muted">Demo uploads: maximum 100 MB per file.</p>}
          </div>
          <section className="tools-panel">
            <h3>Release and free downloads</h3>
            <Field
              label="Release date and time"
              hint="Your local time. Leave empty to publish immediately; a scheduled release requires complete files and active licenses."
            >
              <input
                type="datetime-local"
                value={release}
                onChange={(e) => setRelease(e.target.value)}
              />
            </Field>
            <label className="check-row">
              <input type="checkbox" checked={free} onChange={(e) => setFree(e.target.checked)} />
              Offer tagged preview as a free download
            </label>
            {free && (
              <Field label="Free download terms">
                <textarea
                  required
                  minLength={10}
                  value={freeTerms}
                  onChange={(e) => setFreeTerms(e.target.value)}
                />
              </Field>
            )}
            <p className="muted text-sm">
              A free download never unlocks purchased files. Email marketing consent is optional and
              separate.
            </p>
          </section>
          <LicenseEditor licenses={data.licenses} beatId={beat.id} />
          <p className="text-sm muted">
            To publish, upload a preview and every file included in your active licenses. Disable
            licenses you aren’t offering yet.
          </p>
        </>
      )}
    </Modal>
  );
}
