import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Page from '../components/Page.jsx';
import Reveal from '../components/Reveal.jsx';
import { Placeholder } from '../components/Nail.jsx';
import { useApp } from '../context.jsx';
import { useTitle } from '../hooks.js';

/* Determine if a URL is a video */
const isVideo = (url = '') => /\.(mp4|webm|mov|ogg)(\?|$)/i.test(url) || url.includes('/video/') || (url.includes('cloudinary') && url.includes('/video/'));

/* Static local gallery assets (from /gallary folder in public) */
const LOCAL_ASSETS = [
  { id: 'local-1',  url: '/gallary/asset1.jpeg', category: 'Latest', title: '', caption: '' },
  { id: 'local-2',  url: '/gallary/asset2.jpg',  category: 'Latest', title: '', caption: '' },
  { id: 'local-3',  url: '/gallary/asset4.png',  category: 'Latest', title: '', caption: '' },
  { id: 'local-4',  url: '/gallary/asset5.webp', category: 'Latest', title: '', caption: '' },
  { id: 'local-v3', url: '/gallary/asset3.mp4',  category: 'Videos', title: '', caption: '' },
  { id: 'local-v6', url: '/gallary/asset6.mp4',  category: 'Videos', title: '', caption: '' },
  { id: 'local-v7', url: '/gallary/asset7.mp4',  category: 'Videos', title: '', caption: '' },
  { id: 'local-v8', url: '/gallary/asset8.mp4',  category: 'Videos', title: '', caption: '' },
  { id: 'local-v9', url: '/gallary/asset9.mp4',  category: 'Videos', title: '', caption: '' },
  { id: 'local-v10',url: '/gallary/asset10.mp4', category: 'Videos', title: '', caption: '' },
  { id: 'local-v11',url: '/gallary/asset11.mp4', category: 'Videos', title: '', caption: '' },
  { id: 'local-v12',url: '/gallary/asset12.mp4', category: 'Videos', title: '', caption: '' },
  { id: 'local-v13',url: '/gallary/asset13.mp4', category: 'Videos', title: '', caption: '' },
  { id: 'local-v14',url: '/gallary/asset14.mp4', category: 'Videos', title: '', caption: '' },
];

/* Video tile with play overlay */
function VideoTile({ src, onClick, label }) {
  const ref = useRef(null);
  const [playing, setPlaying] = useState(false);

  const toggle = (e) => {
    e.stopPropagation();
    if (!ref.current) return;
    if (ref.current.paused) { ref.current.play(); setPlaying(true); }
    else { ref.current.pause(); setPlaying(false); }
  };

  return (
    <button className="tile video-tile" onClick={onClick} aria-label={label || 'Open video'}>
      <video
        ref={ref}
        src={src}
        muted
        playsInline
        loop
        preload="metadata"
        className="tile-video"
        onEnded={() => setPlaying(false)}
      />
      <div className="video-overlay" onClick={toggle}>
        <span className="video-play-btn" aria-label={playing ? 'Pause' : 'Play'}>
          {playing ? (
            <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22"><polygon points="5,3 19,12 5,21"/></svg>
          )}
        </span>
      </div>
      <span className="video-badge">▶ Video</span>
    </button>
  );
}

/* Lightbox video player */
function LightboxVideo({ src }) {
  return (
    <video
      src={src}
      controls
      autoPlay
      playsInline
      className="lb-video"
      onClick={(e) => e.stopPropagation()}
    />
  );
}

export default function Gallery() {
  useTitle('Gallery');
  const { site } = useApp();
  // Merge DB photos with local static assets (deduplicated by id)
  const dbPhotos = site.photos;
  const allItems = [...dbPhotos, ...LOCAL_ASSETS.filter(a => !dbPhotos.some(p => p.url === a.url))];

  const cats = ['All', 'Photos', 'Videos', ...new Set(allItems.filter(p => !['Latest', 'Videos'].includes(p.category)).map(p => p.category))];
  const [cat, setCat] = useState('All');
  const [open, setOpen] = useState(null);

  const list = allItems.filter((p) => {
    if (cat === 'All') return true;
    if (cat === 'Photos') return !isVideo(p.url);
    if (cat === 'Videos') return isVideo(p.url);
    return p.category === cat;
  });

  useEffect(() => {
    if (open === null) return;
    const lenis = window.__lenis;
    lenis?.stop();
    const key = (e) => {
      if (e.key === 'Escape') setOpen(null);
      if (e.key === 'ArrowRight') setOpen((i) => (i + 1) % list.length);
      if (e.key === 'ArrowLeft') setOpen((i) => (i - 1 + list.length) % list.length);
    };
    window.addEventListener('keydown', key);
    return () => { window.removeEventListener('keydown', key); lenis?.start(); };
  }, [open, list.length]);

  return (
    <Page className="container section page-top">
      <Reveal>
        <h1 className="h1s">Gallery</h1>
        <p className="lead">A look at the sets clients ask for most.</p>
      </Reveal>

      {/* Filter tabs */}
      <div className="filters" role="group" aria-label="Filter by style">
        {cats.map((c) => (
          <button key={c} className={`chip ${c === cat ? 'on' : ''}`} onClick={() => { setCat(c); setOpen(null); }}>
            {c === 'Videos' ? '▶ Videos' : c}
          </button>
        ))}
      </div>

      {/* Grid */}
      {list.length ? (
        <div className="masonry">
          {list.map((p, i) => (
            <Reveal key={p.id} delay={Math.min(i, 8) * 0.04} className="mitem">
              {isVideo(p.url) ? (
                <VideoTile src={p.url} onClick={() => setOpen(i)} label={p.title || 'Open video'} />
              ) : (
                <button className="tile" onClick={() => setOpen(i)} aria-label={`Open ${p.title || p.category} photo`}>
                  <img src={p.url} alt={p.title || `${p.category} nails`} loading="lazy" />
                  {(p.title || p.category) && <span className="tile-cap">{p.title || p.category}</span>}
                </button>
              )}
            </Reveal>
          ))}
        </div>
      ) : (
        <>
          <div className="strip big">{[0, 1, 2, 3, 4, 5].map((i) => <Reveal key={i} delay={i * 0.05}><Placeholder i={i} /></Reveal>)}</div>
          <p className="muted">Fresh photos are on the way. Follow on Instagram and TikTok to see the latest sets.</p>
        </>
      )}

      {/* Lightbox */}
      <AnimatePresence>
        {open !== null && list[open] && (
          <motion.div
            className="lightbox"
            role="dialog"
            aria-modal="true"
            aria-label="Media viewer"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(null)}
          >
            {isVideo(list[open].url) ? (
              <LightboxVideo src={list[open].url} />
            ) : (
              <motion.img
                key={list[open].id}
                src={list[open].url}
                alt={list[open].title || `${list[open].category} nails`}
                initial={{ scale: 0.96, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                onClick={(e) => e.stopPropagation()}
              />
            )}
            {(list[open].title || list[open].caption) && (
              <div className="lb-meta" onClick={(e) => e.stopPropagation()}>
                {list[open].title && <strong>{list[open].title}</strong>}
                {list[open].category && <span className="pill">{list[open].category}</span>}
                {list[open].caption && <p>{list[open].caption}</p>}
              </div>
            )}
            <button className="lb-btn close" onClick={() => setOpen(null)} aria-label="Close">✕</button>
            {list.length > 1 && <>
              <button className="lb-btn prev" onClick={(e) => { e.stopPropagation(); setOpen((open - 1 + list.length) % list.length); }} aria-label="Previous">‹</button>
              <button className="lb-btn next" onClick={(e) => { e.stopPropagation(); setOpen((open + 1) % list.length); }} aria-label="Next">›</button>
            </>}
          </motion.div>
        )}
      </AnimatePresence>
    </Page>
  );
}
