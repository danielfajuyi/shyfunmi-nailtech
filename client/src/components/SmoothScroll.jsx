import { useEffect } from 'react';
import Lenis from 'lenis';

export default function SmoothScroll() {
  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
    window.__lenis = lenis;
    let id;
    const raf = (t) => { lenis.raf(t); id = requestAnimationFrame(raf); };
    id = requestAnimationFrame(raf);
    return () => { cancelAnimationFrame(id); lenis.destroy(); window.__lenis = null; };
  }, []);
  return null;
}
