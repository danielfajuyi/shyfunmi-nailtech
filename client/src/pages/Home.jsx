import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Page from '../components/Page.jsx';
import Reveal from '../components/Reveal.jsx';
import { Nail, Placeholder } from '../components/Nail.jsx';
import { useApp } from '../context.jsx';
import { useTitle } from '../hooks.js';
import { dur, money } from '../utils.js';

const HEAD = ['Your', 'confidence', 'starts', 'here.'];
const STYLES = ['Cateye', 'French tips', 'Short and cute', 'Press-ons', 'Marble', 'Freestyle', 'Toe nails'];
const STEPS = [
  ['Choose your service', 'Pick what you want done. Duration and prices are listed upfront.'],
  ['Pick a time', 'See live availability and choose a slot that suits you.'],
  ['Get confirmed', 'Shyfunmi confirms your booking, and you can track it in your account.'],
];
const FLOAT = [
  { shape: 'Almond', color: '#E9B8C6', x: '6%', y: '34%', w: 150, r: -8, d: 6 },
  { shape: 'Coffin', color: '#6B2D5C', x: '34%', y: '4%', w: 170, r: 4, d: 7 },
  { shape: 'Stiletto', color: '#F3E9EC', x: '62%', y: '30%', w: 150, r: 10, d: 5.5 },
  { shape: 'Square', color: '#2D4BE0', x: '40%', y: '56%', w: 120, r: -4, d: 6.5 },
];

export default function Home() {
  useTitle('');
  const { site } = useApp();
  const s = site.settings;
  const photos = site.photos.slice(0, 6);
  return (
    <Page>
      <section className="hero container">
        <div className="hero-copy">
          <h1 aria-label="Your confidence starts here.">
            {HEAD.map((w, i) => (
              <span className="mask" key={w}>
                <motion.span initial={{ y: '110%' }} animate={{ y: 0 }} transition={{ duration: 0.9, delay: 0.15 + i * 0.12, ease: [0.22, 1, 0.36, 1] }}>{w}&nbsp;</motion.span>
              </span>
            ))}
          </h1>
          <motion.p className="lead" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8, duration: 0.8 }}>
            Nails that transform confidence. Cateye, French tips, freestyles and press-ons, made with care at {s.address}.
          </motion.p>
          <motion.div className="cta-row" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1, duration: 0.8 }}>
            <Link className="btn" to="/book">Book appointment</Link>
            <Link className="btn ghost" to="/gallery">See the work</Link>
          </motion.div>
        </div>
        <div className="hero-art" aria-hidden="true">
          <div className="glow" />
          {FLOAT.map((n, i) => (
            <motion.div key={n.shape} className="floaty" style={{ left: n.x, top: n.y, width: n.w }}
              initial={{ opacity: 0, y: 40, rotate: n.r }} animate={{ opacity: 1, y: [0, -14, 0], rotate: [n.r, n.r + 3, n.r] }}
              transition={{ opacity: { delay: 0.5 + i * 0.15, duration: 0.8 }, y: { duration: n.d, repeat: Infinity, ease: 'easeInOut' }, rotate: { duration: n.d, repeat: Infinity, ease: 'easeInOut' } }}>
              <Nail shape={n.shape} color={n.color} />
            </motion.div>
          ))}
        </div>
      </section>

      <div className="marquee" aria-hidden="true"><div className="track">{[...STYLES, ...STYLES].map((x, i) => <span key={i}>{x}</span>)}</div></div>

      <section className="section container">
        <Reveal className="head"><h2>Services</h2><Link className="btn ghost" to="/services">All services</Link></Reveal>
        <div className="rows">
          {site.services.slice(0, 5).map((v, i) => (
            <Reveal key={v.id} delay={i * 0.05}>
              <Link to={`/book?service=${v.id}`} className="row">
                <h3>{v.name}</h3><p>{v.description}</p>
                <span className="meta">{dur(v.duration)}<b>{money(v.price, s.currency)}</b></span>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="section container">
        <Reveal><h2>Book in three steps</h2></Reveal>
        <div className="steps">
          {STEPS.map(([t, d], i) => (
            <Reveal key={t} delay={i * 0.1} className="step"><span className="num">{i + 1}</span><h3>{t}</h3><p>{d}</p></Reveal>
          ))}
        </div>
      </section>

      <section className="section container">
        <Reveal className="head"><h2>Recent work</h2><Link className="btn ghost" to="/gallery">Full gallery</Link></Reveal>
        <div className="strip">
          {photos.length
            ? photos.map((p, i) => <Reveal key={p.id} delay={i * 0.05} className="tile"><img src={p.url} alt={`${p.category} nails`} loading="lazy" /></Reveal>)
            : [0, 1, 2, 3, 4, 5].map((i) => <Reveal key={i} delay={i * 0.05}><Placeholder i={i} /></Reveal>)}
        </div>
      </section>

      <section className="container section">
        <Reveal className="loyal">
          <div>
            <h2>Come back, get rewarded.</h2>
            <p>Every {s.loyaltyEvery}th visit earns {s.loyaltyDiscount}% off, and sometimes more. Create an account to track your visits.</p>
            <Link className="btn light" to="/register">Create account</Link>
          </div>
          <div className="stamps" aria-hidden="true">
            {Array.from({ length: s.loyaltyEvery || 5 }, (_, i) => <span key={i} className={i === (s.loyaltyEvery || 5) - 1 ? 'stamp gift' : 'stamp on'}>{i === (s.loyaltyEvery || 5) - 1 ? `${s.loyaltyDiscount}%` : i + 1}</span>)}
          </div>
        </Reveal>
      </section>

      {site.reviews.length > 0 && (
        <section className="section container">
          <Reveal><h2>Kind words</h2></Reveal>
          <div className="reviews">
            {site.reviews.slice(0, 3).map((r, i) => (
              <Reveal key={r.id} delay={i * 0.08} className="review">
                <div className="stars" aria-label={`${r.rating} out of 5`}>{'★'.repeat(r.rating)}<i>{'★'.repeat(5 - r.rating)}</i></div>
                {r.text && <p>{r.text}</p>}
                <small>{r.author}, {r.service}</small>
              </Reveal>
            ))}
          </div>
        </section>
      )}

      <section className="section container cta-band">
        <Reveal>
          <h2>Learn the craft.</h2>
          <p>Nail training is available. Beginners and working techs are welcome.</p>
          <Link className="btn ghost" to="/training">Explore training</Link>
        </Reveal>
      </section>
    </Page>
  );
}
