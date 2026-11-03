import { useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { toast } from '../components/Toast.jsx';
import { useTheme } from '../components/Layout.jsx';
import Logo from '../components/Logo.jsx';
import { api } from '../api.js';
import { useApp } from '../context.jsx';
import { useLoad, useTitle } from '../hooks.js';
import { fmtDate, fmtTime, money, waClient } from '../utils.js';
import { Gallery, Services, Settings } from './AdminManage.jsx';

const TABS = [['overview', 'Overview'], ['bookings', 'Bookings'], ['services', 'Services'], ['gallery', 'Gallery'], ['clients', 'Clients'], ['training', 'Training'], ['reviews', 'Reviews'], ['settings', 'Settings']];

export default function Admin() {
  useTitle('Admin');
  const { user, logout, site } = useApp();
  const { tab = 'overview' } = useParams();
  const [dark, toggle] = useTheme();
  const [menu, setMenu] = useState(false);
  if (user === undefined) return <div className="boot"><span /></div>;
  if (!user) return <Navigate to="/login?next=/admin" replace />;
  if (user.role !== 'admin') return <Navigate to="/account" replace />;
  const cur = site.settings.currency;
  const View = { overview: Overview, bookings: Bookings, services: Services, gallery: Gallery, clients: Clients, training: Training, reviews: Reviews, settings: Settings }[tab] || Overview;
  return (
    <div className="admin">
      <aside className={`side ${menu ? 'open' : ''}`}>
        <Link to="/" className="logo"><Logo size={22} /> <span>Shyfunmi</span></Link>
        <nav>{TABS.map(([k, l]) => <Link key={k} to={`/admin/${k}`} className={tab === k ? 'on' : ''} onClick={() => setMenu(false)}>{l}</Link>)}</nav>
        <div className="side-foot">
          <button className="linklike" onClick={toggle}>{dark ? 'Light mode' : 'Dark mode'}</button>
          <Link to="/">View website</Link>
          <button className="linklike" onClick={logout}>Sign out</button>
        </div>
      </aside>
      <div className="amain" data-lenis-prevent>
        <div className="atop"><button className="icon-btn menu-btn" onClick={() => setMenu(!menu)} aria-label="Menu">☰</button><h1>{TABS.find(([k]) => k === tab)?.[1] || 'Overview'}</h1></div>
        <div className="abody"><View cur={cur} /></div>
      </div>
    </div>
  );
}

function Loading({ d, e }) { return e ? <p className="err">{e}</p> : !d ? <p className="muted">Loading…</p> : null; }

function Overview({ cur }) {
  const { data: d, error } = useLoad('/api/admin/stats');
  if (!d) return <Loading d={d} e={error} />;
  const max = Math.max(1, ...d.months.map((m) => m.total));
  return (
    <>
      <div className="stats">
        {[['Pending', d.pending, '/admin/bookings'], ['Upcoming', d.upcoming], ['Completed visits', d.completed], ['Clients', d.clients, '/admin/clients'], ['Revenue', money(d.revenue, cur) === 'Price on request' ? `${cur}0` : money(d.revenue, cur)]].map(([l, v, to]) => (
          <div className="stat" key={l}><small>{l}</small><b>{v}</b>{to && <Link to={to}>View</Link>}</div>
        ))}
      </div>
      <div className="agrid">
        <div className="card"><h3>Revenue, last 6 months</h3>
          <div className="bars">{d.months.map((m) => <div key={m.month} className="bar"><i style={{ height: `${(m.total / max) * 100}%` }} title={`${cur}${m.total.toLocaleString('en-NG')}`} /><small>{m.month}</small></div>)}</div>
        </div>
        <div className="card"><h3>Popular services</h3>
          {d.top.length ? d.top.map((t) => <div className="line" key={t.name}><span>{t.name}</span><b>{t.count}</b></div>) : <p className="muted">No bookings yet.</p>}
          <div className="line"><span>New training enquiries</span><b>{d.newEnrollments}</b></div>
          <div className="line"><span>Reviews waiting</span><b>{d.pendingReviews}</b></div>
        </div>
      </div>
      <div className="card"><h3>Next appointments</h3>
        {d.next.length ? d.next.map((b) => <div className="line" key={b.id}><span><b>{b.name}</b>, {b.serviceName}</span><span>{fmtDate(b.date)}, {fmtTime(b.time)} <em className={`pill ${b.status}`}>{b.status}</em></span></div>) : <p className="muted">Nothing upcoming.</p>}
      </div>
    </>
  );
}

function Bookings({ cur }) {
  const [status, setStatus] = useState('all');
  const [q, setQ] = useState('');
  const { data, reload, error } = useLoad(`/api/admin/bookings?status=${status}&q=${encodeURIComponent(q)}`);
  const [add, setAdd] = useState(false);
  return (
    <>
      <div className="toolbar">
        <input placeholder="Search name, phone or service" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search bookings" />
        <select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter by status">
          {['all', 'pending', 'confirmed', 'completed', 'cancelled'].map((s) => <option key={s}>{s}</option>)}
        </select>
        <button className="btn sm" onClick={() => setAdd(!add)}>{add ? 'Close' : 'Add walk-in'}</button>
      </div>
      {add && <WalkIn done={() => { setAdd(false); reload(); }} />}
      <Loading d={data} e={error} />
      {data && !data.length && <p className="muted">No bookings found.</p>}
      <div className="blist">{data?.map((b) => <BookingRow key={b.id} b={b} cur={cur} reload={reload} />)}</div>
    </>
  );
}

function BookingRow({ b, cur, reload }) {
  const { site } = useApp();
  const [edit, setEdit] = useState(false);
  const [f, setF] = useState({ date: b.date, time: b.time, price: b.price, discountPct: b.discountPct, adminNote: b.adminNote || '' });
  const patch = async (body, msg = 'Saved') => { try { await api.patch(`/api/admin/bookings/${b.id}`, body); toast(msg); reload(); } catch (e) { toast(e.message, 'err'); } };
  const remove = async () => { if (confirm('Delete this booking permanently?')) { await api.del(`/api/admin/bookings/${b.id}`); toast('Deleted'); reload(); } };
  const msg = `Hello ${b.name}, your ${b.serviceName} appointment at ${site.settings.businessName} is ${b.status === 'cancelled' ? 'cancelled' : 'confirmed'} for ${fmtDate(b.date)} at ${fmtTime(b.time)}.`;
  return (
    <div className="bitem">
      <div>
        <h3>{b.name} {b.loyalty && <em className="pill gift">loyalty visit</em>}</h3>
        <p>{b.serviceName}, {b.shape}{b.color && `, ${b.color}`}</p>
        <p>{fmtDate(b.date)}, {fmtTime(b.time)}</p>
        <p className="muted">{b.phone}{b.email && `, ${b.email}`}. {b.price > 0 ? `${money(b.finalPrice, cur)}${b.discountPct ? ` after ${b.discountPct}% off` : ''}` : 'No price set'}</p>
        {b.notes && <p className="muted"><i>“{b.notes}”</i></p>}
        {b.adminNote && <p className="muted">Note: {b.adminNote}</p>}
      </div>
      <div className="bact">
        <select value={b.status} onChange={(e) => patch({ status: e.target.value }, `Marked ${e.target.value}`)} aria-label="Status" className={`pill sel ${b.status}`}>
          {['pending', 'confirmed', 'completed', 'cancelled'].map((s) => <option key={s}>{s}</option>)}
        </select>
        <a className="btn ghost sm" href={waClient(b.phone, msg)} target="_blank" rel="noreferrer">WhatsApp</a>
        <button className="btn ghost sm" onClick={() => setEdit(!edit)}>{edit ? 'Close' : 'Edit'}</button>
        <button className="btn ghost sm danger" onClick={remove}>Delete</button>
      </div>
      {edit && (
        <form className="edit-grid" onSubmit={(e) => { e.preventDefault(); patch({ ...f, price: Number(f.price), discountPct: Number(f.discountPct) }).then(() => setEdit(false)); }}>
          <div className="field"><label>Date</label><input type="date" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} /></div>
          <div className="field"><label>Time</label><input type="time" value={f.time} onChange={(e) => setF({ ...f, time: e.target.value })} /></div>
          <div className="field"><label>Price ({cur})</label><input type="number" min="0" value={f.price} onChange={(e) => setF({ ...f, price: e.target.value })} /></div>
          <div className="field"><label>Discount %</label><select value={f.discountPct} onChange={(e) => setF({ ...f, discountPct: e.target.value })}>{[...new Set([0, 10, 20, 30, 40, 50, Number(f.discountPct)])].sort((a, b) => a - b).map((n) => <option key={n}>{n}</option>)}</select></div>
          <div className="field wide"><label>Private note</label><input value={f.adminNote} onChange={(e) => setF({ ...f, adminNote: e.target.value })} /></div>
          <button className="btn sm">Save changes</button>
        </form>
      )}
    </div>
  );
}

function WalkIn({ done }) {
  const { site } = useApp();
  const [f, setF] = useState({ serviceId: site.services[0]?.id || '', name: '', phone: '', date: '', time: '10:00' });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const submit = async (e) => {
    e.preventDefault();
    try { await api.post('/api/admin/bookings', f); toast('Booking added'); done(); } catch (x) { toast(x.message, 'err'); }
  };
  return (
    <form className="card edit-grid" onSubmit={submit}>
      <div className="field"><label>Service</label><select value={f.serviceId} onChange={set('serviceId')}>{site.services.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
      <div className="field"><label>Client name</label><input value={f.name} onChange={set('name')} /></div>
      <div className="field"><label>Phone</label><input value={f.phone} onChange={set('phone')} /></div>
      <div className="field"><label>Date</label><input type="date" value={f.date} onChange={set('date')} /></div>
      <div className="field"><label>Time</label><input type="time" value={f.time} onChange={set('time')} /></div>
      <button className="btn sm">Add booking</button>
    </form>
  );
}

function Clients() {
  const { data, error } = useLoad('/api/admin/clients');
  const [q, setQ] = useState('');
  if (!data) return <Loading d={data} e={error} />;
  const list = data.filter((c) => `${c.name} ${c.email} ${c.phone}`.toLowerCase().includes(q.toLowerCase()));
  return (
    <>
      <div className="toolbar"><input placeholder="Search clients" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search clients" /></div>
      <div className="table-wrap"><table>
        <thead><tr><th>Name</th><th>Contact</th><th>Bookings</th><th>Completed visits</th><th>Joined</th></tr></thead>
        <tbody>{list.map((c) => <tr key={c.id}><td>{c.name}</td><td>{c.email}<br /><span className="muted">{c.phone}</span></td><td>{c.bookings}</td><td>{c.visits}</td><td>{new Date(c.createdAt).toLocaleDateString('en-NG')}</td></tr>)}</tbody>
      </table></div>
      {!list.length && <p className="muted">No clients yet.</p>}
    </>
  );
}

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
          <div><h3>{e.name}</h3><p>{e.level}. {e.phone}{e.email && `, ${e.email}`}</p>{e.message && <p className="muted"><i>“{e.message}”</i></p>}<p className="muted">{new Date(e.createdAt).toLocaleDateString('en-NG')}</p></div>
          <div className="bact">
            <select className="pill sel" value={e.status} onChange={(ev) => set(e.id, ev.target.value)} aria-label="Status">{['new', 'contacted', 'enrolled', 'declined'].map((s) => <option key={s}>{s}</option>)}</select>
            <a className="btn ghost sm" target="_blank" rel="noreferrer" href={waClient(e.phone, `Hello ${e.name}, thank you for your interest in nail training.`)}>WhatsApp</a>
            <button className="btn ghost sm danger" onClick={() => del(e.id)}>Delete</button>
          </div>
        </div>
      ))}
    </div>
  );
}

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
