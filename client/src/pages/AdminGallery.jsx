import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from '../components/Toast.jsx';
import { api } from '../api.js';
import { useApp } from '../context.jsx';
import { isVideo } from '../utils.js';
import { TiltCard } from '../components/motion.jsx';
import VideoCard, { getVideoPoster } from '../components/VideoCard.jsx';
import MediaViewer from '../components/MediaViewer.jsx';
import Modal from '../components/Modal.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import {
  ImageIcon, VideoIcon, UploadIcon, EditIcon, TrashIcon, SaveIcon, CloseIcon, SearchIcon, LayersIcon,
} from '../components/Icons.jsx';

const BASE_TAGS = ['Cateye', 'French tips', 'Short and cute', 'Press-ons', 'Marble', 'Freestyle', 'Toe nails', 'Videos'];
const mb = (n) => `${(n / 1024 / 1024).toFixed(1)} MB`;

/* Big photos are resized in the browser before upload; videos are sent untouched. */
async function shrink(file) {
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

/* ------------------------------------------------------------------ */
/* Upload panel                                                         */
/* ------------------------------------------------------------------ */
function UploadPanel({ cats, onDone }) {
  const [kind, setKind] = useState('photos'); // 'photos' | 'videos'
  const [meta, setMeta] = useState({
    photos: { category: 'Cateye', title: '', caption: '' },
    videos: { category: 'Videos', title: '', caption: '' },
  });
  const [files, setFiles] = useState({ photos: [], videos: [] });
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState('');
  const [drag, setDrag] = useState(false);
  const input = useRef(null);

  const isVid = kind === 'videos';
  const m = meta[kind];
  const list = files[kind];
  const setM = (k) => (e) => setMeta({ ...meta, [kind]: { ...m, [k]: e.target.value } });
  const accept = isVid ? 'video/*' : 'image/*';

  const addFiles = (incoming) => {
    const ok = Array.from(incoming).filter((f) => f.type.startsWith(isVid ? 'video/' : 'image/'));
    if (!ok.length) return toast(`Those files aren't ${isVid ? 'videos' : 'photos'}.`, 'err');
    const next = [...list, ...ok].slice(0, isVid ? 6 : 12);
    setFiles({ ...files, [kind]: next });
  };
  const removeAt = (i) => setFiles({ ...files, [kind]: list.filter((_, x) => x !== i) });

  const submit = async (e) => {
    e.preventDefault();
    if (!list.length) return toast(`Choose at least one ${isVid ? 'video' : 'photo'}`, 'err');
    setBusy(true);
    try {
      let n = 0;
      for (const f of list) {
        n += 1;
        setProgress(`Uploading ${n} of ${list.length}…`);
        const fd = new FormData();
        fd.append('category', m.category || (isVid ? 'Videos' : 'Latest'));
        fd.append('title', m.title);
        fd.append('caption', m.caption);
        fd.append('files', isVid ? f : await shrink(f));
        await api.upload(isVid ? '/api/admin/videos' : '/api/admin/photos', fd);
      }
      setFiles({ ...files, [kind]: [] });
      setMeta({ ...meta, [kind]: { ...m, title: '', caption: '' } });
      toast(`${list.length} ${isVid ? 'video' : 'photo'}${list.length > 1 ? 's' : ''} uploaded`);
      onDone();
    } catch (x) { toast(x.message, 'err'); } finally { setBusy(false); setProgress(''); }
  };

  return (
    <section className="am-upload card">
      <div className="am-upload-head">
        <div>
          <h3>Add to gallery</h3>
          <p className="muted">New uploads appear on the public Gallery straight away.</p>
        </div>
        <div className="seg" role="tablist" aria-label="Upload type">
          <button type="button" role="tab" aria-selected={!isVid} className={!isVid ? 'on' : ''} onClick={() => setKind('photos')}>
            <ImageIcon size={16} /> Photos
          </button>
          <button type="button" role="tab" aria-selected={isVid} className={isVid ? 'on' : ''} onClick={() => setKind('videos')}>
            <VideoIcon size={16} /> Videos
          </button>
        </div>
      </div>

      <form onSubmit={submit} className="am-upload-form">
        <div
          className={`dropzone ${drag ? 'drag' : ''}`}
          onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => { e.preventDefault(); setDrag(false); addFiles(e.dataTransfer.files); }}
        >
          <span className="dz-ico">{isVid ? <VideoIcon size={22} /> : <ImageIcon size={22} />}</span>
          <div className="dz-copy">
            <strong>{isVid ? 'Drop videos here' : 'Drop photos here'}</strong>
            <span className="muted">
              {isVid ? 'MP4, WebM or MOV, up to 50 MB each' : 'JPG, PNG or WebP, up to 12 at once. Large photos are resized for you.'}
            </span>
          </div>
          <button type="button" className="btn ghost sm" onClick={() => input.current?.click()}>
            <UploadIcon size={15} /> Browse files
          </button>
          <input
            ref={input}
            type="file"
            hidden
            accept={accept}
            multiple
            onChange={(e) => { addFiles(e.target.files); e.target.value = ''; }}
          />
        </div>

        {list.length > 0 && (
          <ul className="am-files">
            {list.map((f, i) => (
              <li key={`${f.name}-${i}`}>
                <span className="am-file-ico">{isVid ? <VideoIcon size={16} /> : <ImageIcon size={16} />}</span>
                <span className="am-file-name">{f.name}</span>
                <span className="muted am-file-size">{mb(f.size)}</span>
                <button type="button" className="icon-btn xs" onClick={() => removeAt(i)} aria-label={`Remove ${f.name}`} disabled={busy}>
                  <CloseIcon size={14} />
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="am-fields">
          <div className="field">
            <label htmlFor="up-tag">Tag / style</label>
            <input id="up-tag" value={m.category} onChange={setM('category')} maxLength={40} placeholder="e.g. Cateye" />
            <div className="tag-suggest">
              {cats.slice(0, 7).map((c) => (
                <button type="button" key={c} className={`chip xs ${m.category === c ? 'on' : ''}`} onClick={() => setMeta({ ...meta, [kind]: { ...m, category: c } })}>{c}</button>
              ))}
            </div>
          </div>
          <div className="field">
            <label htmlFor="up-title">Title</label>
            <input id="up-title" value={m.title} onChange={setM('title')} maxLength={80} placeholder={isVid ? 'e.g. Marble nail tutorial' : 'e.g. Blush cateye set'} />
          </div>
          <div className="field am-wide">
            <label htmlFor="up-cap">Caption / details</label>
            <input id="up-cap" value={m.caption} onChange={setM('caption')} maxLength={240} placeholder={isVid ? 'Style, technique, or notes' : 'Shape, length, or client request'} />
          </div>
        </div>

        <div className="am-upload-foot">
          {busy && <span className="muted">{progress}</span>}
          <button className="btn" disabled={busy || !list.length}>
            <UploadIcon size={16} /> {busy ? 'Uploading…' : list.length ? `Upload ${list.length} ${isVid ? 'video' : 'photo'}${list.length === 1 ? '' : 's'}` : `Upload ${isVid ? 'videos' : 'photos'}`}
          </button>
        </div>
      </form>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Edit dialog                                                          */
/* ------------------------------------------------------------------ */
function MediaEditor({ item, cats, onClose, onSaved, onAskDelete }) {
  const vid = isVideo(item.url);
  const start = { category: item.category || '', title: item.title || '', caption: item.caption || '' };
  const [f, setF] = useState(start);
  const [busy, setBusy] = useState(false);
  const dirty = f.category !== start.category || f.title !== start.title || f.caption !== start.caption;
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const save = async (e) => {
    e?.preventDefault();
    if (!f.category.trim()) return toast('Tag can’t be empty', 'err');
    setBusy(true);
    try {
      await api.patch(`/api/admin/photos/${item.id}`, { category: f.category.trim(), title: f.title.trim(), caption: f.caption.trim() });
      toast('Changes saved');
      await onSaved();
      onClose();
    } catch (x) { toast(x.message, 'err'); } finally { setBusy(false); }
  };

  return (
    <Modal
      isOpen
      onClose={busy ? () => {} : onClose}
      title={vid ? 'Edit video' : 'Edit photo'}
      subtitle="Changes show on the public gallery as soon as you save."
      maxWidth={760}
      footer={(
        <>
          <button type="button" className="btn ghost sm danger" onClick={onAskDelete} disabled={busy}>
            <TrashIcon size={15} /> Delete
          </button>
          <span className="foot-spacer" />
          <button type="button" className="btn ghost sm" onClick={onClose} disabled={busy}>Cancel</button>
          <button type="submit" form="media-edit-form" className="btn sm" disabled={busy || !dirty}>
            <SaveIcon size={15} /> {busy ? 'Saving…' : 'Save changes'}
          </button>
        </>
      )}
    >
      <div className="am-edit">
        <div className={`am-edit-preview ${vid ? 'is-video' : ''}`}>
          {vid ? (
            <video src={item.url} poster={getVideoPoster(item.url)} controls playsInline preload="metadata" />
          ) : (
            <img src={item.url} alt={item.title || `${item.category} nails`} />
          )}
        </div>
        <form id="media-edit-form" className="am-edit-form" onSubmit={save}>
          <div className="field">
            <label htmlFor="ed-tag">Tag / style</label>
            <input id="ed-tag" value={f.category} onChange={set('category')} maxLength={40} required />
            <div className="tag-suggest">
              {cats.slice(0, 7).map((c) => (
                <button type="button" key={c} className={`chip xs ${f.category === c ? 'on' : ''}`} onClick={() => setF({ ...f, category: c })}>{c}</button>
              ))}
            </div>
          </div>
          <div className="field">
            <label htmlFor="ed-title">Title <small className="muted count">{f.title.length}/80</small></label>
            <input id="ed-title" value={f.title} onChange={set('title')} maxLength={80} placeholder="Shown on the card and in the viewer" />
          </div>
          <div className="field">
            <label htmlFor="ed-cap">Caption / details <small className="muted count">{f.caption.length}/240</small></label>
            <textarea id="ed-cap" rows={3} value={f.caption} onChange={set('caption')} maxLength={240} placeholder="Shape, length, technique…" />
          </div>
          <p className="muted am-edit-meta">
            {vid ? 'Video' : 'Photo'}{item.createdAt ? ` · added ${new Date(item.createdAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}` : ''}
          </p>
        </form>
      </div>
    </Modal>
  );
}

/* ------------------------------------------------------------------ */
/* Media library                                                        */
/* ------------------------------------------------------------------ */
export default function AdminGallery() {
  const { reload: reloadSite, site } = useApp();
  const photos = site.photos || [];
  const [filter, setFilter] = useState('all'); // all | photos | videos
  const [q, setQ] = useState('');
  const [viewIndex, setViewIndex] = useState(null);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const cats = useMemo(() => [...new Set([...BASE_TAGS, ...photos.map((p) => p.category).filter(Boolean)])], [photos]);
  const sorted = useMemo(() => [...photos].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)), [photos]);
  const nPhotos = sorted.filter((p) => !isVideo(p.url)).length;
  const nVideos = sorted.length - nPhotos;

  const list = sorted.filter((p) => {
    if (filter === 'photos' && isVideo(p.url)) return false;
    if (filter === 'videos' && !isVideo(p.url)) return false;
    const s = q.trim().toLowerCase();
    return !s || `${p.title || ''} ${p.caption || ''} ${p.category || ''}`.toLowerCase().includes(s);
  });

  // keep the editor in sync if the item changes underneath it
  useEffect(() => { if (editing && !photos.find((p) => p.id === editing.id)) setEditing(null); }, [photos, editing]);

  const confirmDelete = async () => {
    try {
      await api.del(`/api/admin/photos/${deleting.id}`);
      toast(isVideo(deleting.url) ? 'Video deleted' : 'Photo deleted');
      setDeleting(null); setEditing(null);
      await reloadSite();
    } catch (x) { toast(x.message, 'err'); }
  };

  return (
    <>
      <UploadPanel cats={cats} onDone={reloadSite} />

      <section className="am-library">
        <div className="am-lib-head">
          <div>
            <h3>Media library</h3>
            <p className="muted">{sorted.length} item{sorted.length !== 1 ? 's' : ''} · {nPhotos} photo{nPhotos !== 1 ? 's' : ''} · {nVideos} video{nVideos !== 1 ? 's' : ''}</p>
          </div>
          <div className="am-lib-tools">
            <div className="seg" role="tablist" aria-label="Filter media">
              {[['all', 'All', LayersIcon, sorted.length], ['photos', 'Photos', ImageIcon, nPhotos], ['videos', 'Videos', VideoIcon, nVideos]].map(([k, label, Ico, n]) => (
                <button key={k} type="button" role="tab" aria-selected={filter === k} className={filter === k ? 'on' : ''} onClick={() => setFilter(k)}>
                  <Ico size={15} /> <span>{label}</span> <em>{n}</em>
                </button>
              ))}
            </div>
            <div className="search-box">
              <SearchIcon size={16} />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search title, tag or caption" aria-label="Search media" />
            </div>
          </div>
        </div>

        {!sorted.length && (
          <div className="empty-state">
            <span className="empty-ico"><ImageIcon size={26} /></span>
            <strong>No photos or videos yet</strong>
            <p className="muted">Until you add some, the public gallery shows style placeholders.</p>
          </div>
        )}
        {!!sorted.length && !list.length && <p className="muted">Nothing matches that filter.</p>}

        {list.length > 0 && (
          <div className="masonry gallery-grid-fixed am-grid">
            {list.map((p, i) => (
              <div key={p.id} className="mitem am-item">
                <TiltCard className="hx-work-card" max={7}>
                  {isVideo(p.url) ? (
                    <VideoCard video={p} onClick={() => setViewIndex(i)} />
                  ) : (
                    <button type="button" className="tile photo-tile" onClick={() => setViewIndex(i)} aria-label={`Open ${p.title || p.category} photo`}>
                      <img src={p.url} alt={p.title || `${p.category} nails`} loading="lazy" />
                      <div className="tile-cap"><span>{p.title || p.category}</span></div>
                    </button>
                  )}
                </TiltCard>
                <div className="am-actions">
                  <button type="button" className="am-act" onClick={() => setEditing(p)} aria-label={`Edit ${p.title || p.category}`} title="Edit details">
                    <EditIcon size={16} />
                  </button>
                  <button type="button" className="am-act danger" onClick={() => setDeleting(p)} aria-label={`Delete ${p.title || p.category}`} title="Delete">
                    <TrashIcon size={16} />
                  </button>
                </div>
                {!isVideo(p.url) && p.category && <span className="am-tag">{p.category}</span>}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Same viewer as the public gallery: cinematic player for videos, lightbox for photos */}
      <MediaViewer list={list} index={viewIndex} onIndex={setViewIndex} onClose={() => setViewIndex(null)} />

      {editing && (
        <MediaEditor
          key={editing.id}
          item={photos.find((p) => p.id === editing.id) || editing}
          cats={cats}
          onClose={() => setEditing(null)}
          onSaved={reloadSite}
          onAskDelete={() => setDeleting(editing)}
        />
      )}

      <ConfirmDialog
        open={!!deleting}
        title={deleting && isVideo(deleting.url) ? 'Delete this video?' : 'Delete this photo?'}
        message="It will be removed from the media library and the public gallery. This can’t be undone."
        onConfirm={confirmDelete}
        onClose={() => setDeleting(null)}
      />
    </>
  );
}
