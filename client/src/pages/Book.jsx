import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Page from '../components/Page.jsx';
import PageHero from '../components/PageHero.jsx';
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
  const location = useLocation();
  const [svc, setSvc] = useState(site.services.find((x) => x.id === q.get('service')) || null);
  const [step, setStep] = useState(svc ? 1 : 0);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [slots, setSlots] = useState(null);
  const [tick, setTick] = useState(0);
  const [f, setF] = useState({ name: '', phone: '', email: '', notes: '' });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(null);

  useEffect(() => {
    if (user) {
      setF((p) => ({
        ...p,
        name: p.name || user.name || '',
        phone: p.phone || user.phone || '',
        email: p.email || user.email || '',
      }));
    }
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
    e.preventDefault();
    setErr('');

    if (!user) {
      setErr('You must sign in or create an account before your booking can be confirmed.');
      return;
    }
    if (!f.name.trim() || f.name.trim().length < 2) {
      setErr('Please enter your full name.');
      return;
    }
    if (!f.phone.trim() || f.phone.replace(/\D/g, '').length < 7) {
      setErr('Please enter a valid phone number.');
      return;
    }
    if (!f.email.trim() || !/^\S+@\S+\.\S+$/.test(f.email.trim())) {
      setErr('Please enter a valid email address.');
      return;
    }

    setBusy(true);
    try {
      setDone(await api.post('/api/bookings', { ...f, serviceId: svc.id, date, time }));
    } catch (x) {
      setErr(x.message);
      if (/available/.test(x.message)) {
        setStep(1);
        setTick((t) => t + 1);
      }
    } finally {
      setBusy(false);
    }
  };

  const returnUrl = encodeURIComponent(location.pathname + location.search);

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
            <div><dt>Price</dt><dd>Price on request</dd></div>
          </dl>
          <div className="cta-row center">
            {wa && <a className="btn" href={wa} target="_blank" rel="noreferrer">Message on WhatsApp</a>}
            <Link className="btn ghost" to={user ? '/account/bookings' : '/register'}>{user ? 'View my bookings' : 'Create account to track it'}</Link>
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
                  <h3>{v.name}</h3><p>{v.description}</p><span className="meta">{dur(v.duration)}<b>Price on request</b></span>
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
                {!user && (
                  <div className="card" style={{ padding: '18px 22px', border: '1px solid color-mix(in srgb, var(--accent) 35%, var(--line))', background: 'color-mix(in srgb, var(--accent) 6%, var(--surface))', borderRadius: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <span className="pill gift" style={{ fontSize: '0.72rem' }}>Required</span>
                      <strong style={{ fontSize: '0.98rem' }}>Sign in to confirm booking</strong>
                    </div>
                    <p className="muted" style={{ margin: '0 0 14px', fontSize: '0.88rem', lineHeight: 1.55 }}>
                      You must have an account to complete your booking. It lets you manage visits, receive confirmations, and earn loyalty discounts.
                    </p>
                    <div className="cta-row">
                      <Link className="btn sm" to={`/login?next=${returnUrl}`}>Sign in</Link>
                      <Link className="btn ghost sm" to={`/register?next=${returnUrl}`}>Create account</Link>
                    </div>
                  </div>
                )}

                <div className="grid-2">
                  <div className="field">
                    <label htmlFor="bn">Your name *</label>
                    <input id="bn" required value={f.name} onChange={set('name')} autoComplete="name" placeholder="Full name" />
                  </div>
                  <div className="field">
                    <label htmlFor="bp">Phone number *</label>
                    <input id="bp" required type="tel" value={f.phone} onChange={set('phone')} autoComplete="tel" placeholder="08012345678" />
                  </div>
                </div>

                <div className="field">
                  <label htmlFor="be">Email address *</label>
                  <input id="be" required type="email" value={f.email} onChange={set('email')} autoComplete="email" placeholder="you@example.com" />
                </div>

                <div className="field">
                  <label htmlFor="bm">Notes (optional)</label>
                  <textarea id="bm" rows="3" value={f.notes} onChange={set('notes')} placeholder="Length preferences, custom art, or anything we should know" />
                </div>

                {err && <p className="err" role="alert">{err}</p>}
              </div>

              <aside className="card summary-card">
                <h3>Your booking</h3>
                <dl className="summary">
                  <div><dt>Service</dt><dd>{svc.name}</dd></div>
                  <div><dt>When</dt><dd>{fmtDate(date)}, {fmtTime(time)}</dd></div>
                  <div><dt>Duration</dt><dd>{dur(svc.duration)}</dd></div>
                  <div><dt>Price</dt><dd>Price on request</dd></div>
                </dl>
                {user ? (
                  <button className="btn" disabled={busy}>{busy ? 'Booking…' : 'Confirm booking'}</button>
                ) : (
                  <Link className="btn" to={`/login?next=${returnUrl}`}>
                    Sign in to confirm
                  </Link>
                )}
                <button type="button" className="btn ghost" onClick={() => setStep(1)}>Back</button>
              </aside>
            </form>
          )}
        </motion.div>
      </AnimatePresence>
    </Page>
  );
}
