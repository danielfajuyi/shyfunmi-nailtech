import { useEffect, useId, useRef, useState } from 'react';
import {
  animate, motion, useAnimationFrame, useMotionTemplate, useMotionValue, useReducedMotion,
  useScroll, useSpring, useTransform, useVelocity,
} from 'framer-motion';
import { SHAPES } from './Nail.jsx';

export const EASE = [0.22, 1, 0.36, 1];

/* ---------- media query hook ---------- */
export function useMedia(query, initial = false) {
  const [match, setMatch] = useState(() => (typeof matchMedia === 'undefined' ? initial : matchMedia(query).matches));
  useEffect(() => {
    const m = matchMedia(query);
    const f = () => setMatch(m.matches);
    f();
    m.addEventListener('change', f);
    return () => m.removeEventListener('change', f);
  }, [query]);
  return match;
}

/* ---------- Glossy 3D-looking nail (SVG with gradients, highlight and depth) ---------- */
export function GlossNail({ shape = 'Almond', from = '#F6C9DA', to = '#C0558F', className, style }) {
  const id = useId().replace(/:/g, '');
  const d = SHAPES[shape] || SHAPES.Almond;
  return (
    <svg viewBox="0 0 100 116" className={className} style={style} aria-hidden="true">
      <defs>
        <linearGradient id={`${id}f`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={from} />
          <stop offset="1" stopColor={to} />
        </linearGradient>
        <linearGradient id={`${id}g`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity=".85" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <radialGradient id={`${id}r`} cx=".3" cy=".25" r=".9">
          <stop offset="0" stopColor="#fff" stopOpacity=".35" />
          <stop offset=".6" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
        <clipPath id={`${id}c`}><path d={d} /></clipPath>
      </defs>
      <path d={d} fill={`url(#${id}f)`} />
      <g clipPath={`url(#${id}c)`}>
        <rect width="100" height="116" fill={`url(#${id}r)`} />
        <ellipse cx="37" cy="40" rx="9" ry="28" fill={`url(#${id}g)`} transform="rotate(7 37 40)" />
        <path d="M0 96Q50 70 100 98V120H0Z" fill="#000" opacity=".14" />
        <path d="M70 20c4 14 5 30 4 46" stroke="#fff" strokeOpacity=".25" strokeWidth="3" strokeLinecap="round" fill="none" />
      </g>
      <path d={d} fill="none" stroke="#fff" strokeOpacity=".4" strokeWidth="1" />
    </svg>
  );
}

/* ---------- Word-by-word masked reveal ---------- */
export function SplitText({ text, as = 'h2', className = '', delay = 0, stagger = 0.07, immediate = false, accent = [] }) {
  const M = motion[as] || motion.h2;
  const lines = text.split('\n');
  const parent = { hidden: {}, show: { transition: { staggerChildren: stagger, delayChildren: delay } } };
  const child = { hidden: { y: '118%', rotate: 5 }, show: { y: 0, rotate: 0, transition: { duration: 1, ease: EASE } } };
  const trigger = immediate
    ? { animate: 'show' }
    : { whileInView: 'show', viewport: { once: true, margin: '-80px' } };
  return (
    <M className={`hx-split ${className}`} aria-label={text.replace(/\n/g, ' ')} initial="hidden" variants={parent} {...trigger}>
      {lines.map((line, li) => (
        <span key={li} aria-hidden="true" style={{ display: 'block' }}>
          {line.split(' ').map((w, i) => (
            <span className="hx-mask" key={i}>
              <motion.span variants={child} className={accent.includes(w.replace(/[^\w]/g, '')) ? 'hx-accent' : undefined} style={{ display: 'inline-block', transformOrigin: '0 100%' }}>{w}</motion.span>
              {'\u00A0'}
            </span>
          ))}
        </span>
      ))}
    </M>
  );
}

/* ---------- Scroll-scrubbed text: words light up as you scroll ---------- */
function ScrubWord({ children, progress, range }) {
  const opacity = useTransform(progress, range, [0.14, 1]);
  const y = useTransform(progress, range, [10, 0]);
  return <motion.span style={{ opacity, y, display: 'inline-block' }}>{children}{'\u00A0'}</motion.span>;
}
export function ScrubText({ text, className = '' }) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 0.85', 'end 0.5'] });
  const words = text.split(' ');
  return (
    <p ref={ref} className={className} aria-label={text}>
      {words.map((w, i) => (
        <ScrubWord key={i} progress={scrollYProgress} range={[i / words.length, Math.min(1, (i + 1.6) / words.length)]}>{w}</ScrubWord>
      ))}
    </p>
  );
}

/* ---------- 3D tilt card with glare ---------- */
export function TiltCard({ children, className = '', max = 10, disabled = false, style, ...rest }) {
  const reduce = useReducedMotion();
  const px = useMotionValue(0.5), py = useMotionValue(0.5), go = useMotionValue(0);
  const sx = useSpring(px, { stiffness: 220, damping: 22 });
  const sy = useSpring(py, { stiffness: 220, damping: 22 });
  const sg = useSpring(go, { stiffness: 160, damping: 24 });
  const rotateY = useTransform(sx, [0, 1], [-max, max]);
  const rotateX = useTransform(sy, [0, 1], [max, -max]);
  const gx = useTransform(sx, (v) => `${v * 100}%`);
  const gy = useTransform(sy, (v) => `${v * 100}%`);
  const glare = useMotionTemplate`radial-gradient(circle at ${gx} ${gy}, rgba(255,255,255,.38), transparent 55%)`;
  if (reduce || disabled) return <div className={className} style={style} {...rest}>{children}</div>;
  const move = (e) => {
    if (e.pointerType === 'touch') return;
    const r = e.currentTarget.getBoundingClientRect();
    px.set((e.clientX - r.left) / r.width); py.set((e.clientY - r.top) / r.height); go.set(1);
  };
  const leave = () => { px.set(0.5); py.set(0.5); go.set(0); };
  return (
    <div className="hx-tilt-wrap" style={{ perspective: 1000 }}>
      <motion.div className={className} onPointerMove={move} onPointerLeave={leave}
        style={{ ...style, rotateX, rotateY, transformStyle: 'preserve-3d' }} {...rest}>
        {children}
        <motion.span className="hx-glare" aria-hidden="true" style={{ background: glare, opacity: sg }} />
      </motion.div>
    </div>
  );
}

/* ---------- Magnetic wrapper (buttons drift toward the cursor) ---------- */
export function Magnetic({ children, strength = 0.35, className = '' }) {
  const reduce = useReducedMotion();
  const ref = useRef(null);
  const x = useSpring(0, { stiffness: 220, damping: 16, mass: 0.4 });
  const y = useSpring(0, { stiffness: 220, damping: 16, mass: 0.4 });
  if (reduce) return <span className={className} style={{ display: 'inline-block' }}>{children}</span>;
  const move = (e) => {
    if (e.pointerType === 'touch') return;
    const r = ref.current.getBoundingClientRect();
    x.set((e.clientX - (r.left + r.width / 2)) * strength);
    y.set((e.clientY - (r.top + r.height / 2)) * strength);
  };
  const leave = () => { x.set(0); y.set(0); };
  return <motion.span ref={ref} className={className} onPointerMove={move} onPointerLeave={leave} style={{ x, y, display: 'inline-block' }}>{children}</motion.span>;
}

/* ---------- Scroll progress hairline ---------- */
export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 140, damping: 30, restDelta: 0.001 });
  return <motion.div className="hx-progress" style={{ scaleX }} aria-hidden="true" />;
}

/* ---------- Marquee that speeds up and reverses with scroll velocity ---------- */
const wrap = (min, max, v) => { const r = max - min; return ((((v - min) % r) + r) % r) + min; };
export function VelocityMarquee({ items, base = -0.035 }) {
  const reduce = useReducedMotion();
  const x = useMotionValue(0);
  const { scrollY } = useScroll();
  const vel = useVelocity(scrollY);
  const smooth = useSpring(vel, { damping: 50, stiffness: 400 });
  const boost = useTransform(smooth, [0, 1200], [0, 5], { clamp: false });
  const dir = useRef(1);
  useAnimationFrame((_, delta) => {
    if (reduce) return;
    const b = boost.get();
    if (b < -0.01) dir.current = -1; else if (b > 0.01) dir.current = 1;
    // dir 1 drifts left, -1 drifts right; scrolling hard multiplies the speed
    const speed = Math.abs(base) * delta * (1 + Math.abs(b));
    x.set(wrap(-50, 0, x.get() - dir.current * speed));
  });
  const tx = useMotionTemplate`${x}%`;
  const list = [...items, ...items];
  return (
    <div className="hx-marquee-wrap" aria-hidden="true">
      <div className="hx-marquee">
        <motion.div className="hx-track" style={{ x: tx }}>
          {list.map((w, i) => (
            <span key={i} className={(i % items.length) % 2 ? 'solid' : 'outline'}>{w}<em>✦</em></span>
          ))}
        </motion.div>
      </div>
    </div>
  );
}

/* ---------- Count-up number (dashboard stats). Non-numeric values pass through untouched ---------- */
export function CountUp({ to, duration = 1.1 }) {
  const reduce = useReducedMotion();
  const n = Number(to);
  const ok = to !== null && to !== undefined && String(to).trim() !== '' && Number.isFinite(n);
  const last = useRef(0);
  const [v, setV] = useState(ok && !reduce ? 0 : to);
  useEffect(() => {
    if (!ok || reduce) { setV(to); return undefined; }
    const c = animate(last.current, n, {
      duration, ease: EASE,
      onUpdate: (x) => { last.current = x; setV(Math.round(x)); },
    });
    return () => c.stop();
  }, [n, ok, reduce, duration, to]);
  return <>{v}</>;
}

/* ---------- Giant footer wordmark that rises into view ---------- */
export function FootMark({ text }) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end end'] });
  const y = useTransform(scrollYProgress, [0, 1], ['45%', '0%']);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [0, 1]);
  return (
    <div ref={ref} className="foot-mark" aria-hidden="true">
      <motion.span style={{ y, opacity }}>{text}</motion.span>
    </div>
  );
}
