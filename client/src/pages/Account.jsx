import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import Page from '../components/Page.jsx';
import { toast } from '../components/Toast.jsx';
import { api } from '../api.js';
import { useApp } from '../context.jsx';
import { useLoad, useTitle } from '../hooks.js';
import { dur, fmtDate, fmtTime, money } from '../utils.js';

const TABS = [['overview', 'Overview'], ['bookings', 'Bookings'], ['profile', 'Profile']];

export default function Account() {
  useTitle('My account');
  const { user, setUser, logout, site } = useApp();
  const { data, reload } = useLoad('/api/me/bookings');
  const [tab, setTab] = useState('overview');
  if (user === undefined) return <div className="boot"><span /></div>;
  if (!user) return <Navigate to="/login?next=/account" replace />;
  if (user.role === 'admin') return <Navigate to="/admin" replace />;
  const s = site.settings;
  const bookings = data?.bookings || [];
  const L = data?.loyalty;
  const today = new Date().toISOString().slice(0, 10);
  const next = bookings.filter((b) => ['pending', 'confirmed'].includes(b.status) && b.date >= today).sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))[0];

  return (
    <Page className="container section page-top">
      <div className="dash-head">
        <div><h1 className="h1s sm">Hello, {user.name.split(' ')[0]}</h1><p className="muted">Your appointments and rewards.</p></div>
        <div className="cta-row"><Link className="btn" to="/book">New booking</Link><button className="btn ghost" onClick={logout}>Sign out</button></div>
      </div>
      <div className="tabs" role="tablist">{TABS.map(([k, l]) => <button key={k} role="tab" aria-selected={tab === k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>{l}</button>)}</div>

      {tab === 'overview' && (
        <div className="split">
          <div className="card">
            <h3>Loyalty card</h3>
            {L ? <>
              <div className="stamps dark">{Array.from({ length: L.every }, (_, i) => {
                const gift = i === L.every - 1;
                return <span key={i} className={`stamp ${gift ? 'gift' : i < L.progress ? 'on' : ''}`}>{gift ? `${L.discount}%` : i + 1}</span>;
              })}</div>
              <p className="muted">{L.nextIsReward ? `Your next visit earns ${L.discount}% off.` : `${L.every - 1 - L.progress} more ${L.every - 1 - L.progress === 1 ? 'visit' : 'visits'} until your reward.`} {L.visits} completed so far.</p>
            </> : <p className="muted">Loading…</p>}
          </div>
          <div className="card">
            <h3>Next appointment</h3>
            {next ? <><p className="big">{next.serviceName}</p><p>{fmtDate(next.date)}, {fmtTime(next.time)}</p><span className={`pill ${next.status}`}>{next.status}</span></> : <><p className="muted">Nothing booked yet.</p><Link className="btn sm" to="/book">Book now</Link></>}
          </div>
        </div>
      )}

      {tab === 'bookings' && (
        <div className="blist">
          {data && !bookings.length && <p className="muted">No bookings yet. <Link to="/book">Book your first appointment</Link>.</p>}
          {bookings.map((b) => <BookingItem key={b.id} b={b} cur={s.currency} reload={reload} />)}
        </div>
      )}

      {tab === 'profile' && <Profile user={user} setUser={setUser} />}
    </Page>
  );
}

function BookingItem({ b, cur, reload }) {
  const [rate, setRate] = useState(false);
  const [r, setR] = useState({ rating: 5, text: '' });
  const cancel = async () => {
    if (!confirm('Cancel this booking?')) return;
    try { await api.post(`/api/me/bookings/${b.id}/cancel`); toast('Booking cancelled'); reload(); } catch (e) { toast(e.message, 'err'); }
  };
  const review = async (e) => {
    e.preventDefault();
    try { await api.post('/api/me/reviews', { bookingId: b.id, ...r }); toast('Thanks! Your review will appear once approved.'); setRate(false); reload(); } catch (x) { toast(x.message, 'err'); }
  };
  return (
    <div className="bitem">
      <div>
        <h3>{b.serviceName}</h3>
        <p>{fmtDate(b.date)}, {fmtTime(b.time)}. {dur(b.duration)}</p>
        <p className="muted">{b.price > 0 ? money(b.finalPrice, cur) : 'Price confirmed on arrival'}{b.discountPct > 0 && ` (${b.discountPct}% loyalty discount)`}</p>
      </div>
      <div className="bact">
        <span className={`pill ${b.status}`}>{b.status}</span>
        {['pending', 'confirmed'].includes(b.status) && <button className="btn ghost sm" onClick={cancel}>Cancel</button>}
        {b.status === 'completed' && !b.reviewed && <button className="btn ghost sm" onClick={() => setRate(!rate)}>Leave a review</button>}
      </div>
      {rate && (
        <form className="review-form" onSubmit={review}>
          <div className="rating" role="radiogroup" aria-label="Rating">{[1, 2, 3, 4, 5].map((n) => <button type="button" key={n} aria-label={`${n} stars`} className={n <= r.rating ? 'on' : ''} onClick={() => setR({ ...r, rating: n })}>★</button>)}</div>
          <textarea rows="3" placeholder="Tell us about your visit" value={r.text} onChange={(e) => setR({ ...r, text: e.target.value })} />
          <button className="btn sm">Submit review</button>
        </form>
      )}
    </div>
  );
}

function Profile({ user, setUser }) {
  const [f, setF] = useState({ name: user.name, phone: user.phone || '', currentPassword: '', newPassword: '' });
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const save = async (e) => {
    e.preventDefault(); setBusy(true);
    try {
      const r = await api.patch('/api/me', f.newPassword ? f : { name: f.name, phone: f.phone });
      setUser(r.user); setF({ ...f, currentPassword: '', newPassword: '' }); toast('Profile saved');
    } catch (x) { toast(x.message, 'err'); } finally { setBusy(false); }
  };
  return (
    <form className="card form narrow" onSubmit={save}>
      <div className="field"><label htmlFor="pn">Name</label><input id="pn" value={f.name} onChange={set('name')} /></div>
      <div className="field"><label htmlFor="pe">Email</label><input id="pe" value={user.email} disabled /></div>
      <div className="field"><label htmlFor="pp">Phone</label><input id="pp" type="tel" value={f.phone} onChange={set('phone')} /></div>
      <h3>Change password</h3>
      <div className="grid-2">
        <div className="field"><label htmlFor="cp">Current password</label><input id="cp" type="password" value={f.currentPassword} onChange={set('currentPassword')} autoComplete="current-password" /></div>
        <div className="field"><label htmlFor="np">New password</label><input id="np" type="password" value={f.newPassword} onChange={set('newPassword')} autoComplete="new-password" /></div>
      </div>
      <button className="btn" disabled={busy}>{busy ? 'Saving…' : 'Save changes'}</button>
    </form>
  );
}
