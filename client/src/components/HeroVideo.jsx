import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import { getVideoPoster } from './VideoCard.jsx';

/* The clip inside the homepage hero card. Muted, looping, inline (so iPhones don't go fullscreen),
   fades in once the first frame is ready, and pauses when scrolled off-screen or the tab is hidden
   to save battery and data. People who prefer reduced motion get a still frame. */
export default function HeroVideo({ src }) {
  const ref = useRef(null);
  const reduce = useReducedMotion();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const v = ref.current;
    if (!v) return undefined;
    v.muted = true; v.defaultMuted = true; v.playsInline = true;
    if (reduce) { v.pause(); return undefined; }
    const play = () => v.play().catch(() => {});
    play();
    const io = new IntersectionObserver(([e]) => (e.isIntersecting ? play() : v.pause()), { threshold: 0.15 });
    io.observe(v);
    const vis = () => (document.visibilityState === 'visible' ? play() : v.pause());
    document.addEventListener('visibilitychange', vis);
    return () => { io.disconnect(); document.removeEventListener('visibilitychange', vis); };
  }, [src, reduce]);

  return (
    <video
      ref={ref}
      className={`hx-card-video ${ready ? 'is-ready' : ''}`}
      src={src}
      poster={getVideoPoster(src)}
      autoPlay={!reduce}
      muted
      loop
      playsInline
      preload="auto"
      disablePictureInPicture
      disableRemotePlayback
      onLoadedData={() => setReady(true)}
    />
  );
}
