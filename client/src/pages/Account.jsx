import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import Page from '../components/Page.jsx';
import { toast } from '../components/Toast.jsx';
import { api } from '../api.js';
import { useApp } from '../context.jsx';
import { useLoad, useTitle } from '../hooks.js';
import { dur, fmtDate, fmtTime, iso, money, waLink } from '../utils.js';

const TABS = [['overview', 'Overview'], ['bookings', 'Bookings'], ['profile', 'Profile']];

// Generate ICS calendar file content
function makeICS(b, businessName, address) {
  const d = b.date.replace(/-/g, '');
  const [h, m] = b.time.split(':').map(Number);
  const pad = (n) => String(n).padStart(2, '0');
  const startDT = `${d}T${pad(h)}${pad(m)}00`;
  const endMin = h * 60 + m + (b.duration || 60);
  const endH = Math.floor(endMin / 60), endM = endMin % 60;
  const endDT = `${d}T${pad(endH)}${pad(endM)}00`;
  const now = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  return `BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//Shyfunmi Nails//EN\r\nBEGIN:VEVENT\r\nUID:${b.id}@shyfunminails.com\r\nDTSTAMP:${now}\r\nDTSTART:${startDT}\r\nDTEND:${endDT}\r\nSUMMARY:${b.serviceName} at ${businessName}\r\nLOCATION:${address}\r\nDESCRIPTION:Your ${b.serviceName} appointment at ${businessName}.\r\nEND:VEVENT\r\nEND:VCALENDAR`;
}

function downloadICS(b, settings) {
  const content = makeICS(b, settings.businessName, settings.address);
  const blob = new Blob([content], { type: 'text/calendar' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `shyfunmi-${b.date}.ics`; a.click();
  URL.revokeObjectURL(url);
}

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
  const upcoming = bookings.filter((b) => ['pending', 'confirmed'].includes(b.status) && b.date >= today).sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  const next = upcoming[0];

  return (
    <Page className="container section page-top">
      <div className="dash-head">
        <div><h1 className="h1s sm">Hello, {user.name.split(' ')[0]}</h1><p className="muted">Your appointments and rewards.</p></div>
        <div className="cta-row"><Link className="btn" to="/book">New booking</Link><button className="btn ghost" onClick={logout}>Sign out</button></div>
      </div>
      <div className="tabs" role="tablist">{TABS.map(([k, l]) => <button key={k} role="tab" aria-selected={tab === k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>{l}</button>)}</div>

      {tab === 'overview' && (
        <div className="accts-grid">
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
            {next ? <>
              <p className="big">{next.serviceName}</p>
              <p>{fmtDate(next.date)}, {fmtTime(next.time)}</p>
              <span className={`pill ${next.status}`}>{next.status}</span>
              <div className="cta-row" style={{ marginTop: 16 }}>
                <button className="btn ghost sm" onClick={() => downloadICS(next, s)}>Add to calendar</button>
              </div>
            </> : <><p className="muted">Nothing booked yet.</p><Link className="btn sm" to="/book">Book now</Link></>}
          </div>

          <div className="card">
            <h3>Upcoming visits</h3>
            {upcoming.length === 0 ? (
              <p className="muted">No upcoming appointments.</p>
            ) : (
              <div style={{ display: 'grid', gap: 10 }}>
                {upcoming.slice(0, 3).map((b) => (
                  <div key={b.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 10, borderBottom: '1px solid var(--line)' }}>
                    <div>
                      <p style={{ margin: 0, fontWeight: 600, fontSize: '0.93rem' }}>{b.serviceName}</p>
                      <p className="muted" style={{ margin: 0, fontSize: '0.82rem' }}>{fmtDate(b.date)}, {fmtTime(b.time)}</p>
                    </div>
                    <span className={`pill ${b.status}`}>{b.status}</span>
                  </div>
                ))}
                {upcoming.length > 3 && <p className="muted" style={{ fontSize: '0.85rem', margin: 0 }}>+{upcoming.length - 3} more — <button className="linklike" style={{ fontSize: '0.85rem' }} onClick={() => setTab('bookings')}>view all</button></p>}
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'bookings' && (
        <div className="blist">
          {data && !bookings.length && <p className="muted">No bookings yet. <Link to="/book">Book your first appointment</Link>.</p>}
          {bookings.map((b) => <BookingItem key={b.id} b={b} cur={s.currency} settings={s} reload={reload} />)}
        </div>
      )}

      {tab === 'profile' && <Profile user={user} setUser={setUser} />}
    </Page>
  );
}

function BookingItem({ b, cur, settings, reload }) {
  const [rate, setRate] = useState(false);
  const [reschedule, setReschedule] = useState(false);
  const [r, setR] = useState({ rating: 5, text: '' });
  const [rsDate, setRsDate] = useState(b.date);
  const [rsTime, setRsTime] = useState(b.time);
  const [rsSlots, setRsSlots] = useState(null);
  const wa = waLink(settings, `Hello, I have a booking for ${b.serviceName} on ${fmtDate(b.date)} at ${fmtTime(b.time)}.`);
  const today = new Date().toISOString().slice(0, 10);

  const cancel = async () => {
    if (!confirm('Cancel this booking?')) return;
    try { await api.post(`/api/me/bookings/${b.id}/cancel`); toast('Booking cancelled'); reload(); } catch (e) { toast(e.message, 'err'); }
  };

  const loadSlots = async (date) => {
    setRsDate(date); setRsSlots(null); setRsTime('');
    if (!date) return;
    try { const r = await api.get(`/api/availability?date=${date}&serviceId=${b.serviceId}`); setRsSlots(r.slots); } catch { setRsSlots([]); }
  };

  const doReschedule = async () => {
    if (!rsDate || !rsTime) return toast('Choose a date and time.', 'err');
    try { await api.post(`/api/me/bookings/${b.id}/reschedule`, { date: rsDate, time: rsTime }); toast('Rescheduled!'); setReschedule(false); reload(); } catch (e) { toast(e.message, 'err'); }
  };

  const review = async (e) => {
    e.preventDefault();
    try { await api.post('/api/me/reviews', { bookingId: b.id, ...r }); toast('Thanks! Your review will appear once approved.'); setRate(false); reload(); } catch (x) { toast(x.message, 'err'); }
  };

  // Date options: next 28 days
  const days = [];
  const base = new Date();
  for (let i = 0; i < 28; i++) {
    const d = new Date(base); d.setDate(base.getDate() + i);
    const k = iso(d);
    days.push({ k, label: fmtDate(k) });
  }

  return (
    <div className="bitem" style={{ flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 18, flexWrap: 'wrap', alignItems: 'flex-start' }}>
        <div>
          <h3>{b.serviceName}</h3>
          <p>{fmtDate(b.date)}, {fmtTime(b.time)}. {dur(b.duration)}</p>
          <p className="muted">{b.price > 0 ? money(b.finalPrice, cur) : 'Price confirmed on arrival'}{b.discountPct > 0 && ` (${b.discountPct}% loyalty discount)`}</p>
        </div>
        <div className="bact">
          <span className={`pill ${b.status}`}>{b.status}</span>
          {['pending', 'confirmed'].includes(b.status) && b.date >= today && <>
            <button className="btn ghost sm" onClick={() => { setReschedule(!reschedule); setRate(false); }}>{reschedule ? 'Close' : 'Reschedule'}</button>
            <button className="btn ghost sm danger" onClick={cancel}>Cancel</button>
          </>}
          {b.status === 'completed' && !b.reviewed && <button className="btn ghost sm" onClick={() => { setRate(!rate); setReschedule(false); }}>Leave a review</button>}
          {['pending', 'confirmed'].includes(b.status) && <button className="btn ghost sm" onClick={() => downloadICS(b, settings)}>📅 Add to cal</button>}
          {wa && <a className="btn ghost sm" href={wa} target="_blank" rel="noreferrer">WhatsApp</a>}
        </div>
      </div>

      {reschedule && (
        <div style={{ borderTop: '1px solid var(--line)', paddingTop: 16 }}>
          <p style={{ margin: '0 0 12px', fontWeight: 600, fontSize: '0.9rem' }}>Reschedule appointment</p>
          <div className="field" style={{ maxWidth: 280 }}>
            <label>New date</label>
            <select value={rsDate} onChange={(e) => loadSlots(e.target.value)}>
              <option value="">Choose a date…</option>
              {days.map(({ k, label }) => <option key={k} value={k}>{label}</option>)}
            </select>
          </div>
          {rsDate && (
            <div style={{ marginTop: 12 }}>
              {rsSlots === null && <p className="muted" style={{ fontSize: '0.9rem' }}>Checking availability…</p>}
              {rsSlots && !rsSlots.some((x) => x.free) && <p className="muted" style={{ fontSize: '0.9rem' }}>No times available on this day.</p>}
              {rsSlots && <div className="slots">{rsSlots.map((x) => <button key={x.time} disabled={!x.free} className={`slot ${rsTime === x.time ? 'on' : ''}`} onClick={() => setRsTime(x.time)}>{fmtTime(x.time)}</button>)}</div>}
            </div>
          )}
          <div className="cta-row" style={{ marginTop: 12 }}>
            <button className="btn sm" disabled={!rsDate || !rsTime} onClick={doReschedule}>Confirm reschedule</button>
            <button className="btn ghost sm" onClick={() => setReschedule(false)}>Cancel</button>
          </div>
        </div>
      )}

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
