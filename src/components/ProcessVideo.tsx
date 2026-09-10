'use client';

import { useState } from 'react';

interface ProcessVideoProps {
  src: string;     // e.g. '/videos/ring-making-process.mp4'
  poster: string;  // e.g. '/images/process-poster.jpg' — a still frame from the video
  title: string;
}

/**
 * Self-hosted video, but not loaded at all until the visitor clicks play.
 * The <video> element isn't mounted in the page until `playing` is true, so
 * there is zero extra network weight on page load — only the poster image
 * (a normal small jpg) costs anything up front, same as any other photo.
 */
export default function ProcessVideo({ src, poster, title }: ProcessVideoProps) {
  const [playing, setPlaying] = useState(false);
  const [posterFailed, setPosterFailed] = useState(false);

  if (playing) {
    return (
      <div style={{ width: '100%', aspectRatio: '16/9', background: '#111', overflow: 'hidden' }}>
        <video
          src={src}
          controls
          autoPlay
          playsInline
          preload="none"
          style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block', background: '#000' }}
        />
      </div>
    );
  }

  return (
    <button
      onClick={() => setPlaying(true)}
      aria-label={`Play video: ${title}`}
      style={{
        position: 'relative', width: '100%', aspectRatio: '16/9',
        background: '#1a0a0a', overflow: 'hidden', cursor: 'pointer',
        border: 'none', padding: 0, display: 'block',
      }}
    >
      {!posterFailed ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={poster}
          alt={title}
          onError={() => setPosterFailed(true)}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', opacity: 0.82 }}
        />
      ) : (
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, #2a1a10 0%, #1a0a0a 100%)' }} />
      )}
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{
          width: 68, height: 68, borderRadius: '50%', background: 'rgba(255,255,255,0.94)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'transform 0.2s',
        }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="#1a0a0a"><path d="M8 5v14l11-7z" /></svg>
        </div>
      </div>
      <span style={{
        position: 'absolute', bottom: 16, left: 20, color: '#fff',
        fontFamily: 'var(--font-sans)', fontSize: 11, fontWeight: 600,
        letterSpacing: '0.14em', textTransform: 'uppercase',
      }}>
        {title}
      </span>
    </button>
  );
}
