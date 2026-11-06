import { useEffect } from 'react';
import { motion, useAnimationFrame, useMotionValue, useReducedMotion, useSpring, useTransform } from 'framer-motion';
import { EASE, GlossNail, SplitText } from './motion.jsx';
import '../home.css';

const MINI = [
  { shape: 'Almond', from: '#F8CFE0', to: '#C0558F', x: '6%', y: '44%', w: 96, z: 90, rot: -16, d: 0 },
  { shape: 'Coffin', from: '#8E4BB0', to: '#2A1233', x: '38%', y: '6%', w: 108, z: 150, rot: 10, d: 0.7 },
  { shape: 'Stiletto', from: '#8FA2FF', to: '#2D4BE0', x: '68%', y: '50%', w: 88, z: 60, rot: 20, d: 1.3 },
];

/* Small 3D cluster used in page headers: tilts toward the cursor, floats on its own */
export function MiniScene() {
  const reduce = useReducedMotion();
  const mx = useMotionValue(0), my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 80, damping: 16 });
  const sy = useSpring(my, { stiffness: 80, damping: 16 });
  const ix = useMotionValue(0), iy = useMotionValue(0);
  useAnimationFrame((t) => { if (reduce) return; ix.set(Math.sin(t / 1700)); iy.set(Math.cos(t / 2300)); });
  const rotateY = useTransform([sx, ix], ([a, b]) => a * 16 + b * 6);
  const rotateX = useTransform([sy, iy], ([a, b]) => -a * 12 + b * 4);
  useEffect(() => {
    if (reduce) return undefined;
    const f = (e) => {
      if (e.pointerType === 'touch') return;
      mx.set((e.clientX / window.innerWidth - 0.5) * 2);
      my.set((e.clientY / window.innerHeight - 0.5) * 2);
    };
    window.addEventListener('pointermove', f, { passive: true });
    return () => window.removeEventListener('pointermove', f);
  }, [reduce, mx, my]);
  return (
    <div className="ph-scene" aria-hidden="true">
      <motion.div className="hx-stage" style={{ rotateX, rotateY }}>
        <div className="ph-disc" />
        <div className="hx-ring a" />
        {MINI.map((n, i) => (
          <div key={i} className="hx-nail-layer" style={{ left: n.x, top: n.y, width: n.w, transform: `translateZ(${n.z}px)` }}>
            <motion.div initial={{ rotate: n.rot, opacity: 0, y: 30 }}
              animate={reduce ? { opacity: 1, y: 0 } : { opacity: 1, y: [0, -14, 0], rotate: [n.rot - 5, n.rot + 5, n.rot - 5] }}
              transition={reduce ? undefined : { opacity: { duration: 0.8, delay: 0.3 + i * 0.15 }, duration: 5.5 + n.d, repeat: Infinity, ease: 'easeInOut', delay: n.d }}>
              <GlossNail shape={n.shape} from={n.from} to={n.to} />
            </motion.div>
          </div>
        ))}
      </motion.div>
    </div>
  );
}

/* Shared page header: kicker, split-text title, lead, optional 3D cluster, optional extra content */
export default function PageHero({ kicker, title, lead, accent = [], scene = true, children }) {
  return (
    <header className={`ph ${scene ? 'with-scene' : ''}`}>
      <div className="ph-copy">
        {kicker && (
          <motion.span className="hx-kicker" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: EASE }}>{kicker}</motion.span>
        )}
        <SplitText as="h1" immediate delay={0.05} stagger={0.1} text={title} accent={accent} className="ph-h1" />
        {lead && (
          <motion.p className="lead" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45, duration: 0.8, ease: EASE }}>{lead}</motion.p>
        )}
        {children}
      </div>
      {scene && <MiniScene />}
    </header>
  );
}

/* Floating nails behind sign-in / reset cards */
const BD = [
  { shape: 'Almond', from: '#F8CFE0', to: '#C0558F', x: '-2%', y: '10%', w: 92, rot: -20, d: 0 },
  { shape: 'Stiletto', from: '#8FA2FF', to: '#2D4BE0', x: '88%', y: '6%', w: 80, rot: 24, d: 0.8 },
  { shape: 'Coffin', from: '#8E4BB0', to: '#2A1233', x: '92%', y: '62%', w: 96, rot: -12, d: 1.4 },
  { shape: 'Square', from: '#FFFFFF', to: '#E2CFDA', x: '2%', y: '70%', w: 74, rot: 14, d: 2 },
];
export function AuthBackdrop() {
  const reduce = useReducedMotion();
  return (
    <div className="auth-bd" aria-hidden="true">
      <span className="auth-orb a" /><span className="auth-orb b" />
      {BD.map((n, i) => (
        <motion.div key={i} className="auth-nail" style={{ left: n.x, top: n.y, width: n.w }}
          initial={{ opacity: 0, rotate: n.rot, scale: 0.8 }}
          animate={reduce ? { opacity: 0.9, scale: 1 } : { opacity: 0.9, scale: 1, y: [0, -16, 0], rotate: [n.rot - 6, n.rot + 6, n.rot - 6] }}
          transition={reduce ? undefined : { opacity: { duration: 1, delay: 0.2 + i * 0.15 }, scale: { duration: 1, delay: 0.2 + i * 0.15, ease: EASE }, duration: 6 + n.d, repeat: Infinity, ease: 'easeInOut', delay: n.d }}>
          <GlossNail shape={n.shape} from={n.from} to={n.to} />
        </motion.div>
      ))}
    </div>
  );
}
