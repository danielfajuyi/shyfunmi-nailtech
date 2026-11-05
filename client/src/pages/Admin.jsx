import { useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { toast } from '../components/Toast.jsx';
import { useTheme } from '../components/Layout.jsx';
import Logo from '../components/Logo.jsx';
import Modal from '../components/Modal.jsx';
import { api } from '../api.js';
import { useApp } from '../context.jsx';
import { useLoad, useTitle } from '../hooks.js';
import { fmtDate, fmtTime, money, waClient, iso } from '../utils.js';
import { Gallery, Services, Settings } from './AdminManage.jsx';

const TABS = [
  ['overview', 'Overview'],
  ['calendar', 'Calendar'],
  ['bookings', 'Bookings'],
  ['services', 'Services'],
  ['gallery', 'Gallery'],
  ['clients', 'Clients'],
  ['training', 'Training'],
  ['reviews', 'Reviews'],
  ['messages', 'Messages'],
  ['settings', 'Settings'],
];

export default function Admin() {
  useTitle('Admin Dashboard');
  const { user, logout, site } = useApp();
  const { tab = 'overview' } = useParams();
  const [dark, toggle] = useTheme();
  const [menu, setMenu] = useState(false);

  if (user === undefined) return <div className="boot"><span /></div>;
  if (!user) return <Navigate to="/admin/login" replace />;
  if (user.role !== 'admin') return <Navigate to="/admin/login" replace />;

  const cur = site.settings.currency;
  const View = {
    overview: Overview,
    calendar: CalendarView,
    bookings: Bookings,
    services: Services,
    gallery: Gallery,
    clients: Clients,
    training: Training,
    reviews: Reviews,
    messages: Messages,
    settings: Settings,
  }[tab] || Overview;

  return (
    <div className="admin">
      <aside className={`side ${menu ? 'open' : ''}`}>
        <Link to="/" className="logo"><Logo size={28} /> <span>Shyfunmi</span></Link>
        <nav>
          {TABS.map(([k, l]) => (
            <Link key={k} to={`/admin/${k}`} className={tab === k ? 'on' : ''} onClick={() => setMenu(false)}>
              {l}
            </Link>
          ))}
        </nav>
        <div className="side-foot">
          <button className="linklike" onClick={toggle}>{dark ? 'Light mode' : 'Dark mode'}</button>
          <Link to="/">View website</Link>
          <button className="linklike" onClick={logout}>Sign out</button>
        </div>
      </aside>
      <div className="amain" data-lenis-prevent>
        <div className="atop">
          <button className="icon-btn menu-btn" onClick={() => setMenu(!menu)} aria-label="Menu">☰</button>
          <h1>{TABS.find(([k]) => k === tab)?.[1] || 'Overview'}</h1>
        </div>
        <div className="abody"><View cur={cur} /></div>
      </div>
    </div>
  );
}

function Loading({ d, e }) { return e ? <p className="err">{e}</p> : !d ? <p className="muted">Loading…</p> : null; }

function Overview() {
  const { data: d, error } = useLoad('/api/admin/stats');
  if (!d) return <Loading d={d} e={error} />;

  return (
    <>
      <div className="stats">
        {[
          ['Today', d.todayBookings, '/admin/calendar'],
          ['Pending', d.pending, '/admin/bookings'],
          ['Upcoming', d.upcoming, '/admin/calendar'],
          ['Completed visits', d.completed, null],
          ['Clients', d.clients, '/admin/clients'],
        ].map(([l, v, to]) => (
          <div className="stat" key={l}>
            <small>{l}</small>
            <b>{v}</b>
            {to && <Link to={to}>View</Link>}
          </div>
        ))}
      </div>

      {(d.pending > 0 || d.newEnrollments > 0 || d.pendingReviews > 0 || d.unreadMessages > 0) && (
        <div className="alerts-row">
          {d.pending > 0 && <Link to="/admin/bookings" className="alert-chip pending">{d.pending} booking{d.pending !== 1 ? 's' : ''} need confirmation</Link>}
          {d.newEnrollments > 0 && <Link to="/admin/training" className="alert-chip warn">{d.newEnrollments} training enqu{d.newEnrollments !== 1 ? 'iries' : 'iry'}</Link>}
          {d.pendingReviews > 0 && <Link to="/admin/reviews" className="alert-chip">{d.pendingReviews} review{d.pendingReviews !== 1 ? 's' : ''} awaiting approval</Link>}
          {d.unreadMessages > 0 && <Link to="/admin/messages" className="alert-chip">{d.unreadMessages} unread message{d.unreadMessages !== 1 ? 's' : ''}</Link>}
        </div>
      )}

      <div className="agrid">
        <div className="card">
          <h3>Popular services</h3>
          {d.top.length ? d.top.map((t) => <div className="line" key={t.name}><span>{t.name}</span><b>{t.count}</b></div>) : <p className="muted">No bookings yet.</p>}
          <div className="line"><span>New training enquiries</span><b>{d.newEnrollments}</b></div>
          <div className="line"><span>Reviews waiting</span><b>{d.pendingReviews}</b></div>
          <div className="line"><span>Unread messages</span><b>{d.unreadMessages}</b></div>
        </div>
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h3 style={{ margin: 0 }}>Next appointments</h3>
          <Link to="/admin/calendar" className="linklike" style={{ fontSize: '0.88rem' }}>Open Calendar →</Link>
        </div>
        {d.next.length ? d.next.map((b) => (
          <div className="line" key={b.id}>
            <span><b>{b.name}</b>, {b.serviceName}</span>
            <span>{fmtDate(b.date)}, {fmtTime(b.time)} <em className={`pill ${b.status}`}>{b.status}</em></span>
          </div>
        )) : <p className="muted">Nothing upcoming.</p>}
      </div>
    </>
  );
}

/* ---------- Calendar View ---------- */
function CalendarView({ cur }) {
  const { data: bookings, reload, error } = useLoad('/api/admin/bookings?status=all');
  const [selectedDate, setSelectedDate] = useState(() => iso(new Date()));
  const [activeBooking, setActiveBooking] = useState(null);
  const [showWalkIn, setShowWalkIn] = useState(false);

  // Generate 7-day strip centered or starting near today
  const [weekOffset, setWeekOffset] = useState(0);
  const days = [];
  const baseDate = new Date();
  baseDate.setDate(baseDate.getDate() + weekOffset * 7);

  // Start on Monday of the current selected week
  const dayOfWeek = (baseDate.getDay() + 6) % 7; // Monday = 0
  baseDate.setDate(baseDate.getDate() - dayOfWeek);

  for (let i = 0; i < 7; i++) {
    const d = new Date(baseDate);
    d.setDate(baseDate.getDate() + i);
    const dateStr = iso(d);
    const dayBookings = (bookings || []).filter((b) => b.date === dateStr && b.status !== 'cancelled');
    days.push({
      dateStr,
      dayNum: d.getDate(),
      dayName: d.toLocaleDateString('en', { weekday: 'short' }),
      monthName: d.toLocaleDateString('en', { month: 'short' }),
      count: dayBookings.length,
      isToday: dateStr === iso(new Date()),
    });
  }

  const selectedDayBookings = (bookings || [])
    .filter((b) => b.date === selectedDate)
    .sort((a, b) => a.time.localeCompare(b.time));

  return (
    <>
      <div className="toolbar" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn ghost sm" onClick={() => setWeekOffset((w) => w - 1)}>‹ Previous week</button>
          <button className="btn ghost sm" onClick={() => { setWeekOffset(0); setSelectedDate(iso(new Date())); }}>Today</button>
          <button className="btn ghost sm" onClick={() => setWeekOffset((w) => w + 1)}>Next week ›</button>
        </div>
        <button className="btn sm" onClick={() => setShowWalkIn(true)}>+ Add walk-in</button>
      </div>

      <Loading d={bookings} e={error} />

      {/* Week Selector Bar */}
      <div className="calendar-week-strip">
        {days.map((d) => (
          <button
            key={d.dateStr}
            className={`calendar-day-btn ${selectedDate === d.dateStr ? 'on' : ''} ${d.isToday ? 'today' : ''}`}
            onClick={() => setSelectedDate(d.dateStr)}
          >
            <span className="cal-day-name">{d.dayName}</span>
            <span className="cal-day-num">{d.dayNum}</span>
            <span className="cal-day-month">{d.monthName}</span>
            {d.count > 0 && <span className="cal-count-badge">{d.count} booking{d.count > 1 ? 's' : ''}</span>}
          </button>
        ))}
      </div>

      {/* Day Schedule Panel */}
      <div className="card calendar-schedule-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ margin: 0 }}>Schedule for {fmtDate(selectedDate)}</h3>
          <span className="muted" style={{ fontSize: '0.88rem' }}>{selectedDayBookings.length} appointment{selectedDayBookings.length !== 1 ? 's' : ''}</span>
        </div>

        {selectedDayBookings.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '36px 0' }}>
            <p className="muted">No appointments scheduled for this date.</p>
            <button className="btn ghost sm" onClick={() => setShowWalkIn(true)}>+ Book appointment for this day</button>
          </div>
        ) : (
          <div className="timeline-list">
            {selectedDayBookings.map((b) => (
              <div key={b.id} className="timeline-item" onClick={() => setActiveBooking(b)}>
                <div className="timeline-time">
                  <b>{fmtTime(b.time)}</b>
                </div>
                <div className="timeline-content card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                    <div>
                      <h4 style={{ margin: '0 0 4px', fontSize: '1.05rem' }}>{b.name}</h4>
                      <p className="muted" style={{ margin: 0, fontSize: '0.9rem' }}>{b.serviceName} · {b.shape}</p>
                    </div>
                    <span className={`pill ${b.status}`}>{b.status}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, fontSize: '0.85rem' }}>
                    <span className="muted">{b.phone}</span>
                    <b>{b.price > 0 ? money(b.finalPrice, cur) : 'No price set'}</b>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Booking Details Modal */}
      {activeBooking && (
        <AppointmentModal
          booking={activeBooking}
          cur={cur}
          onClose={() => setActiveBooking(null)}
          onReload={() => { reload(); setActiveBooking(null); }}
        />
      )}

      {/* Walk-in Modal */}
      <Modal isOpen={showWalkIn} onClose={() => setShowWalkIn(false)} title="Add Walk-In / New Appointment" maxWidth={540}>
        <WalkInForm defaultDate={selectedDate} done={() => { setShowWalkIn(false); reload(); }} />
      </Modal>
    </>
  );
}

/* ---------- Bookings List View ---------- */
function Bookings({ cur }) {
  const [status, setStatus] = useState('all');
  const [q, setQ] = useState('');
  const { data, reload, error } = useLoad(`/api/admin/bookings?status=${status}&q=${encodeURIComponent(q)}`);
  const [showWalkIn, setShowWalkIn] = useState(false);
  const [activeBooking, setActiveBooking] = useState(null);

  const exportCSV = () => {
    if (!data?.length) return;
    const header = ['Name', 'Phone', 'Email', 'Service', 'Date', 'Time', 'Status', 'Price', 'Notes'];
    const rows = data.map((b) => [
      b.name, b.phone, b.email, b.serviceName, b.date, b.time, b.status,
      b.finalPrice > 0 ? `${cur}${b.finalPrice}` : '', b.notes || '',
    ].map((x) => `"${String(x || '').replace(/"/g, '""')}"`).join(','));
    const csv = [header.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'bookings.csv'; a.click(); URL.revokeObjectURL(url);
  };

  return (
    <>
      <div className="toolbar">
        <input placeholder="Search name, phone or service" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search bookings" />
        <select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter by status">
          {['all', 'pending', 'confirmed', 'completed', 'cancelled'].map((s) => <option key={s}>{s}</option>)}
        </select>
        <button className="btn sm" onClick={() => setShowWalkIn(true)}>+ Add walk-in</button>
        <button className="btn ghost sm" onClick={exportCSV}>Export CSV</button>
      </div>

      <Loading d={data} e={error} />
      {data && !data.length && <p className="muted">No bookings found.</p>}

      <div className="blist">
        {data?.map((b) => (
          <BookingRow
            key={b.id}
            b={b}
            cur={cur}
            reload={reload}
            onOpenModal={() => setActiveBooking(b)}
          />
        ))}
      </div>

      {/* Appointment Detail Modal */}
      {activeBooking && (
        <AppointmentModal
          booking={activeBooking}
          cur={cur}
          onClose={() => setActiveBooking(null)}
          onReload={() => { reload(); setActiveBooking(null); }}
        />
      )}

      {/* Walk-in Modal */}
      <Modal isOpen={showWalkIn} onClose={() => setShowWalkIn(false)} title="Add Walk-In / New Appointment" maxWidth={540}>
        <WalkInForm done={() => { setShowWalkIn(false); reload(); }} />
      </Modal>
    </>
  );
}

function BookingRow({ b, cur, reload, onOpenModal }) {
  const { site } = useApp();
  const patch = async (body, msg = 'Saved') => {
    try { await api.patch(`/api/admin/bookings/${b.id}`, body); toast(msg); reload(); }
    catch (e) { toast(e.message, 'err'); }
  };
  const remove = async () => {
    if (confirm('Delete this booking permanently?')) {
      await api.del(`/api/admin/bookings/${b.id}`); toast('Deleted'); reload();
    }
  };
  const msg = `Hello ${b.name}, your ${b.serviceName} appointment at ${site.settings.businessName} is ${b.status === 'cancelled' ? 'cancelled' : 'confirmed'} for ${fmtDate(b.date)} at ${fmtTime(b.time)}.`;
  const mailtoLink = b.email ? `mailto:${b.email}?subject=Your appointment at ${encodeURIComponent(site.settings.businessName)}&body=${encodeURIComponent(msg)}` : null;

  return (
    <div className="bitem">
      <div>
        <h3>
          {b.name} {b.loyalty && <em className="pill gift">loyalty visit</em>}
        </h3>
        <p>{b.serviceName}, {b.shape}{b.color && `, ${b.color}`}</p>
        <p>{fmtDate(b.date)}, {fmtTime(b.time)}</p>
        <p className="muted">
          {b.phone}{b.email && `, ${b.email}`}. {b.price > 0 ? `${money(b.finalPrice, cur)}${b.discountPct ? ` after ${b.discountPct}% off` : ''}` : 'No price set'}
        </p>
        {b.notes && <p className="muted"><i>"{b.notes}"</i></p>}
        {b.adminNote && <p className="muted">Note: {b.adminNote}</p>}
      </div>
      <div className="bact">
        <select
          value={b.status}
          onChange={(e) => patch({ status: e.target.value }, `Marked ${e.target.value}`)}
          aria-label="Status"
          className={`pill sel ${b.status}`}
        >
          {['pending', 'confirmed', 'completed', 'cancelled'].map((s) => <option key={s}>{s}</option>)}
        </select>
        <a className="btn ghost sm" href={waClient(b.phone, msg)} target="_blank" rel="noreferrer">WhatsApp</a>
        {mailtoLink && <a className="btn ghost sm" href={mailtoLink}>Email</a>}
        <button className="btn ghost sm" onClick={onOpenModal}>Manage modal</button>
        <button className="btn ghost sm danger" onClick={remove}>Delete</button>
      </div>
    </div>
  );
}

/* ---------- Appointment Detail & Edit Modal ---------- */
function AppointmentModal({ booking, cur, onClose, onReload }) {
  const { site } = useApp();
  const [f, setF] = useState({
    date: booking.date,
    time: booking.time,
    price: booking.price,
    discountPct: booking.discountPct || 0,
    status: booking.status,
    adminNote: booking.adminNote || '',
  });
  const [busy, setBusy] = useState(false);

  const saveChanges = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.patch(`/api/admin/bookings/${booking.id}`, {
        ...f,
        price: Number(f.price),
        discountPct: Number(f.discountPct),
      });
      toast('Appointment updated');
      onReload();
    } catch (err) {
      toast(err.message, 'err');
    } finally {
      setBusy(false);
    }
  };

  const removeBooking = async () => {
    if (!confirm('Permanently delete this appointment?')) return;
    try {
      await api.del(`/api/admin/bookings/${booking.id}`);
      toast('Appointment deleted');
      onReload();
    } catch (err) {
      toast(err.message, 'err');
    }
  };

  const msg = `Hello ${booking.name}, regarding your ${booking.serviceName} appointment at ${site.settings.businessName} on ${fmtDate(f.date)} at ${fmtTime(f.time)}.`;
  const mailtoLink = booking.email ? `mailto:${booking.email}?subject=Your appointment at ${encodeURIComponent(site.settings.businessName)}&body=${encodeURIComponent(msg)}` : null;

  return (
    <Modal isOpen={true} onClose={onClose} title={`Appointment: ${booking.name}`} maxWidth={580}>
      <form onSubmit={saveChanges} className="modal-form">
        <div className="modal-client-meta">
          <div>
            <strong>{booking.name}</strong>
            <p className="muted" style={{ margin: 0, fontSize: '0.88rem' }}>{booking.phone} {booking.email && `· ${booking.email}`}</p>
          </div>
          <span className={`pill ${f.status}`}>{f.status}</span>
        </div>

        <div className="modal-service-details">
          <div><span className="muted">Service:</span> <strong>{booking.serviceName}</strong></div>
          <div><span className="muted">Shape:</span> <strong>{booking.shape}</strong></div>
          {booking.color && <div><span className="muted">Color idea:</span> <strong>{booking.color}</strong></div>}
          {booking.notes && <div><span className="muted">Client notes:</span> <em>"{booking.notes}"</em></div>}
        </div>

        <div className="grid-2" style={{ marginTop: 14 }}>
          <div className="field">
            <label>Date</label>
            <input type="date" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} required />
          </div>
          <div className="field">
            <label>Time</label>
            <input type="time" value={f.time} onChange={(e) => setF({ ...f, time: e.target.value })} required />
          </div>
        </div>

        <div className="grid-2">
          <div className="field">
            <label>Price ({cur})</label>
            <input type="number" min="0" value={f.price} onChange={(e) => setF({ ...f, price: e.target.value })} />
          </div>
          <div className="field">
            <label>Discount %</label>
            <select value={f.discountPct} onChange={(e) => setF({ ...f, discountPct: e.target.value })}>
              {[0, 10, 15, 20, 25, 30, 40, 50].map((n) => <option key={n} value={n}>{n}%</option>)}
            </select>
          </div>
        </div>

        <div className="field">
          <label>Status</label>
          <select value={f.status} onChange={(e) => setF({ ...f, status: e.target.value })}>
            {['pending', 'confirmed', 'completed', 'cancelled'].map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div className="field">
          <label>Private Administrative Note</label>
          <textarea
            rows="2"
            placeholder="Special client preferences, nail condition, etc."
            value={f.adminNote}
            onChange={(e) => setF({ ...f, adminNote: e.target.value })}
          />
        </div>

        <div className="modal-actions-row">
          <a className="btn ghost sm" href={waClient(booking.phone, msg)} target="_blank" rel="noreferrer">
            WhatsApp
          </a>
          {mailtoLink && <a className="btn ghost sm" href={mailtoLink}>Email client</a>}
          <button type="button" className="btn ghost sm danger" onClick={removeBooking}>
            Delete
          </button>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            <button type="button" className="btn ghost sm" onClick={onClose}>Close</button>
            <button className="btn sm" disabled={busy}>{busy ? 'Saving…' : 'Save Changes'}</button>
          </div>
        </div>
      </form>
    </Modal>
  );
}

/* ---------- Walk-In Form Component ---------- */
function WalkInForm({ defaultDate, done }) {
  const { site } = useApp();
  const [f, setF] = useState({
    serviceId: site.services[0]?.id || '',
    name: '',
    phone: '',
    email: '',
    date: defaultDate || iso(new Date()),
    time: '10:00',
    shape: 'Almond',
    color: '',
    notes: '',
  });
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    if (!f.name.trim()) return toast('Please enter client name.', 'err');
    if (!f.phone.trim()) return toast('Please enter client phone number.', 'err');
    setBusy(true);
    try {
      await api.post('/api/admin/bookings', f);
      toast('Booking created successfully');
      done();
    } catch (x) {
      toast(x.message, 'err');
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="form" onSubmit={submit}>
      <div className="field">
        <label>Service</label>
        <select value={f.serviceId} onChange={set('serviceId')}>
          {site.services.map((s) => <option key={s.id} value={s.id}>{s.name} ({money(s.price, site.settings.currency)})</option>)}
        </select>
      </div>

      <div className="grid-2">
        <div className="field">
          <label>Client Name</label>
          <input value={f.name} onChange={set('name')} placeholder="Full name" required />
        </div>
        <div className="field">
          <label>Phone Number</label>
          <input value={f.phone} onChange={set('phone')} type="tel" placeholder="080..." required />
        </div>
      </div>

      <div className="field">
        <label>Email (Optional)</label>
        <input value={f.email} onChange={set('email')} type="email" placeholder="client@example.com" />
      </div>

      <div className="grid-2">
        <div className="field">
          <label>Date</label>
          <input type="date" value={f.date} onChange={set('date')} required />
        </div>
        <div className="field">
          <label>Time</label>
          <input type="time" value={f.time} onChange={set('time')} required />
        </div>
      </div>

      <div className="grid-2">
        <div className="field">
          <label>Nail Shape</label>
          <select value={f.shape} onChange={set('shape')}>
            {['Almond', 'Coffin', 'Square', 'Stiletto', 'Round', 'Not sure yet'].map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div className="field">
          <label>Color Idea (Optional)</label>
          <input value={f.color} onChange={set('color')} placeholder="e.g. Blush Pink, French tip" />
        </div>
      </div>

      <div className="field">
        <label>Notes / Requests (Optional)</label>
        <textarea rows="2" value={f.notes} onChange={set('notes')} placeholder="Specific art, extensions, etc." />
      </div>

      <button className="btn" disabled={busy} style={{ width: '100%', marginTop: 8 }}>
        {busy ? 'Creating booking…' : 'Confirm Walk-In Booking'}
      </button>
    </form>
  );
}

/* ---------- Clients View ---------- */
function Clients() {
  const { data, error } = useLoad('/api/admin/clients');
  const [q, setQ] = useState('');
  if (!data) return <Loading d={data} e={error} />;
  const list = data.filter((c) => `${c.name} ${c.email} ${c.phone}`.toLowerCase().includes(q.toLowerCase()));

  const exportCSV = () => {
    const header = ['Name', 'Email', 'Phone', 'Bookings', 'Completed visits', 'Joined'];
    const rows = list.map((c) => [c.name, c.email, c.phone, c.bookings, c.visits, new Date(c.createdAt).toLocaleDateString('en-NG')].map((x) => `"${String(x || '').replace(/"/g, '""')}"`).join(','));
    const csv = [header.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'clients.csv'; a.click(); URL.revokeObjectURL(url);
  };

  return (
    <>
      <div className="toolbar">
        <input placeholder="Search clients" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search clients" />
        <button className="btn ghost sm" onClick={exportCSV}>Export CSV</button>
      </div>
      <div className="table-wrap"><table>
        <thead><tr><th>Name</th><th>Contact</th><th>Bookings</th><th>Completed visits</th><th>Joined</th></tr></thead>
        <tbody>{list.map((c) => <tr key={c.id}><td>{c.name}</td><td>{c.email}<br /><span className="muted">{c.phone}</span></td><td>{c.bookings}</td><td>{c.visits}</td><td>{new Date(c.createdAt).toLocaleDateString('en-NG')}</td></tr>)}</tbody>
      </table></div>
      {!list.length && <p className="muted">No clients yet.</p>}
    </>
  );
}

/* ---------- Training View ---------- */
function Training() {
  const { data, reload, error } = useLoad('/api/admin/enrollments');
  if (!data) return <Loading d={data} e={error} />;
  const set = async (id, status) => { await api.patch(`/api/admin/enrollments/${id}`, { status }); reload(); };
  const del = async (id) => { if (confirm('Delete this enquiry?')) { await api.del(`/api/admin/enrollments/${id}`); reload(); } };
  return (
    <div className="blist">
      {!data.length && <p className="muted">No training enquiries yet.</p>}
      {data.map((e) => (
        <div className="bitem" key={e.id}>
          <div><h3>{e.name}</h3><p>{e.level}. {e.phone}{e.email && `, ${e.email}`}</p>{e.message && <p className="muted"><i>"{e.message}"</i></p>}<p className="muted">{new Date(e.createdAt).toLocaleDateString('en-NG')}</p></div>
          <div className="bact">
            <select className="pill sel" value={e.status} onChange={(ev) => set(e.id, ev.target.value)} aria-label="Status">{['new', 'contacted', 'enrolled', 'declined'].map((s) => <option key={s}>{s}</option>)}</select>
            <a className="btn ghost sm" target="_blank" rel="noreferrer" href={waClient(e.phone, `Hello ${e.name}, thank you for your interest in nail training.`)}>WhatsApp</a>
            {e.email && <a className="btn ghost sm" href={`mailto:${e.email}`}>Email</a>}
            <button className="btn ghost sm danger" onClick={() => del(e.id)}>Delete</button>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ---------- Reviews View ---------- */
function Reviews() {
  const { reload: reloadSite } = useApp();
  const { data, reload, error } = useLoad('/api/admin/reviews');
  if (!data) return <Loading d={data} e={error} />;
  const approve = async (r, approved) => { await api.patch(`/api/admin/reviews/${r.id}`, { approved }); toast(approved ? 'Published' : 'Hidden'); reload(); reloadSite(); };
  const del = async (id) => { if (confirm('Delete this review?')) { await api.del(`/api/admin/reviews/${id}`); reload(); reloadSite(); } };
  return (
    <div className="blist">
      {!data.length && <p className="muted">Reviews from clients appear here for approval.</p>}
      {data.map((r) => (
        <div className="bitem" key={r.id}>
          <div><div className="stars">{'★'.repeat(r.rating)}<i>{'★'.repeat(5 - r.rating)}</i></div><p>{r.text || <span className="muted">No comment</span>}</p><p className="muted">{r.author}, {r.service}</p></div>
          <div className="bact">
            <span className={`pill ${r.approved ? 'confirmed' : 'pending'}`}>{r.approved ? 'published' : 'waiting'}</span>
            <button className="btn ghost sm" onClick={() => approve(r, !r.approved)}>{r.approved ? 'Hide' : 'Publish'}</button>
            <button className="btn ghost sm danger" onClick={() => del(r.id)}>Delete</button>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ---------- Messages View ---------- */
function Messages() {
  const { data, reload, error } = useLoad('/api/admin/messages');
  if (!data) return <Loading d={data} e={error} />;
  const markRead = async (id, read) => { await api.patch(`/api/admin/messages/${id}`, { read }); reload(); };
  const del = async (id) => { if (confirm('Delete this message?')) { await api.del(`/api/admin/messages/${id}`); reload(); } };
  return (
    <div className="blist">
      {!data.length && <p className="muted">No contact form messages yet. When clients send messages, they'll appear here.</p>}
      {data.map((m) => (
        <div className="bitem" key={m.id} style={{ opacity: m.read ? 0.7 : 1 }}>
          <div>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {m.name}
              {!m.read && <span className="pill pending" style={{ fontSize: '0.72rem' }}>new</span>}
            </h3>
            <p style={{ fontWeight: 600, margin: '4px 0' }}>{m.subject || 'General enquiry'}</p>
            <p className="muted">{m.email}{m.phone && ` · ${m.phone}`}</p>
            <p style={{ marginTop: 8, whiteSpace: 'pre-wrap', fontSize: '0.93rem' }}>{m.message}</p>
            <p className="muted" style={{ fontSize: '0.82rem', marginTop: 6 }}>{new Date(m.createdAt).toLocaleString('en-NG')}</p>
          </div>
          <div className="bact">
            {m.email && <a className="btn ghost sm" href={`mailto:${m.email}?subject=Re: ${encodeURIComponent(m.subject || 'Your enquiry')}`}>Reply by email</a>}
            {m.phone && <a className="btn ghost sm" href={waClient(m.phone, `Hello ${m.name}, thanks for getting in touch about "${m.subject || 'your enquiry'}".`)}>WhatsApp</a>}
            <button className="btn ghost sm" onClick={() => markRead(m.id, !m.read)}>{m.read ? 'Mark unread' : 'Mark read'}</button>
            <button className="btn ghost sm danger" onClick={() => del(m.id)}>Delete</button>
          </div>
        </div>
      ))}
    </div>
  );
}
