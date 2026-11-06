import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

/* Elements that fade/lift in as they scroll into view. Pages that already use
   <Reveal> or framer inline styles are skipped automatically (see prep()). */
const SEL = [
  '.card', '.stat', '.bitem', '.profile-hero', '.profile-stat', '.loyalty-card', '.table-wrap',
  '.timeline-item', '.faq-item', '.summary-card', '.svc-grid > *', '.mitem', '.alert-chip',
  '.agrid > *', '.accts-grid > *', '.note-box', '.ticks li', '.hours li', '.stepper', '.dash-head',
  '.tabs', '.toolbar', '.filters',
].join(',');
const SKIP = '[data-fx-skip], .hx-sec, .hx-rail, .hx-hero, .modal-overlay, .lightbox, [role="dialog"]';

function prep(el, io) {
  if (el.__fx || el.closest(SKIP)) return;
  if (el.style.opacity !== '' || el.style.transform) return; // framer-managed, leave alone
  el.__fx = true;
  const p = el.parentElement;
  const idx = p ? Array.prototype.indexOf.call(p.children, el) : 0;
  el.style.setProperty('--fx-d', `${Math.min(idx, 8) * 0.07}s`);
  el.classList.add('fx');
  io.observe(el);
}

function useAutoReveal() {
  const { pathname } = useLocation();
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined' || matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    const timers = new Set();
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        const el = e.target;
        io.unobserve(el);
        el.classList.add('fx-in');
        // Hand the element back to its own styles once the entrance is done (keeps hover effects intact)
        const t = setTimeout(() => { el.classList.remove('fx', 'fx-in'); el.style.removeProperty('--fx-d'); timers.delete(t); }, 1600);
        timers.add(t);
      });
    }, { rootMargin: '0px 0px -6% 0px', threshold: 0.06 });

    const scan = (root) => {
      if (root.matches?.(SEL)) prep(root, io);
      root.querySelectorAll?.(SEL).forEach((el) => prep(el, io));
    };
    scan(document.body);
    const mo = new MutationObserver((muts) => {
      muts.forEach((m) => m.addedNodes.forEach((n) => { if (n.nodeType === 1) scan(n); }));
    });
    mo.observe(document.body, { childList: true, subtree: true });
    return () => {
      mo.disconnect(); io.disconnect();
      timers.forEach(clearTimeout);
      document.querySelectorAll('.fx').forEach((el) => { el.classList.remove('fx', 'fx-in'); el.__fx = false; });
    };
  }, [pathname]);
}

/* Soft ring + dot cursor for mouse users. Grows over links/buttons, hides over text fields. */
function Cursor() {
  const ring = useRef(null);
  const dot = useRef(null);
  useEffect(() => {
    if (!matchMedia('(pointer: fine)').matches || matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    let x = -100, y = -100, rx = -100, ry = -100, s = 1, ts = 1, vis = 0, raf = 0;
    const move = (e) => { x = e.clientX; y = e.clientY; vis = 1; };
    const over = (e) => {
      const t = e.target;
      if (!t || !t.closest) return;
      if (t.closest('input, textarea, select')) ts = 0;
      else if (t.closest('a, button, [role="button"], summary, label, .tile, .chip')) ts = 2.1;
      else ts = 1;
    };
    const leave = () => { vis = 0; };
    const loop = () => {
      rx += (x - rx) * 0.2; ry += (y - ry) * 0.2; s += (ts - s) * 0.18;
      if (ring.current) {
        ring.current.style.transform = `translate3d(${rx}px,${ry}px,0) translate(-50%,-50%) scale(${s})`;
        ring.current.style.opacity = ts === 0 ? 0 : vis;
        ring.current.classList.toggle('hot', ts > 1);
      }
      if (dot.current) {
        dot.current.style.transform = `translate3d(${x}px,${y}px,0) translate(-50%,-50%) scale(${ts > 1 ? 0 : 1})`;
        dot.current.style.opacity = ts === 0 ? 0 : vis;
      }
      raf = requestAnimationFrame(loop);
    };
    window.addEventListener('pointermove', move, { passive: true });
    window.addEventListener('pointerover', over, { passive: true });
    document.documentElement.addEventListener('pointerleave', leave);
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerover', over);
      document.documentElement.removeEventListener('pointerleave', leave);
    };
  }, []);
  return (<><div ref={ring} className="fx-cursor ring" aria-hidden="true" /><div ref={dot} className="fx-cursor dot" aria-hidden="true" /></>);
}

export default function FxLayer({ cursor = false }) {
  useAutoReveal();
  return cursor ? <Cursor /> : null;
}
