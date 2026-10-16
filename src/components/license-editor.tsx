'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, Check } from 'lucide-react';
import type { License, Deliverable } from '@/lib/types';
import { defaultTerms } from '@/lib/demo-data';
import { parsePrice } from '@/lib/business';
import { post } from '@/lib/client';
import { Button, Field, Notice, Modal } from './ui';
export function LicenseEditor({
  licenses,
  beatId = null,
}: {
  licenses: License[];
  beatId?: string | null;
}) {
  const [edit, setEdit] = useState<License | 'new' | null>(null);
  return (
    <div className="license-editor">
      <div className="license-editor-heading">
        <div>
          <h3>{beatId ? 'Beat licenses' : 'Default licenses'}</h3>
          <p>
            {beatId
              ? 'Choose what the buyer gets. Only active licenses appear in your store.'
              : 'Copied to each new beat. Existing beat licenses can be edited individually.'}
          </p>
        </div>
        <button className="button secondary small" onClick={() => setEdit('new')}>
          <Plus size={14} /> Add license
        </button>
      </div>
      <div className="license-summary-list">
        {licenses
          .filter((l) => l.beat_id === beatId)
          .map((l) => (
            <button type="button" key={l.id} className="license-summary" onClick={() => setEdit(l)}>
              <span>
                <strong>{l.name}</strong>
                <small>{l.deliverables.map((d) => d.toUpperCase()).join(' + ')}</small>
              </span>
              <b>${(l.price_cents / 100).toFixed(2)}</b>
              <span className={`status-pill ${l.active ? '' : 'inactive'}`}>
                {l.active ? 'Active' : 'Disabled'}
              </span>
            </button>
          ))}
      </div>
      {edit && (
        <LicenseForm
          key={typeof edit === 'string' ? 'new' : edit.id}
          license={edit === 'new' ? null : edit}
          beatId={beatId}
          onClose={() => setEdit(null)}
        />
      )}
    </div>
  );
}
function LicenseForm({
  license,
  beatId,
  onClose,
}: {
  license: License | null;
  beatId: string | null;
  onClose: () => void;
}) {
  const router = useRouter(),
    [name, setName] = useState(license?.name || ''),
    [price, setPrice] = useState(license ? (license.price_cents / 100).toFixed(2) : '19.99'),
    [terms, setTerms] = useState(license?.terms || defaultTerms),
    [active, setActive] = useState(license?.active ?? true),
    [includes, setIncludes] = useState<Deliverable[]>(license?.deliverables || ['mp3']),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [confirm, setConfirm] = useState(false);
  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await post('/api/manage', {
        action: 'license',
        id: license?.id,
        beat_id: beatId,
        data: { name, price_cents: parsePrice(price), terms, active, deliverables: includes },
      });
      router.refresh();
      onClose();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function remove() {
    setBusy(true);
    try {
      await post('/api/manage', { action: 'delete-license', id: license?.id });
      router.refresh();
      onClose();
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  }
  return (
    <Modal title={license ? 'Edit license' : 'New license'} onClose={onClose}>
      <form onSubmit={save}>
        <div className="form-two">
          <Field label="License name">
            <input required maxLength={40} value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <Field label="Price (USD)">
            <input
              required
              inputMode="decimal"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
          </Field>
        </div>
        <fieldset className="deliverable-checks">
          <legend>Included deliverables</legend>
          {(['mp3', 'wav', 'stems'] as const).map((d) => (
            <label key={d}>
              <input
                type="checkbox"
                checked={includes.includes(d)}
                onChange={(e) =>
                  setIncludes(e.target.checked ? [...includes, d] : includes.filter((x) => x !== d))
                }
              />
              {d === 'stems' ? 'Trackout / stems ZIP' : d.toUpperCase()}
            </label>
          ))}
        </fieldset>
        <Field label="License terms" hint="These terms are captured on the receipt at purchase.">
          <textarea required rows={6} value={terms} onChange={(e) => setTerms(e.target.value)} />
        </Field>
        <label className="checkbox-field">
          <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />{' '}
          Active · available to purchase
        </label>
        {error && <Notice error>{error}</Notice>}
        <div className="modal-actions">
          {license && (
            <button
              className="button danger"
              type="button"
              onClick={() => (confirm ? void remove() : setConfirm(true))}
              disabled={busy}
            >
              <Trash2 size={14} />
              {confirm ? 'Confirm deletion' : 'Delete'}
            </button>
          )}
          <Button className="primary" type="submit" busy={busy}>
            <Check size={15} /> Save license
          </Button>
        </div>
      </form>
    </Modal>
  );
}
