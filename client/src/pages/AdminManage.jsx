import { useEffect, useState } from 'react';
import { toast } from '../components/Toast.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import Switch from '../components/Switch.jsx';
import { PlusIcon, SaveIcon, TrashIcon, CloseIcon, SparklesIcon } from '../components/Icons.jsx';
import { api } from '../api.js';
import { useApp } from '../context.jsx';
import { useLoad } from '../hooks.js';
import { DAYS } from '../utils.js';

export { default as Gallery } from './AdminGallery.jsx';

/* ------------------------------------------------------------------ */
/* Services: "Add a service" comes first in the DOM, so on phones it   */
/* sits above the list. On wide screens CSS moves it to a side panel.   */
/* ------------------------------------------------------------------ */
const BLANK = { name: '', description: '', duration: 60, price: 0 };

export function Services({ cur }) {
  const { reload: reloadSite } = useApp();
  const { data, reload } = useLoad('/api/admin/services');
  const [n, setN] = useState(BLANK);
  const [busy, setBusy] = useState(false);
  const refresh = () => { reload(); reloadSite(); };

  const add = async (e) => {
    e.preventDefault();
    if (!n.name.trim()) return toast('Give the service a name', 'err');
    setBusy(true);
    try {
      await api.post('/api/admin/services', { ...n, name: n.name.trim() });
      setN(BLANK); toast('Service added'); refresh();
    } catch (x) { toast(x.message, 'err'); } finally { setBusy(false); }
  };

  return (
    <div className="svc-admin">
      <form className="card svc-add" onSubmit={add}>
        <div className="panel-head">
          <span className="panel-ico"><PlusIcon size={18} /></span>
          <div><h3>Add a service</h3><p className="muted">It goes live on the booking page straight away.</p></div>
        </div>
        <div className="field"><label htmlFor="ns-name">Name</label><input id="ns-name" value={n.name} onChange={(e) => setN({ ...n, name: e.target.value })} placeholder="e.g. Gel-X full set" /></div>
        <div className="grid-2 keep-2">
          <div className="field"><label htmlFor="ns-min">Minutes</label><input id="ns-min" type="number" inputMode="numeric" min="15" step="15" value={n.duration} onChange={(e) => setN({ ...n, duration: e.target.value })} /></div>
          <div className="field"><label htmlFor="ns-price">Price ({cur})</label><input id="ns-price" type="number" inputMode="numeric" min="0" value={n.price} onChange={(e) => setN({ ...n, price: e.target.value })} /></div>
        </div>
        <div className="field"><label htmlFor="ns-desc">Description</label><textarea id="ns-desc" rows="3" value={n.description} onChange={(e) => setN({ ...n, description: e.target.value })} placeholder="What’s included, length, finish…" /></div>
        <button className="btn" disabled={busy}><PlusIcon size={16} /> {busy ? 'Adding…' : 'Add service'}</button>
      </form>

      <div className="svc-list">
        <p className="muted svc-hint">Set prices in {cur}. A price of 0 shows as “Price on request”. Duration decides how long a slot is blocked.</p>
        {!data && <p className="muted">Loading…</p>}
        {data && !data.length && (
          <div className="empty-state"><span className="empty-ico"><SparklesIcon size={26} /></span><strong>No services yet</strong><p className="muted">Add your first service to start taking bookings.</p></div>
        )}
        {data?.map((s) => <ServiceRow key={s.id} s={s} cur={cur} refresh={refresh} />)}
      </div>
    </div>
  );
}

function ServiceRow({ s, cur, refresh }) {
  const [f, setF] = useState(s);
  const [busy, setBusy] = useState(false);
  const [ask, setAsk] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });
  const dirty = ['name', 'duration', 'price', 'description', 'active'].some((k) => String(f[k] ?? '') !== String(s[k] ?? ''));

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    try { await api.patch(`/api/admin/services/${s.id}`, f); toast('Saved'); refresh(); }
    catch (x) { toast(x.message, 'err'); } finally { setBusy(false); }
  };
  const del = async () => {
    try { await api.del(`/api/admin/services/${s.id}`); toast('Service deleted'); setAsk(false); refresh(); }
    catch (x) { toast(x.message, 'err'); }
  };

  return (
    <form className={`card svc-card-admin ${f.active ? '' : 'is-off'}`} onSubmit={save}>
      <div className="svc-card-top">
        <h4>{s.name}</h4>
        <Switch checked={!!f.active} onChange={set('active')} label={f.active ? 'Visible' : 'Hidden'} />
      </div>
      <div className="svc-fields">
        <div className="field svc-name"><label>Name</label><input value={f.name} onChange={set('name')} /></div>
        <div className="field"><label>Minutes</label><input type="number" inputMode="numeric" min="15" step="15" value={f.duration} onChange={set('duration')} /></div>
        <div className="field"><label>Price ({cur})</label><input type="number" inputMode="numeric" min="0" value={f.price} onChange={set('price')} /></div>
        <div className="field svc-desc"><label>Description</label><input value={f.description || ''} onChange={set('description')} /></div>
      </div>
      <div className="svc-card-foot">
        <button type="button" className="btn ghost sm danger" onClick={() => setAsk(true)}><TrashIcon size={15} /> Delete</button>
        <button className="btn sm" disabled={busy || !dirty}><SaveIcon size={15} /> {busy ? 'Saving…' : 'Save'}</button>
      </div>
      <ConfirmDialog
        open={ask}
        title={`Delete “${s.name}”?`}
        message="Past bookings keep their details. The service will no longer appear on the website."
        onConfirm={del}
        onClose={() => setAsk(false)}
      />
    </form>
  );
}

/* ------------------------------------------------------------------ */
/* Settings                                                             */
/* ------------------------------------------------------------------ */
const DEFAULT_DAY = { open: '09:00', close: '18:00', closed: false };

export function Settings() {
  const { reload: reloadSite } = useApp();
  const { data } = useLoad('/api/admin/settings');
  const [f, setF] = useState(null);
  const [blocked, setBlocked] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (data) setF(data); }, [data]);
  if (!f) return <p className="muted">Loading…</p>;

  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const day = (k) => ({ ...DEFAULT_DAY, ...(f.hours?.[k] || {}) });
  const hour = (k, p, v) => setF({ ...f, hours: { ...f.hours, [k]: { ...day(k), [p]: v } } });
  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    try { setF(await api.put('/api/admin/settings', f)); toast('Settings saved'); reloadSite(); }
    catch (x) { toast(x.message, 'err'); } finally { setBusy(false); }
  };

  return (
    <form className="settings" onSubmit={save}>
      <section className="card form">
        <div className="panel-head"><div><h3>Business</h3><p className="muted">Shown on the website, footer and booking emails.</p></div></div>
        <div className="grid-2">
          <div className="field"><label>Business name</label><input value={f.businessName} onChange={set('businessName')} /></div>
          <div className="field"><label>Tagline</label><input value={f.tagline} onChange={set('tagline')} /></div>
          <div className="field"><label>Address</label><input value={f.address} onChange={set('address')} /></div>
          <div className="field"><label>Phone</label><input type="tel" value={f.phone} onChange={set('phone')} /></div>
          <div className="field"><label>WhatsApp number</label><input inputMode="numeric" value={f.whatsapp} onChange={set('whatsapp')} placeholder="2348012345678" /><small className="muted hint">Include the country code, e.g. 2348012345678</small></div>
          <div className="field"><label>Currency symbol</label><input value={f.currency} onChange={set('currency')} /></div>
          <div className="field"><label>Instagram username</label><input value={f.instagram} onChange={set('instagram')} /></div>
          <div className="field"><label>TikTok username</label><input value={f.tiktok} onChange={set('tiktok')} /></div>
        </div>
      </section>

      <section className="card form">
        <div className="panel-head"><div><h3>Opening hours</h3><p className="muted">Clients can only book inside these times.</p></div></div>
        <div className="hours-list">
          {DAYS.map(([k, label]) => {
            const h = day(k);
            return (
              <div className={`hours-row ${h.closed ? 'closed' : ''}`} key={k}>
                <div className="hours-day">
                  <b>{label}</b>
                  <Switch checked={!h.closed} onChange={(e) => hour(k, 'closed', !e.target.checked)} label={h.closed ? 'Closed' : 'Open'} />
                </div>
                <div className="hours-times">
                  <label><span>Opens</span><input type="time" value={h.open} disabled={h.closed} onChange={(e) => hour(k, 'open', e.target.value)} aria-label={`${label} opens`} /></label>
                  <label><span>Closes</span><input type="time" value={h.close} disabled={h.closed} onChange={(e) => hour(k, 'close', e.target.value)} aria-label={`${label} closes`} /></label>
                </div>
              </div>
            );
          })}
        </div>
        <div className="field"><label>Booking slot interval</label>
          <select value={f.slotStep} onChange={set('slotStep')}>{[30, 60, 90, 120].map((n) => <option key={n} value={n}>Every {n} minutes</option>)}</select></div>
      </section>

      <section className="card form">
        <div className="panel-head"><div><h3>Days off</h3><p className="muted">Holidays and breaks. Clients can’t book these dates.</p></div></div>
        <div className="dayoff-row">
          <input type="date" value={blocked} onChange={(e) => setBlocked(e.target.value)} aria-label="Date off" />
          <button type="button" className="btn ghost sm" onClick={() => { if (blocked && !f.blockedDates.includes(blocked)) setF({ ...f, blockedDates: [...f.blockedDates, blocked].sort() }); setBlocked(''); }}><PlusIcon size={15} /> Add day off</button>
        </div>
        {f.blockedDates.length > 0 && (
          <div className="chips tight">{f.blockedDates.map((d) => <button type="button" key={d} className="chip on removable" onClick={() => setF({ ...f, blockedDates: f.blockedDates.filter((x) => x !== d) })} aria-label={`Remove ${d}`}>{d} <CloseIcon size={13} /></button>)}</div>
        )}
      </section>

      <section className="card form">
        <div className="panel-head"><div><h3>Loyalty rewards</h3><p className="muted">You can change the discount on any single booking, for example to 50%.</p></div></div>
        <div className="grid-2">
          <div className="field"><label>Reward every N visits</label><input type="number" inputMode="numeric" min="2" max="20" value={f.loyaltyEvery} onChange={set('loyaltyEvery')} /></div>
          <div className="field"><label>Default discount %</label><input type="number" inputMode="numeric" min="0" max="100" value={f.loyaltyDiscount} onChange={set('loyaltyDiscount')} /></div>
        </div>
      </section>

      <div className="save-bar">
        <button className="btn" disabled={busy}><SaveIcon size={16} /> {busy ? 'Saving…' : 'Save settings'}</button>
      </div>
    </form>
  );
}
