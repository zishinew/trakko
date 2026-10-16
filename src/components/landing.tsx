import Link from 'next/link';
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  Upload,
  AudioLines,
  CircleDollarSign,
} from 'lucide-react';
import { Logo } from './ui';
import { PlayerProvider } from './player';
import { demoWorkspace } from '@/lib/demo-data';
import { HeroShowcase } from './hero-showcase';
import { StudioAtmosphere } from './studio-atmosphere';
export function Landing({ demo, feePercent }: { demo: boolean; feePercent: string }) {
  const sample = demoWorkspace();
  return (
    <PlayerProvider>
      <div className="landing label-catalog studio-catalog clean-catalog">
        <header className="landing-nav">
          <Logo />
          <nav aria-label="Main navigation">
            <Link href="/ziova">
              Demo store <ArrowUpRight size={14} />
            </Link>
            <Link href="/login">Log in</Link>
            <Link href="/signup" className="button primary">
              Create your store <ArrowRight size={15} />
            </Link>
          </nav>
        </header>
        <main>
          <section className="label-masthead">
            <StudioAtmosphere />
            <div className="studio-intro">
              <h1>
                <span className="title-line">
                  <span>Your beats.</span>
                </span>
                <span className="title-line">
                  <span>Your business.</span>
                </span>
              </h1>
              <div className="masthead-details">
                <p>
                  A home for your sound. A direct line to your listeners.
                  <br /> Upload your beats, set your prices, and start selling with one link.
                </p>
                <div className="masthead-action">
                  <Link href="/signup" className="button primary">
                    Create your free store <ArrowRight size={18} />
                  </Link>
                  <Link href="/ziova" className="button secondary">
                    Explore the demo <ArrowUpRight size={16} />
                  </Link>
                  <span>No subscription. {feePercent}% per completed sale.</span>
                </div>
              </div>
            </div>
            <HeroShowcase workspace={sample} />
          </section>
          <section className="landing-bottom" id="how-it-works">
            <div>
              <h2>
                From your hard drive
                <br />
                to their next record.
              </h2>
              <p className="section-description">A simple path from making music to selling it.</p>
            </div>
            <div className="landing-steps">
              <div>
                <Upload size={23} />
                <h3>Upload your sound</h3>
                <p>
                  Add previews, artwork, and the files artists receive. Upload one beat or your
                  whole batch.
                </p>
              </div>
              <div>
                <AudioLines size={23} />
                <h3>Make it yours</h3>
                <p>
                  Choose your link, customize your store, and set your own license prices and terms.
                </p>
              </div>
              <div>
                <CircleDollarSign size={23} />
                <h3>Start selling</h3>
                <p>
                  Connect Stripe and share your link. Artists buy without an account and get their
                  purchased files.
                </p>
              </div>
            </div>
          </section>
          <section className="label-business">
            <div className="business-title">
              <h2>
                More time for music.
                <br />
                Less time managing it.
              </h2>
              <Link href={demo ? '/dashboard' : '/signup'} className="button secondary">
                {demo ? 'Try the producer dashboard' : 'Start your store'}{' '}
                <ArrowUpRight size={16} />
              </Link>
            </div>
            <dl className="business-list">
              <div>
                <dt>Sell your way</dt>
                <dd>Flexible licenses, discount codes, and beat bundles.</dd>
              </div>
              <div>
                <dt>Build your audience</dt>
                <dd>Free tagged previews, email capture, and separate marketing consent.</dd>
              </div>
              <div>
                <dt>Keep track</dt>
                <dd>Sales and traffic analytics, collaborator shares, and scheduled releases.</dd>
              </div>
            </dl>
          </section>
          <section className="label-pricing">
            <div>
              <h2>
                Free to use.
                <br />
                {feePercent}% when you sell.
              </h2>
              <p>
                No monthly plans or paid upload tiers. Payment-processing fees apply separately.
              </p>
            </div>
            <div>
              <p>
                <Check size={18} /> Your own customizable store link
              </p>
              <p>
                <Check size={18} /> Your prices. Your license terms.
              </p>
              <Link href="/signup" className="button primary">
                Create your store <ArrowRight size={18} />
              </Link>
            </div>
          </section>
        </main>
        <footer className="landing-footer">
          <Logo small />
          <span>Independent sounds. Direct from the source.</span>
          <Link href={demo ? '/dashboard' : '/signup'}>
            {demo ? 'Explore the demo dashboard' : 'Start your store'} <ArrowUpRight size={14} />
          </Link>
        </footer>
      </div>
    </PlayerProvider>
  );
}
