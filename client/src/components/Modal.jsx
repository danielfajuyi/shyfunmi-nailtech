import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CloseIcon } from './Icons.jsx';

/* Dialog. Centered card on desktop, bottom sheet on phones (see .modal-* in admin.css).
   `footer` is pinned under the scrolling body so Save / Delete are always reachable. */
export default function Modal({ isOpen, onClose, title, subtitle, children, footer, maxWidth = 560 }) {
  useEffect(() => {
    if (!isOpen) return undefined;
    const lenis = window.__lenis;
    lenis?.stop();
    const prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKey);
    return () => {
      window.removeEventListener('keydown', handleKey);
      document.documentElement.style.overflow = prev;
      lenis?.start();
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="modal-overlay"
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-label={title || 'Dialog'}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
        >
          <motion.div
            className="modal-box"
            style={{ '--modal-w': `${maxWidth}px` }}
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
            data-lenis-prevent
          >
            <div className="modal-head">
              <div className="modal-titles">
                {title && <h3>{title}</h3>}
                {subtitle && <p>{subtitle}</p>}
              </div>
              <button type="button" className="icon-btn modal-close" onClick={onClose} aria-label="Close dialog">
                <CloseIcon size={18} />
              </button>
            </div>
            <div className="modal-body">{children}</div>
            {footer && <div className="modal-foot">{footer}</div>}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
