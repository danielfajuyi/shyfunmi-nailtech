import { useCallback, useEffect, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { toast } from '../components/Toast.jsx';
import DashShell from '../components/DashShell.jsx';
import Modal from '../components/Modal.jsx';
import { CountUp } from '../components/motion.jsx';
import {
  MenuIcon, CloseIcon, DashboardIcon, CalendarIcon, ClipboardIcon, SparklesIcon, ImageIcon, UsersIcon,
  GraduationCapIcon, StarIcon, MessageIcon, SettingsIcon, SunIcon, MoonIcon, LogOutIcon, GlobeIcon,
  PlusIcon, ChevronLeftIcon, ChevronRightIcon, DownloadIcon, SaveIcon, TrashIcon, MailIcon, WhatsAppIcon,
  ArrowRightIcon, SearchIcon, ClockIcon,
} from '../components/Icons.jsx';
import { api } from '../api.js';
import { useApp } from '../context.jsx';
import { useLoad, useTitle } from '../hooks.js';
import { fmtDate, fmtTime, money, waClient, iso } from '../utils.js';
import { Gallery, Services, Settings } from './AdminManage.jsx';

/* [key, label, icon, badge key from /api/admin/stats] grouped for the sidebar */
const NAV = [
  ['Workspace', [
    ['overview', 'Overview', DashboardIcon],
    ['calendar', 'Calendar', CalendarIcon],
    ['bookings', 'Bookings', ClipboardIcon, 'pending'],
  ]],
  ['Manage', [
    ['services', 'Services', SparklesIcon],
    ['gallery', 'Gallery', ImageIcon],
    ['clients', 'Clients', UsersIcon],
    ['training', 'Training', GraduationCapIcon, 'newEnrollments'],
  ]],
  ['Engage', [
    ['reviews', 'Reviews', StarIcon, 'pendingReviews'],
    ['messages', 'Messages', MessageIcon, 'unreadMessages'],
  ]],
  ['System', [
    ['settings', 'Settings', SettingsIcon],
  ]],
];
const TABS = NAV.flatMap(([, items]) => items);
const BLURB = {
  overview: 'Today at a glance',
  calendar: 'Appointments by day',
  bookings: 'Every booking, with status and actions',
  services: 'Menu, prices and durations',
  gallery: 'Photos and videos on your public gallery',
  clients: 'People who have booked with you',
  training: 'Nail training enquiries',
  reviews: 'Approve what shows on the site',
  messages: 'Contact form enquiries',
  settings: 'Business details, hours and loyalty',
};

export default function Admin() {
  useTitle('Admin Dashboard');
  const { user, logout, site } = useApp();
  const { tab = 'overview' } = useParams();
  const [counts, setCounts] = useState({});
  const isAdmin = user && user.role === 'admin';

  // sidebar badges (pending bookings, unread messages…) refresh whenever you change page
  useEffect(() => {
    if (!isAdmin) return;
    api.get('/api/admin/stats').then(setCounts).catch(() => {});
  }, [isAdmin, tab]);

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
  const current = TABS.find(([k]) => k === tab) || TABS[0];

  return (
    <DashShell
      brand={site.settings.businessName}
      brandSub="Admin"
      nav={NAV}
      basePath="/admin"
      tab={current[0]}
      counts={counts}
      title={current[1]}
      blurb={BLURB[current[0]]}
      user={user}
      logout={logout}
    >
      <View cur={cur} />
    </DashShell>
  );
}

function Loading({ d, e }) { return e ? <p className="err">{e}</p> : !d ? <p className="muted">Loading…</p> : null; }

function Overview() {
  const { data: d, error } = useLoad('/api/admin/stats');
  const { user } = useApp();
  if (!d) return <Loading d={d} e={error} />;
  const hr = new Date().getHours();
  const hello = hr < 12 ? 'Good morning' : hr < 17 ? 'Good afternoon' : 'Good evening';
  const first = (user?.name || '').trim().split(/\s+/)[0];

  return (
    <>
      <div className="welcome">
        <div>
          <h2>{hello}{first ? `, ${first}` : ''}</h2>
          <p className="muted">{d.todayBookings ? `You have ${d.todayBookings} appointment${d.todayBookings !== 1 ? 's' : ''} today.` : 'No appointments today.'}</p>
        </div>
        <Link to="/admin/calendar" className="btn sm"><CalendarIcon size={16} /> Open calendar</Link>
      </div>

      <div className="stats">
        {[
          ['Today', d.todayBookings, '/admin/calendar', CalendarIcon],
          ['Pending', d.pending, '/admin/bookings', ClipboardIcon],
          ['Upcoming', d.upcoming, '/admin/calendar', ClockIcon],
          ['Completed visits', d.completed, null, StarIcon],
          ['Clients', d.clients, '/admin/clients', UsersIcon],
        ].map(([l, v, to, Ico]) => (
          <div className="stat" key={l}>
            <span className="stat-ico"><Ico size={18} /></span>
            <small>{l}</small>
            <b><CountUp to={v} /></b>
            {to ? <Link to={to}>View <ArrowRightIcon size={13} /></Link> : <span className="stat-gap" />}
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
          <div className="card-head"><h3>Next appointments</h3><Link to="/admin/calendar" className="card-link">Calendar <ArrowRightIcon size={14} /></Link></div>
          {d.next.length ? d.next.map((b) => (
            <div className="line appt" key={b.id}>
              <span className="appt-who"><b>{b.name}</b><small className="muted">{b.serviceName}</small></span>
              <span className="appt-when">{fmtDate(b.date)}, {fmtTime(b.time)} <em className={`pill ${b.status}`}>{b.status}</em></span>
            </div>
          )) : <p className="muted">Nothing upcoming.</p>}
        </div>
        <div className="card">
          <div className="card-head"><h3>Popular services</h3></div>
          {d.top.length ? d.top.map((t) => <div className="line" key={t.name}><span>{t.name}</span><b>{t.count}</b></div>) : <p className="muted">No bookings yet.</p>}
          <div className="line"><span>New training enquiries</span><b>{d.newEnrollments}</b></div>
          <div className="line"><span>Reviews waiting</span><b>{d.pendingReviews}</b></div>
          <div className="line"><span>Unread messages</span><b>{d.unreadMessages}</b></div>
        </div>
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
      <div className="cal-toolbar">
        <div className="cal-nav">
          <button type="button" className="icon-btn" onClick={() => setWeekOffset((w) => w - 1)} aria-label="Previous week"><ChevronLeftIcon size={18} /></button>
          <button type="button" className="btn ghost sm" onClick={() => { setWeekOffset(0); setSelectedDate(iso(new Date())); }}>Today</button>
          <button type="button" className="icon-btn" onClick={() => setWeekOffset((w) => w + 1)} aria-label="Next week"><ChevronRightIcon size={18} /></button>
        </div>
        <button type="button" className="btn sm" onClick={() => setShowWalkIn(true)}><PlusIcon size={16} /> Add walk-in</button>
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
        <div className="card-head">
          <h3>Schedule for {fmtDate(selectedDate)}</h3>
          <span className="muted count-note">{selectedDayBookings.length} appointment{selectedDayBookings.length !== 1 ? 's' : ''}</span>
        </div>

        {selectedDayBookings.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '36px 0' }}>
            <p className="muted">No appointments scheduled for this date.</p>
            <button type="button" className="btn ghost sm" onClick={() => setShowWalkIn(true)}><PlusIcon size={15} /> Book appointment for this day</button>
          </div>
        ) : (
          <div className="timeline-list">
            {selectedDayBookings.map((b) => (
              <div key={b.id} className="timeline-item" onClick={() => setActiveBooking(b)}>
                <div className="timeline-time">
                  <b>{fmtTime(b.time)}</b>
                </div>
                <div className="timeline-content card">
                  <div className="tl-top">
                    <div className="tl-who">
                      <h4>{b.name}</h4>
                      <p className="muted">{b.serviceName} · {b.shape}</p>
                    </div>
                    <span className={`pill ${b.status}`}>{b.status}</span>
                  </div>
                  <div className="tl-bottom">
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
      <WalkInModal open={showWalkIn} onClose={() => setShowWalkIn(false)} defaultDate={selectedDate} done={() => { setShowWalkIn(false); reload(); }} />
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
        <div className="search-box grow">
          <SearchIcon size={16} />
          <input placeholder="Search name, phone or service" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search bookings" />
        </div>
        <select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter by status">
          {['all', 'pending', 'confirmed', 'completed', 'cancelled'].map((s) => <option key={s}>{s}</option>)}
        </select>
        <button type="button" className="btn sm" onClick={() => setShowWalkIn(true)}><PlusIcon size={16} /> Add walk-in</button>
        <button type="button" className="btn ghost sm" onClick={exportCSV}><DownloadIcon size={15} /> Export CSV</button>
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
      <WalkInModal open={showWalkIn} onClose={() => setShowWalkIn(false)} done={() => { setShowWalkIn(false); reload(); }} />
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
        <a className="btn ghost sm" href={waClient(b.phone, msg)} target="_blank" rel="noreferrer"><WhatsAppIcon size={15} /> WhatsApp</a>
        {mailtoLink && <a className="btn ghost sm" href={mailtoLink}><MailIcon size={15} /> Email</a>}
        <button type="button" className="btn ghost sm" onClick={onOpenModal}>Manage</button>
        <button type="button" className="btn ghost sm danger" onClick={remove}><TrashIcon size={15} /> Delete</button>
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
    <Modal
      isOpen
      onClose={onClose}
      title={booking.name}
      subtitle="Appointment details"
      maxWidth={600}
      footer={(
        <>
          <button type="button" className="btn ghost sm danger" onClick={removeBooking}><TrashIcon size={15} /> Delete</button>
          <span className="foot-spacer" />
          <button type="button" className="btn ghost sm" onClick={onClose}>Close</button>
          <button type="submit" form="appt-form" className="btn sm" disabled={busy}><SaveIcon size={15} /> {busy ? 'Saving…' : 'Save changes'}</button>
        </>
      )}
    >
      <form id="appt-form" onSubmit={saveChanges} className="modal-form">
        <div className="modal-client-meta">
          <div className="mcm-txt">
            <strong>{booking.name}</strong>
            <p className="muted"><PhoneIcon size={13} /> {booking.phone}{booking.email && ` · ${booking.email}`}</p>
          </div>
          <span className={`pill ${f.status}`}>{f.status}</span>
        </div>

        <div className="modal-service-details">
          <div><span className="muted">Service</span> <strong>{booking.serviceName}</strong></div>
          <div><span className="muted">Shape</span> <strong>{booking.shape}</strong></div>
          {booking.color && <div><span className="muted">Color idea</span> <strong>{booking.color}</strong></div>}
          {booking.notes && <div><span className="muted">Client notes</span> <em>“{booking.notes}”</em></div>}
        </div>

        <div className="grid-2 keep-2">
          <div className="field">
            <label>Date</label>
            <input type="date" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} required />
          </div>
          <div className="field">
            <label>Time</label>
            <input type="time" value={f.time} onChange={(e) => setF({ ...f, time: e.target.value })} required />
          </div>
          <div className="field">
            <label>Price ({cur})</label>
            <input type="number" inputMode="numeric" min="0" value={f.price} onChange={(e) => setF({ ...f, price: e.target.value })} />
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
          <label>Private note</label>
          <textarea
            rows="2"
            placeholder="Special client preferences, nail condition, etc."
            value={f.adminNote}
            onChange={(e) => setF({ ...f, adminNote: e.target.value })}
          />
        </div>

        <div className="contact-row">
          <a className="btn ghost sm" href={waClient(booking.phone, msg)} target="_blank" rel="noreferrer"><WhatsAppIcon size={15} /> WhatsApp</a>
          {mailtoLink && <a className="btn ghost sm" href={mailtoLink}><MailIcon size={15} /> Email client</a>}
        </div>
      </form>
    </Modal>
  );
}

/* ---------- Walk-in modal + form ---------- */
function WalkInModal({ open, onClose, defaultDate, done }) {
  const [busy, setBusy] = useState(false);
  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title="New appointment"
      subtitle="Add a walk-in or book a client who called."
      maxWidth={580}
      footer={(
        <>
          <button type="button" className="btn ghost sm" onClick={onClose}>Cancel</button>
          <button type="submit" form="walkin-form" className="btn sm" disabled={busy}><PlusIcon size={16} /> {busy ? 'Creating…' : 'Confirm booking'}</button>
        </>
      )}
    >
      <WalkInForm defaultDate={defaultDate} done={done} onBusy={setBusy} />
    </Modal>
  );
}

function WalkInForm({ defaultDate, done, onBusy }) {
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
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    if (!f.name.trim()) return toast('Please enter client name.', 'err');
    if (!f.phone.trim()) return toast('Please enter client phone number.', 'err');
    onBusy?.(true);
    try {
      await api.post('/api/admin/bookings', f);
      toast('Booking created successfully');
      done();
    } catch (x) {
      toast(x.message, 'err');
    } finally {
      onBusy?.(false);
    }
  };

  return (
    <form id="walkin-form" className="form" onSubmit={submit}>
      <div className="field">
        <label>Service</label>
        <select value={f.serviceId} onChange={set('serviceId')}>
          {site.services.map((s) => <option key={s.id} value={s.id}>{s.name} ({money(s.price, site.settings.currency)})</option>)}
        </select>
      </div>

      <div className="grid-2">
        <div className="field">
          <label>Client name</label>
          <input value={f.name} onChange={set('name')} placeholder="Full name" required />
        </div>
        <div className="field">
          <label>Phone number</label>
          <input value={f.phone} onChange={set('phone')} type="tel" inputMode="tel" placeholder="080…" required />
        </div>
      </div>

      <div className="field">
        <label>Email <span className="muted opt">optional</span></label>
        <input value={f.email} onChange={set('email')} type="email" placeholder="client@example.com" />
      </div>

      <div className="grid-2 keep-2">
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
          <label>Nail shape</label>
          <select value={f.shape} onChange={set('shape')}>
            {['Almond', 'Coffin', 'Square', 'Stiletto', 'Round', 'Not sure yet'].map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div className="field">
          <label>Color idea <span className="muted opt">optional</span></label>
          <input value={f.color} onChange={set('color')} placeholder="e.g. Blush pink, French tip" />
        </div>
      </div>

      <div className="field">
        <label>Notes / requests <span className="muted opt">optional</span></label>
        <textarea rows="2" value={f.notes} onChange={set('notes')} placeholder="Specific art, extensions, etc." />
      </div>
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
        <div className="search-box grow">
          <SearchIcon size={16} />
          <input placeholder="Search clients" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search clients" />
        </div>
        <button type="button" className="btn ghost sm" onClick={exportCSV}><DownloadIcon size={15} /> Export CSV</button>
      </div>
      <div className="table-wrap stack-table"><table>
        <thead><tr><th>Name</th><th>Contact</th><th>Bookings</th><th>Completed visits</th><th>Joined</th></tr></thead>
        <tbody>{list.map((c) => (
          <tr key={c.id}>
            <td data-label="Name"><b>{c.name}</b></td>
            <td data-label="Contact">{c.email}<br /><span className="muted">{c.phone}</span></td>
            <td data-label="Bookings">{c.bookings}</td>
            <td data-label="Completed">{c.visits}</td>
            <td data-label="Joined">{new Date(c.createdAt).toLocaleDateString('en-NG')}</td>
          </tr>
        ))}</tbody>
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
            <a className="btn ghost sm" target="_blank" rel="noreferrer" href={waClient(e.phone, `Hello ${e.name}, thank you for your interest in nail training.`)}><WhatsAppIcon size={15} /> WhatsApp</a>
            {e.email && <a className="btn ghost sm" href={`mailto:${e.email}`}><MailIcon size={15} /> Email</a>}
            <button type="button" className="btn ghost sm danger" onClick={() => del(e.id)}><TrashIcon size={15} /> Delete</button>
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
            <button type="button" className="btn ghost sm danger" onClick={() => del(r.id)}><TrashIcon size={15} /> Delete</button>
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
            {m.email && <a className="btn ghost sm" href={`mailto:${m.email}?subject=Re: ${encodeURIComponent(m.subject || 'Your enquiry')}`}><MailIcon size={15} /> Reply</a>}
            {m.phone && <a className="btn ghost sm" href={waClient(m.phone, `Hello ${m.name}, thanks for getting in touch about "${m.subject || 'your enquiry'}".`)}><WhatsAppIcon size={15} /> WhatsApp</a>}
            <button type="button" className="btn ghost sm" onClick={() => markRead(m.id, !m.read)}>{m.read ? 'Mark unread' : 'Mark read'}</button>
            <button type="button" className="btn ghost sm danger" onClick={() => del(m.id)}><TrashIcon size={15} /> Delete</button>
          </div>
        </div>
      ))}
    </div>
  );
}
