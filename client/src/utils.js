export const money = (n, c = '₦') => (n > 0 ? `${c}${Number(n).toLocaleString('en-NG')}` : 'Price on request');
export const dur = (m) => {
  const h = Math.floor(m / 60), r = m % 60;
  return [h && `${h} hr`, r && `${r} min`].filter(Boolean).join(' ');
};
export const fmtDate = (d) => new Date(d + 'T12:00:00').toLocaleDateString('en-NG', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
export const fmtTime = (t) => { const [h, m] = t.split(':').map(Number); return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h < 12 ? 'am' : 'pm'}`; };
export const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
export const dayKey = (d) => ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][d.getDay()];
export const DAYS = [['mon', 'Monday'], ['tue', 'Tuesday'], ['wed', 'Wednesday'], ['thu', 'Thursday'], ['fri', 'Friday'], ['sat', 'Saturday'], ['sun', 'Sunday']];
export const waLink = (s, msg) => {
  const n = (s.whatsapp || '').replace(/\D/g, '');
  return n ? `https://wa.me/${n}${msg ? `?text=${encodeURIComponent(msg)}` : ''}` : null;
};
export const waClient = (phone, msg) => {
  const n = String(phone).replace(/\D/g, '').replace(/^0/, '234');
  return `https://wa.me/${n}?text=${encodeURIComponent(msg)}`;
};
