import { useEffect, useState } from 'react';
import { toast } from '../components/Toast.jsx';
import { api } from '../api.js';
import { useApp } from '../context.jsx';
import { useLoad } from '../hooks.js';
import { DAYS } from '../utils.js';

export function Services({ cur }) {
  const { reload: reloadSite } = useApp();
  const { data, reload } = useLoad('/api/admin/services');
  const [n, setN] = useState({ name: '', description: '', duration: 60, price: 0 });
  const refresh = () => { reload(); reloadSite(); };
  const add = async (e) => {
    e.preventDefault();
    try { await api.post('/api/admin/services', n); setN({ name: '', description: '', duration: 60, price: 0 }); toast('Service added'); refresh(); } catch (x) { toast(x.message, 'err'); }
  };
  return (
    <>
      <p className="muted">Set prices in {cur}. A price of 0 shows as “Price on request”. Duration decides how long a slot is blocked.</p>
      <div className="blist">{data?.map((s) => <ServiceRow key={s.id} s={s} refresh={refresh} />)}</div>
      <form className="card edit-grid" onSubmit={add}>
        <h3 className="wide">Add a service</h3>
        <div className="field"><label>Name</label><input value={n.name} onChange={(e) => setN({ ...n, name: e.target.value })} /></div>
        <div className="field"><label>Minutes</label><input type="number" min="15" step="15" value={n.duration} onChange={(e) => setN({ ...n, duration: e.target.value })} /></div>
        <div className="field"><label>Price</label><input type="number" min="0" value={n.price} onChange={(e) => setN({ ...n, price: e.target.value })} /></div>
        <div className="field wide"><label>Description</label><input value={n.description} onChange={(e) => setN({ ...n, description: e.target.value })} /></div>
        <button className="btn sm">Add service</button>
      </form>
    </>
  );
}

function ServiceRow({ s, refresh }) {
  const [f, setF] = useState(s);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });
  const save = async (e) => { e.preventDefault(); try { await api.patch(`/api/admin/services/${s.id}`, f); toast('Saved'); refresh(); } catch (x) { toast(x.message, 'err'); } };
  const del = async () => { if (confirm(`Delete “${s.name}”? Past bookings keep their details.`)) { await api.del(`/api/admin/services/${s.id}`); refresh(); } };
  return (
    <form className="bitem edit-grid" onSubmit={save}>
      <div className="field"><label>Name</label><input value={f.name} onChange={set('name')} /></div>
      <div className="field"><label>Minutes</label><input type="number" min="15" step="15" value={f.duration} onChange={set('duration')} /></div>
      <div className="field"><label>Price</label><input type="number" min="0" value={f.price} onChange={set('price')} /></div>
      <div className="field wide"><label>Description</label><input value={f.description} onChange={set('description')} /></div>
      <label className="check"><input type="checkbox" checked={f.active} onChange={set('active')} /> Visible on website</label>
      <div className="bact"><button className="btn sm">Save</button><button type="button" className="btn ghost sm danger" onClick={del}>Delete</button></div>
    </form>
  );
}

export function Gallery() {
  const { reload: reloadSite, site } = useApp();
  const [cat, setCat] = useState('Cateye');
  const [files, setFiles] = useState([]);
  const [busy, setBusy] = useState(false);
  const photos = site.photos;
  const cats = [...new Set(['Cateye', 'French tips', 'Short and cute', 'Press-ons', 'Marble', 'Freestyle', 'Toe nails', ...photos.map((p) => p.category)])];
  const upload = async (e) => {
    e.preventDefault();
    if (!files.length) return toast('Choose at least one photo', 'err');
    const fd = new FormData(); fd.append('category', cat); [...files].forEach((f) => fd.append('files', f));
    setBusy(true);
    try { await api.upload('/api/admin/photos', fd); setFiles([]); e.target.reset(); toast('Photos uploaded'); reloadSite(); } catch (x) { toast(x.message, 'err'); } finally { setBusy(false); }
  };
  const del = async (id) => { if (confirm('Remove this photo?')) { await api.del(`/api/admin/photos/${id}`); reloadSite(); } };
  const move = async (id, category) => { await api.patch(`/api/admin/photos/${id}`, { category }); reloadSite(); };
  return (
    <>
      <form className="card edit-grid" onSubmit={upload}>
        <div className="field"><label htmlFor="gc">Style</label><input id="gc" list="cats" value={cat} onChange={(e) => setCat(e.target.value)} /><datalist id="cats">{cats.map((c) => <option key={c} value={c} />)}</datalist></div>
        <div className="field wide"><label htmlFor="gf">Photos (JPG, PNG, WebP; up to 12 at once)</label><input id="gf" type="file" accept="image/*" multiple onChange={(e) => setFiles(e.target.files)} /></div>
        <button className="btn sm" disabled={busy}>{busy ? 'Uploading…' : 'Upload'}</button>
      </form>
      {!photos.length && <p className="muted">No photos yet. Until you add some, visitors see style tiles.</p>}
      <div className="thumbs">
        {photos.map((p) => (
          <div className="th" key={p.id}>
            <img src={p.url} alt={`${p.category} nails`} loading="lazy" />
            <input list="cats" defaultValue={p.category} aria-label="Style" onBlur={(e) => e.target.value !== p.category && move(p.id, e.target.value)} />
            <button className="x" onClick={() => del(p.id)} aria-label="Remove photo">✕</button>
          </div>
        ))}
      </div>
    </>
  );
}

export function Settings() {
  const { reload: reloadSite } = useApp();
  const { data } = useLoad('/api/admin/settings');
  const [f, setF] = useState(null);
  const [blocked, setBlocked] = useState('');
  useEffect(() => { if (data) setF(data); }, [data]);
  if (!f) return <p className="muted">Loading…</p>;
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const hour = (k, p, v) => setF({ ...f, hours: { ...f.hours, [k]: { ...f.hours[k], [p]: v } } });
  const save = async (e) => {
    e.preventDefault();
    try { setF(await api.put('/api/admin/settings', f)); toast('Settings saved'); reloadSite(); } catch (x) { toast(x.message, 'err'); }
  };
  return (
    <form className="settings" onSubmit={save}>
      <div className="card form">
        <h3>Business</h3>
        <div className="grid-2">
          <div className="field"><label>Business name</label><input value={f.businessName} onChange={set('businessName')} /></div>
          <div className="field"><label>Tagline</label><input value={f.tagline} onChange={set('tagline')} /></div>
          <div className="field"><label>Address</label><input value={f.address} onChange={set('address')} /></div>
          <div className="field"><label>Phone</label><input value={f.phone} onChange={set('phone')} /></div>
          <div className="field"><label>WhatsApp number (with country code, e.g. 2348012345678)</label><input inputMode="numeric" value={f.whatsapp} onChange={set('whatsapp')} /></div>
          <div className="field"><label>Currency symbol</label><input value={f.currency} onChange={set('currency')} /></div>
          <div className="field"><label>Instagram username</label><input value={f.instagram} onChange={set('instagram')} /></div>
          <div className="field"><label>TikTok username</label><input value={f.tiktok} onChange={set('tiktok')} /></div>
        </div>
      </div>
      <div className="card form">
        <h3>Opening hours</h3>
        {DAYS.map(([k, label]) => (
          <div className="hrow" key={k}>
            <b>{label}</b>
            <label className="check"><input type="checkbox" checked={!f.hours[k].closed} onChange={(e) => hour(k, 'closed', !e.target.checked)} /> Open</label>
            <input type="time" value={f.hours[k].open} disabled={f.hours[k].closed} onChange={(e) => hour(k, 'open', e.target.value)} aria-label={`${label} opens`} />
            <input type="time" value={f.hours[k].close} disabled={f.hours[k].closed} onChange={(e) => hour(k, 'close', e.target.value)} aria-label={`${label} closes`} />
          </div>
        ))}
        <div className="field"><label>Booking slot interval</label>
          <select value={f.slotStep} onChange={set('slotStep')}>{[30, 60, 90, 120].map((n) => <option key={n} value={n}>Every {n} minutes</option>)}</select></div>
      </div>
      <div className="card form">
        <h3>Days off</h3>
        <div className="cta-row"><input type="date" value={blocked} onChange={(e) => setBlocked(e.target.value)} aria-label="Date off" />
          <button type="button" className="btn ghost sm" onClick={() => { if (blocked && !f.blockedDates.includes(blocked)) setF({ ...f, blockedDates: [...f.blockedDates, blocked].sort() }); setBlocked(''); }}>Add day off</button></div>
        <div className="chips">{f.blockedDates.map((d) => <button type="button" key={d} className="chip on" onClick={() => setF({ ...f, blockedDates: f.blockedDates.filter((x) => x !== d) })}>{d} ✕</button>)}</div>
      </div>
      <div className="card form">
        <h3>Loyalty rewards</h3>
        <div className="grid-2">
          <div className="field"><label>Reward every N visits</label><input type="number" min="2" max="20" value={f.loyaltyEvery} onChange={set('loyaltyEvery')} /></div>
          <div className="field"><label>Default discount %</label><input type="number" min="0" max="100" value={f.loyaltyDiscount} onChange={set('loyaltyDiscount')} /></div>
        </div>
        <p className="muted">You can change the discount on any single booking (for example to 50%).</p>
      </div>
      <button className="btn">Save settings</button>
    </form>
  );
}
