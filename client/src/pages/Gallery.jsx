import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Page from '../components/Page.jsx';
import Reveal from '../components/Reveal.jsx';
import { Placeholder } from '../components/Nail.jsx';
import { useApp } from '../context.jsx';
import { useTitle } from '../hooks.js';
import VideoCard from '../components/VideoCard.jsx';
import VideoModal from '../components/VideoModal.jsx';
import { CloseIcon, ChevronLeftIcon, ChevronRightIcon } from '../components/Icons.jsx';

/* Determine if a URL is a video */
const isVideo = (url = '') => /\.(mp4|webm|mov|ogg)(\?|$)/i.test(url) || url.includes('/video/') || url.includes('video/upload/');

export default function Gallery() {
  useTitle('Gallery');
  const { site } = useApp();
  // Sort all gallery photos & videos based on latest upload first
  const allItems = [...(site.photos || [])].sort(
    (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
  );

  const cats = ['All', 'Photos', 'Videos', ...new Set(allItems.filter(p => !['Latest', 'Videos'].includes(p.category)).map(p => p.category))];
  const [cat, setCat] = useState('All');
  const [openIndex, setOpenIndex] = useState(null);

  const list = allItems.filter((p) => {
    if (cat === 'All') return true;
    if (cat === 'Photos') return !isVideo(p.url);
    if (cat === 'Videos') return isVideo(p.url);
    return p.category === cat;
  });

  const activeItem = openIndex !== null ? list[openIndex] : null;

  useEffect(() => {
    if (openIndex === null) return;
    const lenis = window.__lenis;
    lenis?.stop();
    const key = (e) => {
      if (e.key === 'Escape') setOpenIndex(null);
      if (e.key === 'ArrowRight') setOpenIndex((i) => (i + 1) % list.length);
      if (e.key === 'ArrowLeft') setOpenIndex((i) => (i - 1 + list.length) % list.length);
    };
    window.addEventListener('keydown', key);
    return () => { window.removeEventListener('keydown', key); lenis?.start(); };
  }, [openIndex, list.length]);

  return (
    <Page className="container section page-top gallery-page-wrap">
      <Reveal>
        <h1 className="h1s">Gallery</h1>
        <p className="lead">A look at the sets clients ask for most.</p>
      </Reveal>

      {/* Filter tabs */}
      <div className="filters" role="group" aria-label="Filter by style">
        {cats.map((c) => (
          <button
            key={c}
            className={`chip ${c === cat ? 'on' : ''}`}
            onClick={() => { setCat(c); setOpenIndex(null); }}
          >
            {c === 'Videos' ? '▶ Videos' : c}
          </button>
        ))}
      </div>

      {/* Grid container with mobile-safe layout */}
      {list.length ? (
        <div className="masonry gallery-grid-fixed">
          {list.map((p, i) => (
            <div key={p.id} className="mitem">
              {isVideo(p.url) ? (
                <VideoCard
                  video={p}
                  onClick={() => setOpenIndex(i)}
                />
              ) : (
                <button
                  className="tile photo-tile"
                  onClick={() => setOpenIndex(i)}
                  aria-label={`Open ${p.title || p.category} photo`}
                >
                  <img src={p.url} alt={p.title || `${p.category} nails`} loading="lazy" />
                  <div className="tile-cap">
                    <span>{p.title || p.category}</span>
                  </div>
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <>
          <div className="strip big">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <Reveal key={i} delay={i * 0.05}><Placeholder i={i} /></Reveal>
            ))}
          </div>
          <p className="muted">Fresh photos are on the way. Follow on Instagram and TikTok to see the latest sets.</p>
        </>
      )}

      {/* Cinematic Modal (Video or Photo) */}
      <AnimatePresence>
        {activeItem && isVideo(activeItem.url) && (
          <VideoModal
            item={activeItem}
            onClose={() => setOpenIndex(null)}
            onPrev={() => setOpenIndex((openIndex - 1 + list.length) % list.length)}
            onNext={() => setOpenIndex((openIndex + 1) % list.length)}
            hasPrev={list.length > 1}
            hasNext={list.length > 1}
          />
        )}

        {activeItem && !isVideo(activeItem.url) && (
          <motion.div
            className="lightbox"
            role="dialog"
            aria-modal="true"
            aria-label="Photo viewer"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpenIndex(null)}
          >
            <motion.img
              key={activeItem.id}
              src={activeItem.url}
              alt={activeItem.title || `${activeItem.category} nails`}
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3 }}
              onClick={(e) => e.stopPropagation()}
            />
            {(activeItem.title || activeItem.caption || activeItem.category) && (
              <div className="lb-meta" onClick={(e) => e.stopPropagation()}>
                {activeItem.title && <strong>{activeItem.title}</strong>}
                {activeItem.category && <span className="pill">{activeItem.category}</span>}
                {activeItem.caption && <p>{activeItem.caption}</p>}
              </div>
            )}
            <button className="lb-btn close" onClick={() => setOpenIndex(null)} aria-label="Close">
              <CloseIcon size={20} />
            </button>
            {list.length > 1 && (
              <>
                <button
                  className="lb-btn prev"
                  onClick={(e) => { e.stopPropagation(); setOpenIndex((openIndex - 1 + list.length) % list.length); }}
                  aria-label="Previous"
                >
                  <ChevronLeftIcon size={24} />
                </button>
                <button
                  className="lb-btn next"
                  onClick={(e) => { e.stopPropagation(); setOpenIndex((openIndex + 1) % list.length); }}
                  aria-label="Next"
                >
                  <ChevronRightIcon size={24} />
                </button>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </Page>
  );
}
