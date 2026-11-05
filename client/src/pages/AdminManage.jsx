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


const isVideoFile = (url = '') => /\.(mp4|webm|mov|ogg)(\?|$)/i.test(url) || url.includes('video/upload/');

async function shrink(file) {
  // Don't process videos
  if (file.type.startsWith('video/')) return file;
  if (file.type === 'image/gif' || file.size < 1.2 * 1024 * 1024) return file;
  try {
    const bmp = await createImageBitmap(file);
    const k = Math.min(1, 1800 / Math.max(bmp.width, bmp.height));
    const c = document.createElement('canvas');
    c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k);
    c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
    const blob = await new Promise((r) => c.toBlob(r, 'image/jpeg', 0.85));
    return blob ? new File([blob], file.name.replace(/\.[^.]+$/, '') + '.jpg', { type: 'image/jpeg' }) : file;
  } catch { return file; }
}

export function Gallery() {
  const { reload: reloadSite, site } = useApp();
  const [tab, setTab] = useState('photos'); // 'photos' | 'videos'
  const [meta, setMeta] = useState({ category: 'Cateye', title: '', caption: '' });
  const [videoMeta, setVideoMeta] = useState({ category: 'Videos', title: '', caption: '' });
  const [files, setFiles] = useState([]);
  const [videoFiles, setVideoFiles] = useState([]);
  const [busy, setBusy] = useState(false);
  const [videoBusy, setVideoBusy] = useState(false);
  const photos = site.photos;
  const cats = [...new Set(['Cateye', 'French tips', 'Short and cute', 'Press-ons', 'Marble', 'Freestyle', 'Toe nails', 'Videos', ...photos.map((p) => p.category)])];

  const upload = async (e) => {
    e.preventDefault();
    if (!files.length) return toast('Choose at least one photo', 'err');
    setBusy(true);
    try {
      for (const f of files) {
        const fd = new FormData();
        fd.append('category', meta.category);
        fd.append('title', meta.title);
        fd.append('caption', meta.caption);
        fd.append('files', await shrink(f));
        await api.upload('/api/admin/photos', fd);
      }
      setFiles([]); e.target.reset(); toast('Photos uploaded'); reloadSite();
    } catch (x) { toast(x.message, 'err'); } finally { setBusy(false); }
  };

  const uploadVideo = async (e) => {
    e.preventDefault();
    if (!videoFiles.length) return toast('Choose at least one video', 'err');
    setVideoBusy(true);
    try {
      for (const f of videoFiles) {
        const fd = new FormData();
        fd.append('category', videoMeta.category || 'Videos');
        fd.append('title', videoMeta.title);
        fd.append('caption', videoMeta.caption);
        fd.append('files', f);
        await api.upload('/api/admin/videos', fd);
      }
      setVideoFiles([]); e.target.reset(); toast('Videos uploaded'); reloadSite();
    } catch (x) { toast(x.message, 'err'); } finally { setVideoBusy(false); }
  };

  const del = async (id) => { if (confirm('Remove this item?')) { await api.del(`/api/admin/photos/${id}`); reloadSite(); } };
  const patch = async (id, body) => { await api.patch(`/api/admin/photos/${id}`, body); reloadSite(); };

  const imageItems = photos.filter(p => !isVideoFile(p.url));
  const videoItems = photos.filter(p => isVideoFile(p.url));

  return (
    <>
      {/* Upload tabs */}
      <div className="gallery-upload-tabs">
        <button className={`gallery-tab-btn ${tab === 'photos' ? 'on' : ''}`} onClick={() => setTab('photos')}>
          <span>🖼️</span> Upload Photos
        </button>
        <button className={`gallery-tab-btn ${tab === 'videos' ? 'on' : ''}`} onClick={() => setTab('videos')}>
          <span>🎬</span> Upload Videos
        </button>
      </div>

      {/* Photo upload form */}
      {tab === 'photos' && (
        <form className="card edit-grid" onSubmit={upload}>
          <h3 className="wide">Upload Photos to Gallery</h3>
          <div className="field"><label htmlFor="gc">Tag / style</label><input id="gc" list="cats" value={meta.category} onChange={(e) => setMeta({ ...meta, category: e.target.value })} /><datalist id="cats">{cats.map((c) => <option key={c} value={c} />)}</datalist></div>
          <div className="field"><label htmlFor="gt">Title</label><input id="gt" value={meta.title} onChange={(e) => setMeta({ ...meta, title: e.target.value })} placeholder="e.g. Blush cateye set" /></div>
          <div className="field wide"><label htmlFor="gd">Caption / details</label><input id="gd" value={meta.caption} onChange={(e) => setMeta({ ...meta, caption: e.target.value })} placeholder="Shape, length, or client request" /></div>
          <div className="field wide">
            <label htmlFor="gf">Photos (JPG, PNG, WebP — up to 12 at once)</label>
            <input id="gf" type="file" accept="image/*" multiple onChange={(e) => setFiles(Array.from(e.target.files))} />
            {files.length > 0 && <p className="muted" style={{ marginTop: 6, fontSize: '0.85rem' }}>{files.length} file{files.length > 1 ? 's' : ''} selected</p>}
          </div>
          <button className="btn sm" disabled={busy}>{busy ? 'Uploading…' : 'Upload Photos'}</button>
        </form>
      )}

      {/* Video upload form */}
      {tab === 'videos' && (
        <form className="card edit-grid" onSubmit={uploadVideo}>
          <div className="wide" style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
            <h3 style={{ margin: 0 }}>Upload Videos to Gallery</h3>
            <span className="pill" style={{ background: 'color-mix(in srgb, var(--accent) 18%, transparent)' }}>NEW</span>
          </div>
          <p className="muted wide" style={{ margin: '0 0 4px', fontSize: '0.88rem' }}>MP4, WebM or MOV — up to 50 MB each. Videos appear in a dedicated "Videos" tab in the gallery.</p>
          <div className="field"><label htmlFor="vc">Tag / style</label><input id="vc" list="vcats" value={videoMeta.category} onChange={(e) => setVideoMeta({ ...videoMeta, category: e.target.value })} /><datalist id="vcats">{cats.map((c) => <option key={c} value={c} />)}</datalist></div>
          <div className="field"><label htmlFor="vt">Title</label><input id="vt" value={videoMeta.title} onChange={(e) => setVideoMeta({ ...videoMeta, title: e.target.value })} placeholder="e.g. Marble nail tutorial" /></div>
          <div className="field wide"><label htmlFor="vd">Caption / details</label><input id="vd" value={videoMeta.caption} onChange={(e) => setVideoMeta({ ...videoMeta, caption: e.target.value })} placeholder="Style, technique, or notes" /></div>
          <div className="field wide">
            <label htmlFor="vf">Videos (MP4, WebM, MOV)</label>
            <input id="vf" type="file" accept="video/mp4,video/webm,video/quicktime,video/*" multiple onChange={(e) => setVideoFiles(Array.from(e.target.files))} />
            {videoFiles.length > 0 && <p className="muted" style={{ marginTop: 6, fontSize: '0.85rem' }}>{videoFiles.length} video{videoFiles.length > 1 ? 's' : ''} selected · {videoFiles.map(f => (f.size / 1024 / 1024).toFixed(1) + ' MB').join(', ')}</p>}
          </div>
          <button className="btn sm" disabled={videoBusy}>{videoBusy ? 'Uploading…' : 'Upload Videos'}</button>
        </form>
      )}

      {/* Media library */}
      <div style={{ marginTop: 24 }}>
        <div className="gallery-manage-tabs">
          <h3 style={{ margin: '0 0 16px', fontSize: '1.1rem', fontWeight: 500 }}>
            Media Library · <span className="muted" style={{ fontSize: '0.9rem', fontWeight: 400 }}>{photos.length} item{photos.length !== 1 ? 's' : ''}</span>
          </h3>
        </div>
        {!photos.length && <p className="muted">No photos or videos yet. Until you add some, the gallery shows style placeholders.</p>}

        {imageItems.length > 0 && (
          <>
            <p className="muted" style={{ fontSize: '0.82rem', marginBottom: 10, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Photos ({imageItems.length})</p>
            <div className="thumbs" style={{ marginBottom: 24 }}>
              {imageItems.map((p) => (
                <div className="th" key={p.id}>
                  <img src={p.url} alt={p.title || `${p.category} nails`} loading="lazy" />
                  <input list="cats" defaultValue={p.category} aria-label="Tag" onBlur={(e) => e.target.value !== p.category && patch(p.id, { category: e.target.value })} />
                  <input defaultValue={p.title || ''} placeholder="Title" aria-label="Title" onBlur={(e) => e.target.value !== (p.title || '') && patch(p.id, { title: e.target.value })} />
                  <input defaultValue={p.caption || ''} placeholder="Details" aria-label="Caption" onBlur={(e) => e.target.value !== (p.caption || '') && patch(p.id, { caption: e.target.value })} />
                  <button className="x" onClick={() => del(p.id)} aria-label="Remove photo">✕</button>
                </div>
              ))}
            </div>
          </>
        )}

        {videoItems.length > 0 && (
          <>
            <p className="muted" style={{ fontSize: '0.82rem', marginBottom: 10, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Videos ({videoItems.length})</p>
            <div className="thumbs">
              {videoItems.map((p) => (
                <div className="th video-th" key={p.id}>
                  <div className="video-th-preview">
                    <video src={p.url} muted playsInline preload="metadata" className="video-th-player" />
                    <span className="video-th-badge">▶</span>
                  </div>
                  <input list="cats" defaultValue={p.category} aria-label="Tag" onBlur={(e) => e.target.value !== p.category && patch(p.id, { category: e.target.value })} />
                  <input defaultValue={p.title || ''} placeholder="Title" aria-label="Title" onBlur={(e) => e.target.value !== (p.title || '') && patch(p.id, { title: e.target.value })} />
                  <input defaultValue={p.caption || ''} placeholder="Details" aria-label="Caption" onBlur={(e) => e.target.value !== (p.caption || '') && patch(p.id, { caption: e.target.value })} />
                  <button className="x" onClick={() => del(p.id)} aria-label="Remove video">✕</button>
                </div>
              ))}
            </div>
          </>
        )}
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
