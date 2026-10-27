import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { PlayButton } from './player';
import { money } from '@/lib/business';
import type { Workspace } from '@/lib/types';

export function ReleaseShowcase({ workspace }: { workspace: Workspace }) {
  return (
    <section className="daylight-releases hero-showcase" aria-labelledby="releases-title">
      <div className="daylight-section-heading">
        <h2 id="releases-title">Made to be heard.</h2>
        <p>A few sounds from ziova’s demo store. Find your pocket.</p>
      </div>
      <div className="release-shelf" aria-label="Playable demo releases">
        {workspace.beats.slice(0, 3).map((beat) => (
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
              <Link href={`/ziova?beat=${beat.id}`} aria-label={`View licenses for ${beat.title}`}>
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
                <ArrowUpRight size={15} />
              </Link>
            </div>
          </article>
        ))}
      </div>
      <div className="daylight-release-footer">
        <span>Demo releases · Original synthesized previews</span>
        <Link href="/dashboard/beats" aria-label="Explore the producer workspace demo">
          Explore the producer workspace <ArrowUpRight size={16} />
        </Link>
      </div>
    </section>
  );
}
