import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Page from '../components/Page.jsx';
import Reveal from '../components/Reveal.jsx';
import { Placeholder } from '../components/Nail.jsx';
import { useApp } from '../context.jsx';
import { useTitle } from '../hooks.js';

export default function Gallery() {
  useTitle('Gallery');
  const { site } = useApp();
  const photos = site.photos;
  const cats = ['All', ...new Set(photos.map((p) => p.category))];
  const [cat, setCat] = useState('All');
  const [open, setOpen] = useState(null);
  const list = photos.filter((p) => cat === 'All' || p.category === cat);

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
      <Reveal><h1 className="h1s">Gallery</h1><p className="lead">A look at the sets clients ask for most.</p></Reveal>
      {photos.length > 0 && (
        <div className="filters" role="group" aria-label="Filter by style">
          {cats.map((c) => <button key={c} className={`chip ${c === cat ? 'on' : ''}`} onClick={() => { setCat(c); setOpen(null); }}>{c}</button>)}
        </div>
      )}
      {photos.length ? (
        <div className="masonry">
          {list.map((p, i) => (
            <Reveal key={p.id} delay={Math.min(i, 8) * 0.04} className="mitem">
              <button className="tile" onClick={() => setOpen(i)} aria-label={`Open ${p.title || p.category} photo`}>
                <img src={p.url} alt={p.title || `${p.category} nails`} loading="lazy" />
                {(p.title || p.category) && <span className="tile-cap">{p.title || p.category}</span>}
              </button>
            </Reveal>
          ))}
        </div>
      ) : (
        <>
          <div className="strip big">{[0, 1, 2, 3, 4, 5].map((i) => <Reveal key={i} delay={i * 0.05}><Placeholder i={i} /></Reveal>)}</div>
          <p className="muted">Fresh photos are on the way. Follow on Instagram and TikTok to see the latest sets.</p>
        </>
      )}
      <AnimatePresence>
        {open !== null && list[open] && (
          <motion.div className="lightbox" role="dialog" aria-modal="true" aria-label="Photo viewer" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(null)}>
            <motion.img key={list[open].id} src={list[open].url} alt={list[open].title || `${list[open].category} nails`} initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} onClick={(e) => e.stopPropagation()} />
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
