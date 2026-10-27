'use client';

import { useRef, useState, type PointerEvent } from 'react';
import { ArrowUpRight, AudioLines, Pause, Play } from 'lucide-react';
import type { Beat } from '@/lib/types';
import waveforms from '@/lib/demo-waveforms.json';
import { usePlayer } from './player';
import { useSurfaceMotion } from './daylight-motion';

const clock = (time: number) =>
  `${Math.floor(time / 60)}:${String(Math.floor(time % 60)).padStart(2, '0')}`;

// Original implementation: perspective, fanned cards and waveform interactions
// researched at Aceternity UI, Componentry and 21st.dev; no library source copied.
export function SignalDeck({ beats }: { beats: Beat[] }) {
  const player = usePlayer();
  const { paused, reduced } = useSurfaceMotion();
  const [selected, setSelected] = useState(0);
  const card = useRef<HTMLDivElement>(null);
  const track = beats[selected];
  const active = player.beat?.id === track.id;
  const playing = active && player.playing;
  const progress = active && player.duration ? player.time / player.duration : 0;
  const peaks = waveforms[selected];

  function tilt(event: PointerEvent<HTMLDivElement>) {
    if (
      !card.current ||
      paused ||
      reduced ||
      event.pointerType !== 'mouse' ||
      !window.matchMedia(
        '(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)',
      ).matches ||
      event.currentTarget.contains(document.activeElement)
    )
      return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width - 0.5;
    const y = (event.clientY - bounds.top) / bounds.height - 0.5;
    card.current.style.transform = `rotateX(${-y * 5}deg) rotateY(${x * 6}deg) rotateZ(-2deg)`;
  }
  function resetTilt() {
    if (card.current) card.current.style.transform = '';
  }

  return (
    <div className="signal-playground" aria-label="Interactive demo music player">
      <div
        className="signal-stage"
        onPointerMove={tilt}
        onPointerLeave={resetTilt}
        onFocus={resetTilt}
      >
        <div className="signal-paper signal-paper-left" aria-hidden="true">
          <AudioLines size={24} />
        </div>
        <div className="signal-paper signal-paper-right" aria-hidden="true">
          <ArrowUpRight size={28} />
        </div>
        <div className="signal-drift">
          <div className="signal-console" ref={card}>
            <div className="signal-console-top">
              <span>
                <AudioLines size={15} /> Trakko listening room
              </span>
              <span>Demo audio</span>
            </div>
            <div className="signal-track">
              <button
                className="signal-play"
                aria-label={`${playing ? 'Pause' : 'Play'} hero preview: ${track.title}`}
                onClick={() => player.toggle(track)}
              >
                {playing ? (
                  <Pause size={28} fill="currentColor" />
                ) : (
                  <Play size={28} fill="currentColor" />
                )}
              </button>
              <div className="signal-track-name">
                <strong>{track.title}</strong>
                <span>
                  ziova · {track.bpm} BPM · {track.musical_key}
                </span>
              </div>
              <span className="signal-playing" aria-label={playing ? 'Playing' : 'Ready to play'}>
                <i className={playing ? 'is-playing' : ''} />
                {playing ? 'Playing' : 'Press play'}
              </span>
            </div>
            <div className="signal-waveform">
              <svg viewBox="0 0 640 64" preserveAspectRatio="none" aria-hidden="true">
                {peaks.map((peak, index) => (
                  <rect
                    key={index}
                    x={index * 10 + 2}
                    y={32 - Math.max(4, peak * 29)}
                    width="5"
                    height={Math.max(8, peak * 58)}
                    rx="2.5"
                    className={index / peaks.length < progress ? 'wave-played' : ''}
                  />
                ))}
                {active && (
                  <line
                    x1={progress * 640}
                    x2={progress * 640}
                    y1="0"
                    y2="64"
                    stroke="#0069e0"
                    strokeWidth="2"
                  />
                )}
              </svg>
              <input
                type="range"
                aria-label={`Seek hero preview: ${track.title}`}
                min="0"
                max={active ? player.duration || 1 : 1}
                step="0.1"
                value={active ? player.time : 0}
                disabled={!active || !player.duration}
                onChange={(event) => player.seek(Number(event.target.value))}
              />
            </div>
            <div className="signal-time">
              <span>{clock(active ? player.time : 0)}</span>
              <span>
                {active && player.duration
                  ? clock(player.duration)
                  : 'Original synthesized preview'}
              </span>
            </div>
          </div>
        </div>
      </div>
      <div className="signal-selector" role="group" aria-label="Choose a demo track">
        {beats.map((beat, index) => (
          <button
            key={beat.id}
            aria-pressed={selected === index}
            onClick={(event) => {
              setSelected(index);
              if (player.playing && player.beat?.id !== beat.id) player.toggle(beat);
              if (event.detail && !paused && !reduced) {
                requestAnimationFrame(() => {
                  card.current?.querySelector('.signal-track-name')?.animate(
                    [
                      { opacity: 0.4, transform: 'translateY(5px)' },
                      { opacity: 1, transform: 'translateY(0)' },
                    ],
                    { duration: 220, easing: 'cubic-bezier(0.23, 1, 0.32, 1)' },
                  );
                });
              }
            }}
          >
            <AudioLines size={15} />
            <span>{beat.title}</span>
          </button>
        ))}
      </div>
      <noscript>
        <p className="signal-noscript">
          Enable JavaScript to preview music. You can still create your store below.
        </p>
      </noscript>
    </div>
  );
}
