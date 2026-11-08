import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import VideoModal from './VideoModal.jsx';
import { CloseIcon, ChevronLeftIcon, ChevronRightIcon } from './Icons.jsx';
import { isVideo } from '../utils.js';

/* One viewer for every gallery surface (public gallery + admin media library).
   Videos open in the cinematic player, photos in the lightbox. */
export default function MediaViewer({ list, index, onIndex, onClose }) {
  const item = index !== null && index !== undefined ? list[index] : null;
  const count = list.length;
  const go = (d) => onIndex((index + d + count) % count);

  useEffect(() => {
    if (!item) return undefined;
    const lenis = window.__lenis;
    lenis?.stop();
    const photo = !isVideo(item.url);
    const key = (e) => {
      if (!photo) return; // the video player owns its own keyboard shortcuts
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') go(1);
      if (e.key === 'ArrowLeft') go(-1);
    };
    window.addEventListener('keydown', key);
    return () => { window.removeEventListener('keydown', key); lenis?.start(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item?.id, count]);

  return (
    <AnimatePresence>
      {item && isVideo(item.url) && (
        <VideoModal
          key="video"
          item={item}
          onClose={onClose}
          onPrev={() => go(-1)}
          onNext={() => go(1)}
          hasPrev={count > 1}
          hasNext={count > 1}
        />
      )}

      {item && !isVideo(item.url) && (
        <motion.div
          key="photo"
          className="lightbox"
          role="dialog"
          aria-modal="true"
          aria-label="Photo viewer"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.img
            key={item.id}
            src={item.url}
            alt={item.title || `${item.category} nails`}
            initial={{ scale: 0.96, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
            onClick={(e) => e.stopPropagation()}
          />
          {(item.title || item.caption || item.category) && (
            <div className="lb-meta" onClick={(e) => e.stopPropagation()}>
              {item.title && <strong>{item.title}</strong>}
              {item.category && <span className="pill">{item.category}</span>}
              {item.caption && <p>{item.caption}</p>}
            </div>
          )}
          <button className="lb-btn close" onClick={onClose} aria-label="Close">
            <CloseIcon size={20} />
          </button>
          {count > 1 && (
            <>
              <button className="lb-btn prev" onClick={(e) => { e.stopPropagation(); go(-1); }} aria-label="Previous">
                <ChevronLeftIcon size={24} />
              </button>
              <button className="lb-btn next" onClick={(e) => { e.stopPropagation(); go(1); }} aria-label="Next">
                <ChevronRightIcon size={24} />
              </button>
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
