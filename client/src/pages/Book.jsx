import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Page from '../components/Page.jsx';
import PageHero from '../components/PageHero.jsx';
import { COLORS, Nail, SHAPES } from '../components/Nail.jsx';
import { api } from '../api.js';
import { useApp } from '../context.jsx';
import { useTitle } from '../hooks.js';
import { dayKey, dur, fmtDate, fmtTime, iso, money, waLink } from '../utils.js';

const STEPS = ['Service', 'Date and time', 'Your details'];

export default function Book() {
  useTitle('Book');
  const { site, user } = useApp();
  const s = site.settings;
  const [q] = useSearchParams();
  const [svc, setSvc] = useState(site.services.find((x) => x.id === q.get('service')) || null);
  const [step, setStep] = useState(svc ? 1 : 0);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [slots, setSlots] = useState(null);
  const [tick, setTick] = useState(0);
  const [f, setF] = useState({ name: '', phone: '', email: '', shape: 'Almond', color: 'Blush', notes: '' });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(null);

  useEffect(() => {
    if (user) setF((p) => ({ ...p, name: p.name || user.name, phone: p.phone || user.phone || '', email: p.email || user.email }));
  }, [user]);

  const days = useMemo(() => {
    const out = [], base = new Date();
    for (let i = 0; i < 28; i++) {
      const d = new Date(base); d.setDate(base.getDate() + i);
      const k = iso(d), h = s.hours?.[dayKey(d)];
      out.push({ k, d, off: !h || h.closed || (s.blockedDates || []).includes(k) });
    }
    return out;
  }, [s]);

  useEffect(() => {
    if (!svc || !date) return;
    setSlots(null); setTime('');
    api.get(`/api/availability?date=${date}&serviceId=${svc.id}`).then((r) => setSlots(r.slots)).catch(() => setSlots([]));
  }, [svc, date, tick]);

  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const submit = async (e) => {
    e.preventDefault(); setErr(''); setBusy(true);
    try { setDone(await api.post('/api/bookings', { ...f, serviceId: svc.id, date, time })); }
    catch (x) { setErr(x.message); if (/available/.test(x.message)) { setStep(1); setTick((t) => t + 1); } }
    finally { setBusy(false); }
  };

  if (done) {
    const msg = `Hello ${s.businessName}, I just booked ${done.serviceName} for ${fmtDate(done.date)} at ${fmtTime(done.time)}. My name is ${done.name}.`;
    const wa = waLink(s, msg);
    return (
      <Page className="container section page-top">
        <div className="card auth center">
          <div className="check" aria-hidden="true">✓</div>
          <h1 className="h1s sm">Booking received</h1>
          <p className="muted">Shyfunmi will confirm your appointment. {done.loyalty && `This is a loyalty visit, so ${done.discountPct}% off applies.`}</p>
          <dl className="summary">
            <div><dt>Service</dt><dd>{done.serviceName}</dd></div>
            <div><dt>When</dt><dd>{fmtDate(done.date)}, {fmtTime(done.time)}</dd></div>
            <div><dt>Price</dt><dd>{done.price > 0 ? money(done.finalPrice, s.currency) : 'Confirmed on arrival'}</dd></div>
          </dl>
          <div className="cta-row center">
            {wa && <a className="btn" href={wa} target="_blank" rel="noreferrer">Message on WhatsApp</a>}
            <Link className="btn ghost" to={user ? '/account' : '/register'}>{user ? 'View my bookings' : 'Create account to track it'}</Link>
          </div>
        </div>
      </Page>
    );
  }

  return (
    <Page className="container section page-top">
      <PageHero scene={false} kicker="Book online" title="Book your appointment" />
      <ol className="stepper">{STEPS.map((t, i) => <li key={t} className={i === step ? 'on' : i < step ? 'past' : ''}><span>{i + 1}</span>{t}</li>)}</ol>
      <AnimatePresence mode="wait">
        <motion.div key={step} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.3 }}>
          {step === 0 && (
            <div className="svc-grid">
              {site.services.map((v) => (
                <button key={v.id} className={`svc-card ${svc?.id === v.id ? 'on' : ''}`} onClick={() => { setSvc(v); setStep(1); }}>
                  <h3>{v.name}</h3><p>{v.description}</p><span className="meta">{dur(v.duration)}<b>{money(v.price, s.currency)}</b></span>
                </button>
              ))}
            </div>
          )}
          {step === 1 && svc && (
            <div>
              <p className="muted">{svc.name}, {dur(svc.duration)}. <button className="linklike" onClick={() => setStep(0)}>Change</button></p>
              <div className="days" data-lenis-prevent>
                {days.map(({ k, d, off }) => (
                  <button key={k} disabled={off} className={`day ${date === k ? 'on' : ''}`} onClick={() => setDate(k)} aria-label={fmtDate(k)}>
                    <small>{d.toLocaleDateString('en', { weekday: 'short' })}</small><b>{d.getDate()}</b><small>{d.toLocaleDateString('en', { month: 'short' })}</small>
                  </button>
                ))}
              </div>
              {date && (
                <div className="slots">
                  {slots === null && <p className="muted">Checking availability…</p>}
                  {slots && !slots.some((x) => x.free) && <p className="muted">No times left on this day. Try another date.</p>}
                  {slots && slots.map((x) => <button key={x.time} disabled={!x.free} className={`slot ${time === x.time ? 'on' : ''}`} onClick={() => setTime(x.time)}>{fmtTime(x.time)}</button>)}
                </div>
              )}
              <div className="nav-row"><button className="btn ghost" onClick={() => setStep(0)}>Back</button><button className="btn" disabled={!date || !time} onClick={() => setStep(2)}>Continue</button></div>
            </div>
          )}
          {step === 2 && svc && (
            <form onSubmit={submit} className="book-form" noValidate>
              <div className="form">
                <div className="grid-2">
                  <div className="field"><label htmlFor="bn">Your name</label><input id="bn" value={f.name} onChange={set('name')} autoComplete="name" /></div>
                  <div className="field"><label htmlFor="bp">Phone number</label><input id="bp" type="tel" value={f.phone} onChange={set('phone')} autoComplete="tel" /></div>
                </div>
                <div className="field"><label htmlFor="be">Email (optional)</label><input id="be" type="email" value={f.email} onChange={set('email')} autoComplete="email" /></div>
                <div className="field"><span className="lbl">Nail shape</span>
                  <div className="shape-row">{Object.keys(SHAPES).map((k) => (
                    <button type="button" key={k} className={`shape ${f.shape === k ? 'on' : ''}`} aria-pressed={f.shape === k} onClick={() => setF({ ...f, shape: k })}><Nail shape={k} color={COLORS[f.color]} />{k}</button>
                  ))}</div></div>
                <div className="field"><span className="lbl">Colour idea</span>
                  <div className="swatches">{Object.entries(COLORS).map(([k, v]) => <button type="button" key={k} title={k} aria-label={k} aria-pressed={f.color === k} className={f.color === k ? 'on' : ''} style={{ background: v }} onClick={() => setF({ ...f, color: k })} />)}</div></div>
                <div className="field"><label htmlFor="bm">Notes (optional)</label><textarea id="bm" rows="3" value={f.notes} onChange={set('notes')} placeholder="Inspiration, length, anything we should know" /></div>
                {err && <p className="err" role="alert">{err}</p>}
              </div>
              <aside className="card summary-card">
                <h3>Your booking</h3>
                <dl className="summary">
                  <div><dt>Service</dt><dd>{svc.name}</dd></div>
                  <div><dt>When</dt><dd>{fmtDate(date)}, {fmtTime(time)}</dd></div>
                  <div><dt>Duration</dt><dd>{dur(svc.duration)}</dd></div>
                  <div><dt>Price</dt><dd>{money(svc.price, s.currency)}</dd></div>
                </dl>
                <button className="btn" disabled={busy}>{busy ? 'Booking…' : 'Confirm booking'}</button>
                <button type="button" className="btn ghost" onClick={() => setStep(1)}>Back</button>
              </aside>
            </form>
          )}
        </motion.div>
      </AnimatePresence>
    </Page>
  );
}
