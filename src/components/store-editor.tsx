'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, ArrowUpRight, Check, Upload, Eye, Paintbrush } from 'lucide-react';
import Link from 'next/link';
import type { Workspace, Store } from '@/lib/types';
import { post, uploadFile } from '@/lib/client';
import { PageHeading } from './dashboard-shell';
import { Logo, Field, Button, Notice } from './ui';
import { Storefront } from './storefront';
export function StoreEditor({
  data,
  demo,
  onboarding = false,
  origin = '',
}: {
  data: Workspace;
  demo: boolean;
  onboarding?: boolean;
  origin?: string;
}) {
  const [draft, setDraft] = useState<Store>(data.store),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [message, setMessage] = useState(''),
    [uploading, setUploading] = useState('');
  const router = useRouter();
  function change<K extends keyof Store>(key: K, value: Store[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
    setMessage('');
  }
  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await post('/api/manage', { action: 'store', data: draft });
      if (onboarding) router.push('/dashboard');
      else setMessage('Your store is updated.');
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function upload(file: File | undefined, kind: 'avatar' | 'banner') {
    if (!file) return;
    setUploading(kind);
    setError('');
    try {
      const result = await uploadFile(file, kind, undefined, demo);
      if (result?.url) change(kind === 'avatar' ? 'avatar_url' : 'banner_url', result.url);
      router.refresh();
      setMessage('Image uploaded.');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setUploading('');
    }
  }
  const form = (
    <form onSubmit={save} className="store-form">
      <section className="panel form-panel">
        <div className="panel-heading">
          <h2>{onboarding ? 'A home for your sound.' : 'The essentials'}</h2>
          <Paintbrush size={17} />
        </div>
        <div className="profile-upload">
          <img src={draft.avatar_url || '/demo/avatar.svg'} alt="Store avatar" />
          {!onboarding && (
            <label className="button secondary small">
              <Upload size={14} />
              {uploading === 'avatar' ? 'Uploading…' : 'Upload photo'}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                hidden
                disabled={!!uploading}
                onChange={(e) => void upload(e.target.files?.[0], 'avatar')}
              />
            </label>
          )}
          <span>JPG, PNG or WebP. Up to 8 MB.</span>
        </div>
        <Field label="Display name">
          <input
            required
            maxLength={60}
            placeholder="Your producer name"
            value={draft.display_name}
            onChange={(e) => change('display_name', e.target.value)}
          />
        </Field>
        <Field label="Store URL" hint="3–30 lowercase letters, numbers, hyphens, or underscores.">
          <div className="url-field">
            <span>/</span>
            <input
              aria-label="Store URL"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              required
              pattern="[a-z0-9][a-z0-9_\-]{2,29}"
              minLength={3}
              maxLength={30}
              value={draft.username}
              onChange={(e) => change('username', e.target.value.toLowerCase())}
            />
          </div>
        </Field>
        <Field label="Bio (optional)">
          <textarea
            maxLength={300}
            rows={3}
            placeholder="A few words about your sound."
            value={draft.bio}
            onChange={(e) => change('bio', e.target.value)}
          />
        </Field>
        <div className="bio-count">{draft.bio.length}/300</div>
        {!onboarding && (
          <>
            <div className="form-section-label">APPEARANCE</div>
            <Field label="Accent color">
              <div className="color-options">
                {['#0069e0', '#626270', '#365edc', '#c35230', '#8b4b97', '#ff2d8d'].map((c) => (
                  <button
                    type="button"
                    aria-label={`Use accent ${c}`}
                    aria-pressed={draft.accent === c}
                    style={{ background: c }}
                    key={c}
                    className={draft.accent === c ? 'selected' : ''}
                    onClick={() => change('accent', c)}
                  >
                    {draft.accent === c && <Check size={16} />}
                  </button>
                ))}
                <input
                  aria-label="Custom accent color"
                  type="color"
                  value={draft.accent}
                  onChange={(e) => change('accent', e.target.value)}
                />
              </div>
            </Field>
            <Field label="Store theme">
              <div className="theme-options">
                {(['dark', 'light'] as const).map((t) => (
                  <button
                    type="button"
                    key={t}
                    className={draft.theme === t ? 'selected' : ''}
                    aria-pressed={draft.theme === t}
                    onClick={() => change('theme', t)}
                  >
                    <span className={`theme-swatch ${t}`} />
                    {t === 'dark' ? 'After dark' : 'Daylight'}
                    {draft.theme === t && <Check size={14} />}
                  </button>
                ))}
              </div>
            </Field>
            <Field label="Banner (optional)">
              <label className="banner-upload">
                {draft.banner_url ? (
                  <img src={draft.banner_url} alt="Store banner" />
                ) : (
                  <Upload size={23} />
                )}
                <span>
                  {uploading === 'banner'
                    ? 'Uploading…'
                    : 'Choose a banner · JPG, PNG, WebP · 8 MB'}
                </span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  hidden
                  disabled={!!uploading}
                  onChange={(e) => void upload(e.target.files?.[0], 'banner')}
                />
              </label>
            </Field>
          </>
        )}
        <div className="form-section-label">FIND YOU ELSEWHERE</div>
        {(['instagram', 'youtube', 'website'] as const).map((k) => (
          <Field key={k} label={k === 'website' ? 'Website' : k[0].toUpperCase() + k.slice(1)}>
            <input
              type="url"
              placeholder={`https://${k === 'website' ? 'your-site.com' : k + '.com/you'}`}
              value={draft[k]}
              onChange={(e) => change(k, e.target.value)}
            />
          </Field>
        ))}
        {!onboarding && (
          <label className="checkbox-field">
            <input
              type="checkbox"
              checked={draft.published}
              onChange={(e) => change('published', e.target.checked)}
            />{' '}
            Store is publicly visible
          </label>
        )}
        {error && <Notice error>{error}</Notice>}
        {message && <Notice>{message}</Notice>}
        <Button type="submit" className="primary full" busy={busy} disabled={!!uploading}>
          {onboarding ? 'Create your store' : 'Save changes'}
          {onboarding ? <ArrowRight size={16} /> : <Check size={16} />}
        </Button>
      </section>
    </form>
  );
  if (onboarding)
    return (
      <main className="onboarding-page">
        <header>
          <Logo />
        </header>
        <div className="onboarding-layout">
          <div>
            <h1>
              Good music.
              <br />
              Meet your new home<span className="accent">.</span>
            </h1>
            <p>
              Choose a name and a link. You can add your photo and customize everything from your
              dashboard.
            </p>
            {demo && (
              <Notice>
                This creates a local demo store. Set Supabase credentials to create a real producer
                account.
              </Notice>
            )}
            <div className="onboarding-art">
              <img src="/demo/cover-1.svg" alt="Original demo beat artwork" />
              <img src="/demo/cover-4.svg" alt="Original demo beat artwork" />
            </div>
          </div>
          {form}
        </div>
      </main>
    );
  return (
    <>
      <PageHeading
        eyebrow="YOUR SOUND. YOUR SPACE."
        title="Make it yours."
        description="A few details. A storefront that feels like you."
      >
        <Link className="button secondary" target="_blank" href={`/${data.store.username}`}>
          Open store <ArrowUpRight size={15} />
        </Link>
      </PageHeading>
      <details className="panel form-panel share-panel">
        <summary>
          <strong>Share your store</strong>
          <span>Store link & embed code</span>
        </summary>
        <Field label="Your store link">
          <input
            readOnly
            value={`${origin}/${data.store.username}`}
            onFocus={(e) => e.target.select()}
          />
        </Field>
        <Field
          label="Embed code"
          hint="Paste into your website’s HTML. Checkout opens your secure store in a new tab."
        >
          <textarea
            readOnly
            rows={3}
            value={`<iframe src="${origin}/${data.store.username}/embed" title="Beat store" width="100%" height="800" style="border:0" loading="lazy"></iframe>`}
            onFocus={(e) => e.target.select()}
          />
        </Field>
        <Link className="text-link" target="_blank" href={`/${data.store.username}/embed`}>
          Preview embedded store <ArrowUpRight size={14} />
        </Link>
        <p className="muted">Save a changed username before copying your updated link.</p>
      </details>
      <div className="store-editor-layout">
        {form}
        <div className="preview-panel">
          <div className="preview-panel-heading">
            <span>
              <Eye size={15} /> LIVE PREVIEW
            </span>
            <span>Changes appear as you type</span>
          </div>
          <div className="preview-viewport">
            <Storefront
              catalog={{
                store: draft,
                beats: data.beats.filter((b) => b.published),
                licenses: data.licenses.filter((l) => l.active),
              }}
              demo={demo}
              preview
            />
          </div>
        </div>
      </div>
    </>
  );
}
