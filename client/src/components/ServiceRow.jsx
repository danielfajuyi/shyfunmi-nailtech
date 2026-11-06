import { Link } from 'react-router-dom';
import Reveal from './Reveal.jsx';
import { dur, money } from '../utils.js';
import '../home.css';

/* Service list row with a cursor-following glow wipe (used on Home and Services) */
export default function ServiceRow({ v, i, s }) {
  const glow = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty('--x', `${e.clientX - r.left}px`);
    e.currentTarget.style.setProperty('--y', `${e.clientY - r.top}px`);
  };
  return (
    <Reveal delay={Math.min(i, 6) * 0.05} y={40}>
      <Link to={`/book?service=${v.id}`} className="hx-row" onPointerMove={glow}>
        <span className="hx-idx">{String(i + 1).padStart(2, '0')}</span>
        <h3 className="hx-row-title">{v.name}</h3>
        <p>{v.description}</p>
        <span className="meta">{dur(v.duration)}<b>{money(v.price, s.currency)}</b></span>
        <span className="hx-arrow" aria-hidden="true">↗</span>
        <i className="hx-wipe" aria-hidden="true" />
      </Link>
    </Reveal>
  );
}
