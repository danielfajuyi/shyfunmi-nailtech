import { useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { toast } from '../components/Toast.jsx';
import DashShell from '../components/DashShell.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import { CountUp } from '../components/motion.jsx';
import {
  DashboardIcon, ClipboardIcon, UserIcon, SettingsIcon, LockIcon, MailIcon, CameraIcon, CalendarIcon, PlusIcon,
  SaveIcon, WhatsAppIcon, ArrowRightIcon, GiftIcon, StarIcon, CheckIcon,
} from '../components/Icons.jsx';
import { api } from '../api.js';
import { useApp } from '../context.jsx';
import { useLoad, useTitle } from '../hooks.js';
import { dur, fmtDate, fmtTime, iso, money, waLink } from '../utils.js';

const NAV = [
  ['Menu', [
    ['overview', 'Overview', DashboardIcon],
    ['bookings', 'My bookings', ClipboardIcon, 'upcoming'],
  ]],
  ['Account', [
    ['profile', 'Profile', UserIcon],
    ['settings', 'Settings', SettingsIcon],
  ]],
];
const TITLES = {
  overview: ['Overview', 'Your appointments and rewards'],
  bookings: ['My bookings', 'Reschedule, cancel or leave a review'],
  profile: ['Profile', 'Your details and photo'],
  settings: ['Settings', 'Password and notifications'],
};

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
  const { tab: routeTab } = useParams();
  const { data, reload } = useLoad('/api/me/bookings');
  if (user === undefined) return <div className="boot"><span /></div>;
  if (!user) return <Navigate to="/login?next=/account" replace />;
  if (user.role === 'admin') return <Navigate to="/admin" replace />;
  const tab = TITLES[routeTab] ? routeTab : 'overview';
  const s = site.settings;
  const bookings = data?.bookings || [];
  const L = data?.loyalty;
  const today = new Date().toISOString().slice(0, 10);
  const upcoming = bookings.filter((b) => ['pending', 'confirmed'].includes(b.status) && b.date >= today).sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  const [title, blurb] = TITLES[tab];

  return (
    <DashShell
      brand={s.businessName}
      brandSub="My account"
      nav={NAV}
      basePath="/account"
      tab={tab}
      counts={{ upcoming: upcoming.length }}
      title={title}
      blurb={blurb}
      user={user}
      logout={logout}
      cta={{ to: '/book', label: 'Book an appointment', Icon: PlusIcon }}
    >
      {tab === 'overview' && <Overview user={user} L={L} upcoming={upcoming} bookings={bookings} settings={s} loaded={!!data} />}
      {tab === 'bookings' && <BookingsView data={data} bookings={bookings} today={today} settings={s} reload={reload} />}
      {tab === 'profile' && <Profile user={user} setUser={setUser} bookings={bookings} L={L} />}
      {tab === 'settings' && <Settings user={user} setUser={setUser} />}
    </DashShell>
  );
}

function Overview({ user, L, upcoming, bookings, settings: s, loaded }) {
  const next = upcoming[0];
  const first = String(user.name || '').split(' ')[0];
  const reward = !L ? '—' : L.nextIsReward ? `${L.discount}% off` : `${Math.max(0, L.every - 1 - L.progress)} left`;
  return (
    <>
      <div className="welcome">
        <div>
          <h2>Hello, {first}</h2>
          <p className="muted">{next ? `Your next appointment is ${fmtDate(next.date)} at ${fmtTime(next.time)}.` : 'You have nothing booked yet.'}</p>
        </div>
        <Link className="btn sm" to="/book"><PlusIcon size={16} /> New booking</Link>
      </div>

      <div className="stats">
        {[
          ['Upcoming', upcoming.length, CalendarIcon],
          ['Completed visits', L?.visits ?? 0, CheckIcon],
          ['Total bookings', bookings.length, ClipboardIcon],
        ].map(([l, v, Ico]) => (
          <div className="stat" key={l}><span className="stat-ico"><Ico size={18} /></span><small>{l}</small><b><CountUp to={v} /></b><span className="stat-gap" /></div>
        ))}
        <div className="stat"><span className="stat-ico"><GiftIcon size={18} /></span><small>Next reward</small><b className="stat-text">{reward}</b><span className="stat-gap" /></div>
      </div>

      <div className="agrid">
        <LoyaltyCard L={L} name={user.name} />
        <div className="stack">
          <div className="card">
            <div className="card-head"><h3>Next appointment</h3></div>
            {next ? (
              <>
                <p className="big">{next.serviceName}</p>
                <p>{fmtDate(next.date)}, {fmtTime(next.time)}</p>
                <span className={`pill ${next.status}`}>{next.status}</span>
                <div className="cta-row" style={{ marginTop: 16 }}>
                  <button type="button" className="btn ghost sm" onClick={() => downloadICS(next, s)}><CalendarIcon size={15} /> Add to calendar</button>
                </div>
              </>
            ) : (
              <>
                <p className="muted">{loaded ? 'Nothing booked yet.' : 'Loading…'}</p>
                {loaded && <Link className="btn sm" to="/book"><PlusIcon size={15} /> Book now</Link>}
              </>
            )}
          </div>

          <div className="card">
            <div className="card-head"><h3>Upcoming visits</h3>{upcoming.length > 3 && <Link to="/account/bookings" className="card-link">View all <ArrowRightIcon size={14} /></Link>}</div>
            {upcoming.length === 0 ? <p className="muted">No upcoming appointments.</p> : upcoming.slice(0, 3).map((b) => (
              <div className="line appt" key={b.id}>
                <span className="appt-who"><b>{b.serviceName}</b><small className="muted">{fmtDate(b.date)}, {fmtTime(b.time)}</small></span>
                <span className={`pill ${b.status}`}>{b.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

function BookingsView({ data, bookings, today, settings: s, reload }) {
  const [filter, setFilter] = useState('upcoming');
  const isUp = (b) => ['pending', 'confirmed'].includes(b.status) && b.date >= today;
  const list = bookings.filter((b) => (filter === 'all' ? true : filter === 'upcoming' ? isUp(b) : !isUp(b)));
  const nUp = bookings.filter(isUp).length;
  return (
    <>
      <div className="toolbar">
        <div className="seg" role="tablist" aria-label="Filter bookings">
          {[['upcoming', 'Upcoming', nUp], ['past', 'Past', bookings.length - nUp], ['all', 'All', bookings.length]].map(([k, l, n]) => (
            <button key={k} type="button" role="tab" aria-selected={filter === k} className={filter === k ? 'on' : ''} onClick={() => setFilter(k)}>{l} <em>{n}</em></button>
          ))}
        </div>
        <Link className="btn sm" to="/book"><PlusIcon size={16} /> New booking</Link>
      </div>
      {!data && <p className="muted">Loading…</p>}
      {data && !list.length && (
        <div className="empty-state">
          <span className="empty-ico"><ClipboardIcon size={26} /></span>
          <strong>{bookings.length ? 'Nothing here' : 'No bookings yet'}</strong>
          <p className="muted">{bookings.length ? 'Try another filter.' : 'Book your first appointment and it will show up here.'}</p>
          {!bookings.length && <Link className="btn sm" to="/book">Book your first appointment</Link>}
        </div>
      )}
      <div className="blist">
        {list.map((b) => <BookingItem key={b.id} b={b} cur={s.currency} settings={s} reload={reload} />)}
      </div>
    </>
  );
}

function initials(name) {
  return String(name || '').split(' ').filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join('') || 'S';
}

function LoyaltyCard({ L, name }) {
  if (!L) return <div className="card"><h3>Loyalty card</h3><p className="muted">Loading…</p></div>;
  const left = Math.max(0, L.every - 1 - L.progress);
  return (
    <div className="loyalty-card">
      <div className="loyalty-card-top">
        <div>
          <p className="loyalty-kicker">Member rewards</p>
          <h3>Loyalty card</h3>
        </div>
        <span className="loyalty-mark">{L.discount}% off</span>
      </div>
      <p className="loyalty-name">{name}</p>
      <div className="stamps dark">{Array.from({ length: L.every }, (_, i) => {
        const gift = i === L.every - 1;
        return <span key={i} className={`stamp ${gift ? 'gift' : i < L.progress ? 'on' : ''}`}>{gift ? `${L.discount}%` : i + 1}</span>;
      })}</div>
      <p className="loyalty-copy">
        {L.nextIsReward
          ? `Your next completed visit is a reward visit — ${L.discount}% off is applied automatically when you book.`
          : `${left} more completed visit${left === 1 ? '' : 's'} until ${L.discount}% off.`}
      </p>
      <p className="muted loyalty-hint">How it works: each time the salon marks a visit as completed, a stamp is added. After {L.every} completed visits, your next booking receives {L.discount}% off. {L.visits} completed so far.</p>
    </div>
  );
}

function BookingItem({ b, cur, settings, reload }) {
  const [rate, setRate] = useState(false);
  const [reschedule, setReschedule] = useState(false);
  const [askCancel, setAskCancel] = useState(false);
  const [r, setR] = useState({ rating: 5, text: '' });
  const [rsDate, setRsDate] = useState(b.date);
  const [rsTime, setRsTime] = useState(b.time);
  const [rsSlots, setRsSlots] = useState(null);
  const wa = waLink(settings, `Hello, I have a booking for ${b.serviceName} on ${fmtDate(b.date)} at ${fmtTime(b.time)}.`);
  const today = new Date().toISOString().slice(0, 10);
  const active = ['pending', 'confirmed'].includes(b.status);

  const cancel = async () => {
    try { await api.post(`/api/me/bookings/${b.id}/cancel`); toast('Booking cancelled'); setAskCancel(false); reload(); } catch (e) { toast(e.message, 'err'); }
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
    <div className="bitem bk">
      <div className="bk-top">
        <div className="bk-main">
          <h3>{b.serviceName}</h3>
          <p>{fmtDate(b.date)}, {fmtTime(b.time)}{dur(b.duration) ? ` · ${dur(b.duration)}` : ''}</p>
          <p className="muted">{b.price > 0 ? money(b.finalPrice, cur) : 'Price confirmed on arrival'}{b.discountPct > 0 && ` (${b.discountPct}% loyalty discount)`}</p>
        </div>
        <span className={`pill ${b.status}`}>{b.status}</span>
      </div>

      <div className="bact">
        {active && b.date >= today && <>
          <button type="button" className="btn ghost sm" onClick={() => { setReschedule(!reschedule); setRate(false); }}><CalendarIcon size={15} /> {reschedule ? 'Close' : 'Reschedule'}</button>
          <button type="button" className="btn ghost sm danger" onClick={() => setAskCancel(true)}>Cancel</button>
        </>}
        {b.status === 'completed' && !b.reviewed && <button type="button" className="btn ghost sm" onClick={() => { setRate(!rate); setReschedule(false); }}><StarIcon size={15} /> Leave a review</button>}
        {active && <button type="button" className="btn ghost sm" onClick={() => downloadICS(b, settings)}><CalendarIcon size={15} /> Add to calendar</button>}
        {wa && <a className="btn ghost sm" href={wa} target="_blank" rel="noreferrer"><WhatsAppIcon size={15} /> WhatsApp</a>}
      </div>

      {reschedule && (
        <div className="resched">
          <p className="resched-title">Reschedule appointment</p>
          <div className="field">
            <label>New date</label>
            <select value={rsDate} onChange={(e) => loadSlots(e.target.value)}>
              <option value="">Choose a date…</option>
              {days.map(({ k, label }) => <option key={k} value={k}>{label}</option>)}
            </select>
          </div>
          {rsDate && (
            <div>
              {rsSlots === null && <p className="muted">Checking availability…</p>}
              {rsSlots && !rsSlots.some((x) => x.free) && <p className="muted">No times available on this day.</p>}
              {rsSlots && <div className="slots">{rsSlots.map((x) => <button type="button" key={x.time} disabled={!x.free} className={`slot ${rsTime === x.time ? 'on' : ''}`} onClick={() => setRsTime(x.time)}>{fmtTime(x.time)}</button>)}</div>}
            </div>
          )}
          <div className="cta-row">
            <button type="button" className="btn sm" disabled={!rsDate || !rsTime} onClick={doReschedule}>Confirm reschedule</button>
            <button type="button" className="btn ghost sm" onClick={() => setReschedule(false)}>Cancel</button>
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

      <ConfirmDialog
        open={askCancel}
        title="Cancel this booking?"
        message={`Your ${b.serviceName} appointment on ${fmtDate(b.date)} at ${fmtTime(b.time)} will be cancelled and the time released.`}
        confirmLabel="Cancel booking"
        onConfirm={cancel}
        onClose={() => setAskCancel(false)}
      />
    </div>
  );
}

function Profile({ user, setUser, bookings, L }) {
  const [f, setF] = useState({ name: user.name, phone: user.phone || '' });
  const [busy, setBusy] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);
  const joined = user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-NG', { month: 'long', year: 'numeric' }) : '';
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const save = async (e) => {
    e.preventDefault(); setBusy(true);
    try {
      const r = await api.patch('/api/me', { name: f.name, phone: f.phone });
      setUser(r.user); toast('Profile saved');
    } catch (x) { toast(x.message, 'err'); } finally { setBusy(false); }
  };

  const onPhoto = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setPhotoBusy(true);
    try {
      const fd = new FormData(); fd.append('file', file);
      const r = await api.upload('/api/me/avatar', fd);
      setUser(r.user); toast('Photo updated');
    } catch (x) { toast(x.message, 'err'); } finally { setPhotoBusy(false); }
  };

  return (
    <div className="profile-layout">
      <section className="profile-hero">
        <label className="avatar-wrap">
          {user.avatar
            ? <img src={user.avatar} alt="" className="avatar-img" referrerPolicy="no-referrer" />
            : <span className="avatar-fallback">{initials(user.name)}</span>}
          <input type="file" accept="image/jpeg,image/png,image/webp" onChange={onPhoto} hidden />
          <span className="avatar-edit"><CameraIcon size={13} /> {photoBusy ? 'Uploading…' : 'Change'}</span>
        </label>
        <div className="ph-txt">
          <h2>{user.name}</h2>
          <p className="muted">{user.email}{user.phone ? ` · ${user.phone}` : ''}</p>
          {joined && <p className="muted">Member since {joined}</p>}
        </div>
      </section>

      <div className="profile-stats">
        <div className="profile-stat"><small>Completed visits</small><b>{L?.visits ?? '—'}</b></div>
        <div className="profile-stat"><small>Bookings</small><b>{bookings.length}</b></div>
        <div className="profile-stat"><small>Next reward</small><b>{L?.nextIsReward ? `${L.discount}% off` : `${Math.max(0, (L?.every || 5) - 1 - (L?.progress || 0))} left`}</b></div>
      </div>

      <form className="card form" onSubmit={save}>
        <div className="panel-head"><span className="panel-ico"><UserIcon size={18} /></span><div><h3>Personal details</h3><p className="muted">Used on bookings and confirmation emails. Email cannot be changed.</p></div></div>
        <div className="grid-2">
          <div className="field"><label htmlFor="pn">Full name</label><input id="pn" value={f.name} onChange={set('name')} autoComplete="name" /></div>
          <div className="field"><label htmlFor="pp">Phone</label><input id="pp" type="tel" inputMode="tel" value={f.phone} onChange={set('phone')} autoComplete="tel" placeholder="080…" /></div>
        </div>
        <div className="field"><label htmlFor="pe">Email</label><input id="pe" value={user.email} disabled /></div>
        <div><button className="btn" disabled={busy}><SaveIcon size={16} /> {busy ? 'Saving…' : 'Save profile'}</button></div>
      </form>
    </div>
  );
}

function Settings({ user, setUser }) {
  const [f, setF] = useState({ currentPassword: '', newPassword: '' });
  const [busy, setBusy] = useState(false);

  const savePassword = async (e) => {
    e.preventDefault(); setBusy(true);
    try {
      const r = await api.patch('/api/me', { currentPassword: f.currentPassword, newPassword: f.newPassword });
      setUser(r.user); setF({ currentPassword: '', newPassword: '' }); toast('Password updated');
    } catch (x) { toast(x.message, 'err'); } finally { setBusy(false); }
  };

  return (
    <div className="profile-layout">
      <form className="card form" onSubmit={savePassword}>
        <div className="panel-head"><span className="panel-ico"><LockIcon size={18} /></span><div><h3>Security</h3><p className="muted">{user.provider === 'google' ? 'This account can sign in with Google. Set a password if you also want email login.' : 'Change the password used to sign in with email.'}</p></div></div>
        {user.provider !== 'google' && (
          <div className="field"><label htmlFor="cp">Current password</label><input id="cp" type="password" value={f.currentPassword} onChange={(e) => setF({ ...f, currentPassword: e.target.value })} autoComplete="current-password" /></div>
        )}
        <div className="field"><label htmlFor="np">New password</label><input id="np" type="password" value={f.newPassword} onChange={(e) => setF({ ...f, newPassword: e.target.value })} autoComplete="new-password" placeholder="At least 8 characters" /></div>
        <div><button className="btn" disabled={busy || f.newPassword.length < 8}><SaveIcon size={16} /> {busy ? 'Saving…' : 'Update password'}</button></div>
      </form>
      <div className="card form">
        <div className="panel-head"><span className="panel-ico"><MailIcon size={18} /></span><div><h3>Emails from the salon</h3><p className="muted">When you book, you and the salon both receive a branded confirmation. You also get an email when a booking is confirmed, completed or cancelled. Contact-form messages go to the salon, and you receive a copy if you left an email.</p></div></div>
        {!user.phone && <p className="muted">Add a phone number on your <Link to="/account/profile" className="card-link">Profile</Link> so the salon can reach you on WhatsApp.</p>}
      </div>
    </div>
  );
}
