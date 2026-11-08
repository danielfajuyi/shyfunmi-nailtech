/* Keeps the page fitted to the screen.

   Problem: after leaving a tab/app and coming back (or using Back/Forward), mobile browsers
   sometimes restore the page zoomed out or with a sideways offset until the user refreshes.
   Fix: whenever the page is shown again, or it is detected to be zoomed out / wider than the
   screen, re-apply the viewport tag (this makes the browser recompute zoom + layout width) and
   tell Lenis to re-measure. Pinch-zoom IN stays available; minimum-scale=1 stops zooming OUT. */

const FIT = 'width=device-width, initial-scale=1, minimum-scale=1, viewport-fit=cover';
let cooling = false;

function overflowing() {
  const de = document.documentElement;
  return de.scrollWidth > window.innerWidth + 1;
}
function zoomedOut() {
  const vv = window.visualViewport;
  return !!vv && vv.scale < 0.995;
}

function refit(reason) {
  const meta = document.querySelector('meta[name="viewport"]');
  if (!meta || cooling) return;
  cooling = true;
  // 1) briefly pin the scale to 1: browsers reset their zoom to match
  meta.setAttribute('content', `${FIT}, maximum-scale=1`);
  // 2) put the normal tag back so people can still pinch-zoom IN
  requestAnimationFrame(() => requestAnimationFrame(() => {
    meta.setAttribute('content', FIT);
    // 3) forget any stale horizontal offset and let smooth-scroll re-measure
    if (window.scrollX !== 0) window.scrollTo(0, window.scrollY);
    document.documentElement.classList.remove('lenis-stopped');
    if (document.querySelector('[role="dialog"], .side.open')) document.documentElement.classList.add('lenis-stopped');
    try { window.__lenis?.resize(); } catch { /* noop */ }
    window.dispatchEvent(new Event('resize'));
    setTimeout(() => { cooling = false; }, 350);
  }));
  if (import.meta.env?.DEV) console.debug('[viewportGuard] refit:', reason);
}

export function installViewportGuard() {
  if (typeof window === 'undefined' || window.__viewportGuard) return;
  window.__viewportGuard = true;

  // Page shown again (including restore from the back/forward cache)
  window.addEventListener('pageshow', (e) => {
    if (e.persisted || zoomedOut() || overflowing()) refit('pageshow');
  });
  // Tab / app switched back to
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && (zoomedOut() || overflowing())) refit('visible');
  });
  window.addEventListener('focus', () => { if (zoomedOut() || overflowing()) refit('focus'); });
  window.addEventListener('orientationchange', () => setTimeout(() => refit('orientation'), 250));

  // Zoom level changed on its own (not by the user pinching in)
  let t;
  const check = () => { clearTimeout(t); t = setTimeout(() => { if (zoomedOut() || overflowing()) refit('resize'); }, 180); };
  window.visualViewport?.addEventListener('resize', check);
  window.addEventListener('resize', check);

  // First paint: if the page already loads wider than the screen, fix it right away
  window.addEventListener('load', () => { if (overflowing()) refit('load'); });

  // Debug helper: run __findOverflow() in the console to list elements that stick out
  window.__findOverflow = () => [...document.querySelectorAll('body *')]
    .filter((el) => el.getBoundingClientRect().right > window.innerWidth + 1)
    .map((el) => ({ el, right: Math.round(el.getBoundingClientRect().right) }));
}
