'use client';
import { useState, useMemo, useCallback } from 'react';
import {
  Search,
  ArrowUpRight,
  Instagram,
  Youtube,
  Globe,
  SlidersHorizontal,
  ShoppingBag,
  ArrowRight,
  Headphones,
  ShieldCheck,
  Disc3,
  List,
  LayoutGrid,
} from 'lucide-react';
import Link from 'next/link';
import type { PublicCatalog, Beat } from '@/lib/types';
import { money } from '@/lib/business';
import { Logo, Empty } from './ui';
import { StoreTracking, FreeDownload, BundleCheckout } from './store-tools';
import type { Bundle } from '@/lib/tools';
import { LicenseSelector } from './license-selector';
import { PlayButton, PreviewProgress, PlayerProvider } from './player';
export function Storefront({
  catalog,
  demo = false,
  preview = false,
  embedded = false,
  initialBeatId,
}: {
  catalog: PublicCatalog;
  demo?: boolean;
  preview?: boolean;
  embedded?: boolean;
  initialBeatId?: string;
}) {
  const { store, beats, licenses } = catalog;
  const [query, setQuery] = useState(''),
    [tag, setTag] = useState('All beats'),
    [sort, setSort] = useState('newest'),
    [layout, setLayout] = useState('list'),
    [buy, setBuy] = useState<Beat | null>(beats.find((b) => b.id === initialBeatId) || null);
  const [freeBeat, setFreeBeat] = useState<Beat | null>(null),
    [bundle, setBundle] = useState<Bundle | null>(null);
  const availableBundles = (catalog.tools?.bundles || []).filter(
    (b) =>
      b.active &&
      b.beat_ids.every(
        (id) =>
          beats.some((beat) => beat.id === id) &&
          licenses.some((l) => l.beat_id === id && l.active && l.name === b.license_name),
      ),
  );
  const tags = ['All beats', ...new Set(beats.flatMap((b) => b.tags))];
  const price = useCallback(
    (b: Beat) =>
      Math.min(...licenses.filter((l) => l.beat_id === b.id && l.active).map((l) => l.price_cents)),
    [licenses],
  );
  const filtered = useMemo(() => {
    const list = beats.filter(
      (b) =>
        `${b.title} ${b.tags.join(' ')} ${b.musical_key} ${b.bpm}`
          .toLowerCase()
          .includes(query.toLowerCase()) &&
        (tag === 'All beats' || b.tags.includes(tag)),
    );
    return list.sort((a, b) =>
      sort === 'bpm'
        ? a.bpm - b.bpm
        : sort === 'price'
          ? price(a) - price(b)
          : b.created_at.localeCompare(a.created_at),
    );
  }, [beats, query, tag, sort, price]);
  const featured = beats[0];
  function chooseBeat(beat: Beat) {
    if (embedded)
      window.open(`/${store.username}?beat=${beat.id}`, '_blank', 'noopener,noreferrer');
    else setBuy(beat);
  }
  function openFullStore() {
    window.open(`/${store.username}`, '_blank', 'noopener,noreferrer');
  }
  return (
    <PlayerProvider>
      <div
        className={`storefront theme-${store.theme} ${preview ? 'is-preview' : ''}`}
        style={{ '--accent': store.accent } as React.CSSProperties}
      >
        {!preview && <StoreTracking username={store.username} />}
        {!preview && !embedded && (
          <header className="store-top">
            <Logo small />
            <div>
              <span className="store-top-label">INDEPENDENT SOUNDS. DIRECT FROM THE SOURCE.</span>
              <Link href="/dashboard" className="text-link">
                Your dashboard <ArrowUpRight size={14} />
              </Link>
            </div>
          </header>
        )}
        <div className="store-main">
          {embedded && (
            <p className="demo-footer">
              Listen here. Purchases and free downloads open the secure store in a new tab.
            </p>
          )}
          <section
            className="store-hero"
            style={
              store.banner_url
                ? { backgroundImage: `url("${store.banner_url}")`, backgroundSize: 'cover' }
                : undefined
            }
          >
            <div className="producer-intro">
              <div className="producer-identity">
                <img
                  src={store.avatar_url || '/demo/avatar.svg'}
                  alt={`${store.display_name} avatar`}
                  className="producer-avatar"
                />
              </div>
              <h1>
                {store.display_name}
                <span className="accent">.</span>
              </h1>
              <p className="producer-bio">
                {store.bio || 'Original beats. Made for your next record.'}
              </p>
              <div className="producer-socials">
                {store.instagram && (
                  <a aria-label="Instagram" href={store.instagram} target="_blank" rel="noreferrer">
                    <Instagram size={18} />
                  </a>
                )}
                {store.youtube && (
                  <a aria-label="YouTube" href={store.youtube} target="_blank" rel="noreferrer">
                    <Youtube size={20} />
                  </a>
                )}
                {store.website && (
                  <a aria-label="Website" href={store.website} target="_blank" rel="noreferrer">
                    <Globe size={18} />
                  </a>
                )}
                <span className="social-divider" />
                <span>{beats.length} beats. Your next sound.</span>
              </div>
            </div>
            {featured && (
              <div className="featured-beat">
                <div className="featured-art">
                  <img
                    src={featured.cover_url || '/demo/cover-1.svg'}
                    alt={`Cover for ${featured.title}`}
                  />
                  <span className="featured-stamp">
                    <Disc3 size={13} /> FEATURED RELEASE
                  </span>
                  <PlayButton beat={featured} large />
                </div>
                <div className="featured-info">
                  <div>
                    <h2>{featured.title}</h2>
                    <p>
                      {featured.bpm} BPM <span> / </span> {featured.musical_key}
                    </p>
                  </div>
                  <button
                    className="icon-button featured-buy"
                    aria-label={`Buy ${featured.title}`}
                    onClick={() => chooseBeat(featured)}
                  >
                    View licenses <ArrowUpRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </section>
          {availableBundles.length > 0 && (
            <section className="bundle-section">
              <h2>Beat bundles.</h2>
              <div className="bundle-grid">
                {availableBundles.map((b) => (
                  <article className="panel tools-panel" key={b.id}>
                    <h3>{b.name}</h3>
                    <p className="muted text-sm">
                      {b.beat_ids.length} beats · {b.license_name}
                    </p>
                    <p className="bundle-titles">
                      {b.beat_ids
                        .map((id) => beats.find((beat) => beat.id === id)?.title)
                        .join(' / ')}
                    </p>
                    <button
                      className="button"
                      onClick={() => (embedded ? openFullStore() : setBundle(b))}
                    >
                      View bundle / {money(b.price_cents)}
                    </button>
                  </article>
                ))}
              </div>
            </section>
          )}
          <section className="catalog-section">
            <div className="section-heading">
              <div>
                <h2>
                  Find your frequency<span className="accent">.</span>
                </h2>
              </div>
              <span className="muted text-sm">{beats.length} original beats</span>
            </div>
            <div className="catalog-controls">
              <div className="search-input">
                <Search size={17} />
                <input
                  aria-label="Search beats"
                  placeholder="Search by name, mood, or sound…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
              <label className="sort-control">
                <SlidersHorizontal size={15} />
                <select
                  aria-label="Sort beats"
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                >
                  <option value="newest">Newest first</option>
                  <option value="price">Price: low to high</option>
                  <option value="bpm">BPM: low to high</option>
                </select>
              </label>
              <div className="view-toggle">
                <button
                  aria-label="List view"
                  aria-pressed={layout === 'list'}
                  className={layout === 'list' ? 'selected' : ''}
                  onClick={() => setLayout('list')}
                >
                  <List size={18} />
                </button>
                <button
                  aria-label="Grid view"
                  aria-pressed={layout === 'grid'}
                  className={layout === 'grid' ? 'selected' : ''}
                  onClick={() => setLayout('grid')}
                >
                  <LayoutGrid size={16} />
                </button>
              </div>
            </div>
            <div className="tag-filters">
              {tags.map((t) => (
                <button key={t} className={tag === t ? 'selected' : ''} onClick={() => setTag(t)}>
                  {t}
                </button>
              ))}
            </div>
            {layout === 'list' ? (
              <div className="beat-list">
                <div className="beat-list-heading">
                  <span>#</span>
                  <span>TITLE</span>
                  <span>PREVIEW</span>
                  <span>BPM</span>
                  <span>KEY</span>
                  <span>LICENSE</span>
                </div>
                {filtered.map((beat, i) => (
                  <div key={beat.id} className="beat-row">
                    <span className="beat-index">{String(i + 1).padStart(2, '0')}</span>
                    <div className="beat-title-cell">
                      <div className="row-art">
                        <img src={beat.cover_url || '/demo/cover-1.svg'} alt="" />
                        <PlayButton beat={beat} />
                      </div>
                      <div>
                        <h3>{beat.title}</h3>
                        {beat.free_download && (
                          <button
                            className="free-download-link"
                            disabled={preview}
                            onClick={() => (embedded ? openFullStore() : setFreeBeat(beat))}
                          >
                            Free preview download
                          </button>
                        )}
                        <div className="beat-tags">
                          {beat.tags.map((t) => (
                            <span key={t}>{t}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="row-wave">
                      <PreviewProgress beat={beat} />
                    </div>
                    <span className="beat-bpm">
                      {beat.bpm}
                      <small>BPM</small>
                    </span>
                    <span className="beat-key">{beat.musical_key}</span>
                    <button
                      className="buy-button"
                      onClick={() => chooseBeat(beat)}
                      disabled={!Number.isFinite(price(beat))}
                    >
                      <ShoppingBag size={14} />
                      {Number.isFinite(price(beat)) ? money(price(beat)) : 'Unavailable'}
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="store-grid">
                {filtered.map((beat) => (
                  <div className="catalog-card" key={beat.id}>
                    <div className="card-art">
                      <img
                        src={beat.cover_url || '/demo/cover-1.svg'}
                        alt={`Cover for ${beat.title}`}
                      />
                      <PlayButton beat={beat} large />
                    </div>
                    <div className="card-details">
                      <div>
                        <h3>{beat.title}</h3>
                        {beat.free_download && (
                          <button
                            className="free-download-link"
                            disabled={preview}
                            onClick={() => (embedded ? openFullStore() : setFreeBeat(beat))}
                          >
                            Free preview download
                          </button>
                        )}
                        <p>
                          {beat.bpm} BPM · {beat.musical_key}
                        </p>
                      </div>
                      <button className="buy-button" onClick={() => chooseBeat(beat)}>
                        {Number.isFinite(price(beat)) ? money(price(beat)) : 'View'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {!filtered.length && (
              <Empty
                title="Nothing in this frequency"
                description="Try another search or choose a different mood."
              />
            )}
          </section>
          <div className="store-assurances">
            <span>
              <Headphones size={17} /> Preview before you purchase
            </span>
            <span>
              <ShieldCheck size={17} /> Secure checkout with Stripe
            </span>
            <span>
              <ArrowRight size={17} /> Instant files. No account needed.
            </span>
          </div>
          <footer className="store-footer">
            <span>Made independently. Sold directly.</span>
            <Link href="/">
              POWERED BY <strong>{brandName}</strong>
              <ArrowUpRight size={12} />
            </Link>
          </footer>
          {demo && !preview && (
            <p className="demo-footer">
              Demo store · Original synthesized audio · Checkout is simulated
            </p>
          )}
        </div>
        {freeBeat && (
          <FreeDownload
            beat={freeBeat}
            username={store.username}
            onClose={() => setFreeBeat(null)}
          />
        )}
        {bundle && (
          <BundleCheckout
            bundle={bundle}
            catalog={catalog}
            demo={demo}
            disabled={preview}
            onClose={() => setBundle(null)}
          />
        )}
        {buy && (
          <LicenseSelector
            beat={buy}
            username={store.username}
            licenses={licenses.filter((l) => l.beat_id === buy.id && l.active)}
            demo={demo}
            onClose={() => setBuy(null)}
            disabled={preview}
          />
        )}
      </div>
    </PlayerProvider>
  );
}
import { brand } from '@/lib/brand';
const brandName = brand.name.toUpperCase();
