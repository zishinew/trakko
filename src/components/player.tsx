'use client';
import { createContext, useContext, useRef, useState, useCallback } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, X, AudioLines } from 'lucide-react';
import type { Beat } from '@/lib/types';
import { post } from '@/lib/client';
type PlayerState = {
  beat: Beat | null;
  playing: boolean;
  time: number;
  duration: number;
  toggle: (beat: Beat) => void;
  seek: (time: number) => void;
};
const PlayerContext = createContext<PlayerState | null>(null);
export function usePlayer() {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error('Player missing');
  return ctx;
}
const clock = (v: number) => `${Math.floor(v / 60)}:${String(Math.floor(v % 60)).padStart(2, '0')}`;
export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const audio = useRef<HTMLAudioElement>(null);
  const [beat, setBeat] = useState<Beat | null>(null),
    [playing, setPlaying] = useState(false),
    [time, setTime] = useState(0),
    [duration, setDuration] = useState(0),
    [volume, setVolume] = useState(0.75),
    [error, setError] = useState('');
  const toggle = useCallback(
    (next: Beat) => {
      const a = audio.current;
      if (!a) return;
      if (!next.preview_url) {
        setError('This preview is not available yet.');
        return;
      }
      setError('');
      if (beat?.id !== next.id) {
        a.pause();
        a.src = next.preview_url;
        setBeat(next);
        setTime(0);
        setDuration(0);
        a.load();
      } else if (!a.paused) {
        a.pause();
        return;
      }
      a.volume = volume;
      void a
        .play()
        .then(() => {
          if (beat?.id !== next.id) void post('/api/plays', { beat_id: next.id }).catch(() => {});
        })
        .catch((error: unknown) => {
          if (error instanceof DOMException && error.name === 'AbortError') return;
          setPlaying(false);
          setError('Unable to play this preview. Please try again.');
        });
    },
    [beat, volume],
  );
  function seek(v: number) {
    if (audio.current && Number.isFinite(v)) {
      audio.current.currentTime = v;
      setTime(v);
    }
  }
  return (
    <PlayerContext.Provider value={{ beat, playing, time, duration, toggle, seek }}>
      {children}
      <audio
        ref={audio}
        preload="metadata"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onTimeUpdate={() => setTime(audio.current?.currentTime || 0)}
        onLoadedMetadata={() =>
          setDuration(Number.isFinite(audio.current?.duration) ? audio.current!.duration : 0)
        }
        onEnded={() => setPlaying(false)}
        onError={() => {
          setError('This preview is unavailable.');
          setPlaying(false);
        }}
      />
      {error && (
        <div className="player-error" role="alert">
          {error}
          <button
            className="icon-button"
            aria-label="Dismiss playback error"
            onClick={() => setError('')}
          >
            <X size={16} />
          </button>
        </div>
      )}
      {beat && (
        <div className="persistent-player">
          <div className="player-track">
            <img src={beat.cover_url || '/demo/cover-1.svg'} alt="" />
            <div>
              <strong>{beat.title}</strong>
              <span>
                {beat.bpm} BPM · {beat.musical_key}
              </span>
            </div>
            <AudioLines size={18} className={playing ? 'accent' : 'muted'} />
          </div>
          <div className="player-center">
            <div className="transport">
              <button
                className="icon-button"
                aria-label="Back 10 seconds"
                onClick={() => seek(Math.max(0, time - 10))}
              >
                <SkipBack size={16} />
              </button>
              <button
                className="player-play"
                aria-label={playing ? 'Pause' : 'Play'}
                onClick={() => toggle(beat)}
              >
                {playing ? (
                  <Pause size={18} fill="currentColor" />
                ) : (
                  <Play size={18} fill="currentColor" />
                )}
              </button>
              <button
                className="icon-button"
                aria-label="Forward 10 seconds"
                onClick={() => seek(Math.min(duration, time + 10))}
              >
                <SkipForward size={16} />
              </button>
            </div>
            <div className="player-seek">
              <span>{clock(time)}</span>
              <input
                aria-label="Seek preview"
                disabled={!duration}
                type="range"
                min="0"
                max={duration || 1}
                step="0.1"
                value={time}
                onChange={(e) => seek(Number(e.target.value))}
              />
              <span>{clock(duration)}</span>
            </div>
          </div>
          <div className="player-volume">
            <button
              className="icon-button"
              aria-label={volume ? 'Mute' : 'Unmute'}
              onClick={() => {
                const v = volume ? 0 : 0.75;
                setVolume(v);
                if (audio.current) audio.current.volume = v;
              }}
            >
              {volume ? <Volume2 size={18} /> : <VolumeX size={18} />}
            </button>
            <input
              aria-label="Volume"
              type="range"
              min="0"
              max="1"
              step=".01"
              value={volume}
              onChange={(e) => {
                const v = Number(e.target.value);
                setVolume(v);
                if (audio.current) audio.current.volume = v;
              }}
            />
            <button
              className="icon-button"
              aria-label="Close player"
              onClick={() => {
                audio.current?.pause();
                setBeat(null);
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}
    </PlayerContext.Provider>
  );
}
export function PlayButton({ beat, large = false }: { beat: Beat; large?: boolean }) {
  const p = usePlayer();
  const active = p.beat?.id === beat.id && p.playing;
  return (
    <button
      className={`play-button ${large ? 'large' : ''} ${active ? 'active' : ''}`}
      aria-label={`${active ? 'Pause' : 'Play'} ${beat.title}`}
      onClick={() => p.toggle(beat)}
    >
      {active ? (
        <Pause size={large ? 22 : 16} fill="currentColor" />
      ) : (
        <Play size={large ? 22 : 16} fill="currentColor" />
      )}
    </button>
  );
}
export function PreviewProgress({ beat }: { beat: Beat }) {
  const p = usePlayer();
  const current = p.beat?.id === beat.id;
  return (
    <div className="preview-progress">
      <AudioLines size={14} className={current && p.playing ? 'accent' : 'muted'} />
      <input
        aria-label={`Seek ${beat.title}`}
        type="range"
        min={0}
        max={current ? p.duration || 1 : 1}
        step="0.1"
        value={current ? p.time : 0}
        disabled={!current || !p.duration}
        onChange={(e) => p.seek(Number(e.target.value))}
      />
      <span>{current && p.duration ? clock(p.duration) : '—:—'}</span>
    </div>
  );
}
