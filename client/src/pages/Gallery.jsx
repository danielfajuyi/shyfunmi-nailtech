import { useState } from 'react';
import Page from '../components/Page.jsx';
import Reveal from '../components/Reveal.jsx';
import PageHero from '../components/PageHero.jsx';
import { TiltCard } from '../components/motion.jsx';
import { Placeholder } from '../components/Nail.jsx';
import { useApp } from '../context.jsx';
import { useTitle } from '../hooks.js';
import VideoCard from '../components/VideoCard.jsx';
import MediaViewer from '../components/MediaViewer.jsx';
import { PlayIcon } from '../components/Icons.jsx';
import { isVideo } from '../utils.js';

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

  return (
    <Page className="container section page-top gallery-page-wrap">
      <PageHero kicker="Portfolio" title="Gallery" lead="A look at the sets clients ask for most." />

      {/* Filter tabs */}
      <div className="filters" role="group" aria-label="Filter by style">
        {cats.map((c) => (
          <button
            key={c}
            className={`chip ${c === cat ? 'on' : ''}`}
            onClick={() => { setCat(c); setOpenIndex(null); }}
          >
            {c === 'Videos' ? <><PlayIcon size={11} /> Videos</> : c}
          </button>
        ))}
      </div>

      {/* Grid container with mobile-safe layout */}
      {list.length ? (
        <div className="masonry gallery-grid-fixed">
          {list.map((p, i) => (
            <div key={p.id} className="mitem">
              <TiltCard className="hx-work-card" max={7}>
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
              </TiltCard>
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

      {/* Same viewer the admin media library uses: cinematic player for video, lightbox for photos */}
      <MediaViewer list={list} index={openIndex} onIndex={setOpenIndex} onClose={() => setOpenIndex(null)} />
    </Page>
  );
}
