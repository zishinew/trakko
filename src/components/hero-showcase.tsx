import Link from 'next/link';
import { ArrowUpRight, AudioLines, Disc3, SlidersHorizontal, FileAudio, Plus } from 'lucide-react';
import { PlayButton } from './player';
import { money } from '@/lib/business';
import { brand } from '@/lib/brand';
import type { Workspace } from '@/lib/types';

function WindowBar({ title }: { title: string }) {
  return (
    <div className="showcase-bar">
      <span className="showcase-dots" aria-hidden="true">
        <i />
        <i />
        <i />
      </span>
      <span>{title}</span>
      <SlidersHorizontal size={12} aria-hidden="true" />
    </div>
  );
}

export function HeroShowcase({ workspace }: { workspace: Workspace }) {
  const releases = workspace.beats.slice(0, 3);
  return (
    <div className="hero-showcase">
      <div className="showcase-scene">
        <Link
          href="/dashboard/beats"
          className="showcase-window showcase-workspace"
          aria-label="Explore the producer workspace demo"
        >
          <WindowBar title={`${brand.name.toLowerCase()} / workspace`} />
          <div className="showcase-workspace-body">
            <div className="showcase-sidebar" aria-hidden="true">
              <AudioLines size={22} />
              <Disc3 size={18} />
              <FileAudio size={18} />
              <SlidersHorizontal size={18} />
            </div>
            <div className="showcase-catalog">
              <div className="showcase-catalog-heading">
                <div>
                  <strong>Your catalog</strong>
                  <span>Demo workspace · {workspace.beats.length} beats</span>
                </div>
                <span className="showcase-upload">
                  <Plus size={12} /> Upload beat
                </span>
              </div>
              <div className="showcase-table-head">
                <span>Track</span>
                <span>BPM</span>
                <span>Status</span>
              </div>
              {workspace.beats.slice(0, 4).map((beat) => (
                <div className="showcase-catalog-row" key={beat.id}>
                  <img src={beat.cover_url} alt="" />
                  <span>{beat.title}</span>
                  <span>{beat.bpm}</span>
                  <span className="showcase-published">Published</span>
                </div>
              ))}
              <div className="showcase-workspace-link">
                Explore your workspace <ArrowUpRight size={13} />
              </div>
            </div>
          </div>
        </Link>
        <div className="showcase-window showcase-store">
          <WindowBar title={`/${workspace.store.username}`} />
          <div className="showcase-store-content">
            <div className="showcase-producer">
              <img src={workspace.store.avatar_url} alt="" />
              <div>
                <strong>{workspace.store.display_name}</strong>
                <span>Independent sounds. Direct from the source.</span>
              </div>
              <Link href="/ziova" aria-label="Explore ziova’s demo store">
                <ArrowUpRight size={18} />
              </Link>
            </div>
            <div className="release-heading">
              <h2>Find your next sound.</h2>
              <span>{workspace.beats.length} beats</span>
            </div>
            <div className="release-shelf" aria-label="Playable demo releases">
              {releases.map((beat) => (
                <article className="release-tile" key={beat.id}>
                  <div className="release-art">
                    <img src={beat.cover_url} alt={`Cover for ${beat.title}`} />
                    <PlayButton beat={beat} large />
                  </div>
                  <div className="release-caption">
                    <div>
                      <h3>{beat.title}</h3>
                      <p>
                        {beat.bpm} BPM · {beat.musical_key}
                      </p>
                    </div>
                    <Link
                      href={`/ziova?beat=${beat.id}`}
                      aria-label={`View licenses for ${beat.title}`}
                    >
                      <span>
                        From{' '}
                        {money(
                          Math.min(
                            ...workspace.licenses
                              .filter((l) => l.beat_id === beat.id && l.active)
                              .map((l) => l.price_cents),
                          ),
                        )}
                      </span>
                      <ArrowUpRight size={12} />
                    </Link>
                  </div>
                </article>
              ))}
            </div>
            <div className="showcase-store-footer">
              <AudioLines size={14} />
              <span>Press play. Find your pocket.</span>
              <span>Powered by {brand.name}</span>
            </div>
          </div>
        </div>
      </div>
      <p className="showcase-disclaimer">
        Demo workspace & store · Original synthesized previews · Choose a beat to listen
      </p>
    </div>
  );
}
