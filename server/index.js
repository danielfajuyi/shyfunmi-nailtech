import 'dotenv/config';
import express from 'express';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import multer from 'multer';
import bcrypt from 'bcryptjs';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { db, save, uid } from './db.js';
import { attach, need, adminOnly, setCookie, clearCookie, pub } from './auth.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 5000;
const uploads = path.join(__dirname, 'uploads');
fs.mkdirSync(uploads, { recursive: true });

/* ---------- helpers ---------- */
const STATUSES = ['pending', 'confirmed', 'completed', 'cancelled'];
const digits = (s) => String(s || '').replace(/\D/g, '');
const clean = (s, n = 200) => String(s ?? '').trim().slice(0, n);
const bad = (res, msg, code = 400) => res.status(code).json({ error: msg });
const isDate = (d) => /^\d{4}-\d{2}-\d{2}$/.test(d);
const isTime = (t) => /^\d\d:\d\d$/.test(t);
const toMin = (t) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
const fmt = (m) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
const dayKey = (d) => ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][new Date(d + 'T12:00:00').getDay()];
const finalPrice = (b) => Math.round(b.price * (1 - (b.discountPct || 0) / 100));
const withPrice = (b) => ({ ...b, finalPrice: finalPrice(b) });

function nowIn(tz) {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-CA', {
    timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(new Date()).map((x) => [x.type, x.value]));
  return { date: `${p.year}-${p.month}-${p.day}`, min: Number(p.hour) * 60 + Number(p.minute) };
}

const visitsOf = (userId, phone) => db.bookings.filter((b) => b.status === 'completed' &&
  ((userId && b.userId === userId) || (phone && digits(b.phone) === digits(phone)))).length;

function slotsFor(date, svc) {
  const s = db.settings;
  if (!isDate(date)) return [];
  const now = nowIn(s.timezone);
  const h = s.hours[dayKey(date)];
  if (date < now.date || !h || h.closed || s.blockedDates.includes(date)) return [];
  const dur = svc?.duration || 60;
  const busy = db.bookings.filter((b) => b.date === date && b.status !== 'cancelled')
    .map((b) => [toMin(b.time), toMin(b.time) + b.duration]);
  const out = [];
  for (let t = toMin(h.open); t + dur <= toMin(h.close); t += s.slotStep) {
    const past = date === now.date && t <= now.min;
    out.push({ time: fmt(t), free: !past && !busy.some(([a, z]) => t < z && t + dur > a) });
  }
  return out;
}

function createBooking(body, user, force = false) {
  const s = db.settings;
  const svc = db.services.find((x) => x.id === body.serviceId && (x.active || force));
  if (!svc) return { error: 'Choose a service.' };
  const name = clean(body.name || user?.name, 80);
  const phone = clean(body.phone || user?.phone, 25);
  if (name.length < 2) return { error: 'Enter your name.' };
  if (digits(phone).length < 7) return { error: 'Enter a valid phone number.' };
  const date = clean(body.date, 10), time = clean(body.time, 5);
  if (!isDate(date) || !isTime(time)) return { error: 'Choose a date and time.' };
  if (!force) {
    const slot = slotsFor(date, svc).find((x) => x.time === time);
    if (!slot || !slot.free) return { error: 'That time is no longer available. Pick another.' };
  }
  const loyalty = (visitsOf(user?.id, phone) + 1) % s.loyaltyEvery === 0;
  const b = {
    id: uid(), userId: user?.id || null, name, phone, email: clean(body.email || user?.email, 120),
    serviceId: svc.id, serviceName: svc.name, price: svc.price, duration: svc.duration, date, time,
    shape: clean(body.shape, 30) || 'Not sure yet', color: clean(body.color, 60), notes: clean(body.notes, 500),
    status: force ? 'confirmed' : 'pending', loyalty, discountPct: loyalty ? s.loyaltyDiscount : 0,
    adminNote: '', createdAt: new Date().toISOString(),
  };
  db.bookings.push(b);
  save();
  return { booking: b };
}

const pubSettings = () => {
  const { businessName, tagline, address, phone, whatsapp, instagram, tiktok, currency, hours, blockedDates, loyaltyEvery, loyaltyDiscount } = db.settings;
  return { businessName, tagline, address, phone, whatsapp, instagram, tiktok, currency, hours, blockedDates, loyaltyEvery, loyaltyDiscount };
};

/* ---------- seed admin ---------- */
if (!db.users.some((u) => u.role === 'admin')) {
  const email = (process.env.ADMIN_EMAIL || 'admin@shyfunminails.com').toLowerCase();
  const password = process.env.ADMIN_PASSWORD || 'ChangeMe123!';
  db.users.push({ id: uid(), name: 'Shyfunmi', email, phone: '', role: 'admin', hash: bcrypt.hashSync(password, 10), createdAt: new Date().toISOString() });
  save();
  console.log(`Admin account created: ${email} / ${password}  (change this password after signing in)`);
}

/* ---------- app ---------- */
const app = express();
app.set('trust proxy', 1);
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: { directives: {
    defaultSrc: ["'self'"], scriptSrc: ["'self'"],
    styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
    fontSrc: ['https://fonts.gstatic.com'], imgSrc: ["'self'", 'data:', 'blob:'], connectSrc: ["'self'"],
    upgradeInsecureRequests: null,
  } },
}));
app.use(express.json({ limit: '100kb' }));
app.use(cookieParser());
app.use(attach);
app.use('/uploads', express.static(uploads, { maxAge: '7d' }));

const authLimit = rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: true, legacyHeaders: false, message: { error: 'Too many attempts. Try again later.' } });
const formLimit = rateLimit({ windowMs: 60 * 60 * 1000, limit: 25, standardHeaders: true, legacyHeaders: false, message: { error: 'Too many requests. Try again later.' } });

/* ---------- public ---------- */
app.get('/api/public', (_req, res) => res.json({
  settings: pubSettings(),
  services: db.services.filter((s) => s.active).sort((a, b) => a.order - b.order),
  photos: db.photos,
  reviews: db.reviews.filter((r) => r.approved).slice(-12).reverse(),
}));

app.get('/api/availability', (req, res) => {
  const svc = db.services.find((s) => s.id === req.query.serviceId);
  res.json({ slots: slotsFor(String(req.query.date || ''), svc) });
});

app.post('/api/bookings', formLimit, (req, res) => {
  const r = createBooking(req.body, req.user);
  if (r.error) return bad(res, r.error);
  res.status(201).json(withPrice(r.booking));
});

app.post('/api/enroll', formLimit, (req, res) => {
  const name = clean(req.body.name, 80), phone = clean(req.body.phone, 25);
  if (name.length < 2) return bad(res, 'Enter your name.');
  if (digits(phone).length < 7) return bad(res, 'Enter a valid phone number.');
  db.enrollments.push({ id: uid(), name, phone, email: clean(req.body.email, 120), level: clean(req.body.level, 40) || 'Beginner', message: clean(req.body.message, 600), status: 'new', createdAt: new Date().toISOString() });
  save();
  res.status(201).json({ ok: true });
});

/* ---------- auth ---------- */
app.post('/api/auth/register', authLimit, (req, res) => {
  const name = clean(req.body.name, 80), email = clean(req.body.email, 120).toLowerCase(), phone = clean(req.body.phone, 25);
  if (name.length < 2) return bad(res, 'Enter your name.');
  if (!/^\S+@\S+\.\S+$/.test(email)) return bad(res, 'Enter a valid email.');
  if (digits(phone).length < 7) return bad(res, 'Enter a valid phone number.');
  if (String(req.body.password || '').length < 8) return bad(res, 'Password must be at least 8 characters.');
  if (db.users.some((u) => u.email === email)) return bad(res, 'An account with this email already exists.', 409);
  const u = { id: uid(), name, email, phone, role: 'client', hash: bcrypt.hashSync(req.body.password, 10), createdAt: new Date().toISOString() };
  db.users.push(u);
  db.bookings.forEach((b) => { if (!b.userId && digits(b.phone) === digits(phone)) b.userId = u.id; }); // claim earlier guest bookings
  save();
  setCookie(res, u);
  res.status(201).json({ user: pub(u) });
});

app.post('/api/auth/login', authLimit, (req, res) => {
  const u = db.users.find((x) => x.email === clean(req.body.email, 120).toLowerCase());
  if (!u || !bcrypt.compareSync(String(req.body.password || ''), u.hash)) return bad(res, 'Email or password is incorrect.', 401);
  setCookie(res, u);
  res.json({ user: pub(u) });
});
app.post('/api/auth/logout', (_req, res) => { clearCookie(res); res.json({ ok: true }); });
app.get('/api/auth/me', (req, res) => res.json({ user: pub(req.user) || null }));

/* ---------- client ---------- */
app.get('/api/me/bookings', need, (req, res) => {
  const mine = db.bookings.filter((b) => b.userId === req.user.id)
    .sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time))
    .map((b) => ({ ...withPrice(b), reviewed: db.reviews.some((r) => r.bookingId === b.id) }));
  const visits = visitsOf(req.user.id, req.user.phone), every = db.settings.loyaltyEvery;
  res.json({ bookings: mine, loyalty: { visits, every, progress: visits % every, nextIsReward: (visits + 1) % every === 0, discount: db.settings.loyaltyDiscount } });
});

app.post('/api/me/bookings/:id/cancel', need, (req, res) => {
  const b = db.bookings.find((x) => x.id === req.params.id && x.userId === req.user.id);
  if (!b) return bad(res, 'Booking not found.', 404);
  if (!['pending', 'confirmed'].includes(b.status)) return bad(res, 'This booking can’t be cancelled.');
  b.status = 'cancelled'; save();
  res.json(withPrice(b));
});

app.patch('/api/me', need, (req, res) => {
  const u = req.user, b = req.body;
  if ('name' in b) { if (clean(b.name, 80).length < 2) return bad(res, 'Enter your name.'); u.name = clean(b.name, 80); }
  if ('phone' in b) { if (digits(b.phone).length < 7) return bad(res, 'Enter a valid phone number.'); u.phone = clean(b.phone, 25); }
  if (b.newPassword) {
    if (!bcrypt.compareSync(String(b.currentPassword || ''), u.hash)) return bad(res, 'Current password is incorrect.');
    if (String(b.newPassword).length < 8) return bad(res, 'New password must be at least 8 characters.');
    u.hash = bcrypt.hashSync(b.newPassword, 10);
  }
  save();
  res.json({ user: pub(u) });
});

app.post('/api/me/reviews', need, (req, res) => {
  const b = db.bookings.find((x) => x.id === req.body.bookingId && x.userId === req.user.id);
  if (!b || b.status !== 'completed') return bad(res, 'You can review completed visits only.');
  if (db.reviews.some((r) => r.bookingId === b.id)) return bad(res, 'You already reviewed this visit.');
  const rating = Math.round(Number(req.body.rating));
  if (!(rating >= 1 && rating <= 5)) return bad(res, 'Choose a rating from 1 to 5.');
  const parts = req.user.name.split(' ');
  db.reviews.push({ id: uid(), bookingId: b.id, author: parts[0] + (parts[1] ? ` ${parts[1][0]}.` : ''), rating, text: clean(req.body.text, 400), service: b.serviceName, approved: false, createdAt: new Date().toISOString() });
  save();
  res.status(201).json({ ok: true });
});

/* ---------- admin ---------- */
const admin = express.Router();
admin.use(need, adminOnly);
app.use('/api/admin', admin);

admin.get('/stats', (_req, res) => {
  const now = nowIn(db.settings.timezone), bs = db.bookings, done = bs.filter((b) => b.status === 'completed');
  const months = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    months.push({ month: d.toLocaleString('en', { month: 'short' }), total: done.filter((b) => b.date.startsWith(key)).reduce((n, b) => n + finalPrice(b), 0) });
  }
  const counts = {};
  bs.filter((b) => b.status !== 'cancelled').forEach((b) => { counts[b.serviceName] = (counts[b.serviceName] || 0) + 1; });
  res.json({
    pending: bs.filter((b) => b.status === 'pending').length,
    upcoming: bs.filter((b) => ['pending', 'confirmed'].includes(b.status) && b.date >= now.date).length,
    completed: done.length, clients: db.users.filter((u) => u.role === 'client').length,
    revenue: done.reduce((n, b) => n + finalPrice(b), 0), months,
    top: Object.entries(counts).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 5),
    newEnrollments: db.enrollments.filter((e) => e.status === 'new').length,
    pendingReviews: db.reviews.filter((r) => !r.approved).length,
    next: bs.filter((b) => ['pending', 'confirmed'].includes(b.status) && b.date >= now.date)
      .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time)).slice(0, 5).map(withPrice),
  });
});

admin.get('/bookings', (req, res) => {
  const q = clean(req.query.q, 60).toLowerCase(), st = req.query.status;
  res.json(db.bookings
    .filter((b) => (!st || st === 'all' || b.status === st) && (!q || `${b.name} ${b.phone} ${b.serviceName}`.toLowerCase().includes(q)))
    .sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time)).map(withPrice));
});
admin.post('/bookings', (req, res) => {
  const r = createBooking(req.body, null, true);
  if (r.error) return bad(res, r.error);
  res.status(201).json(withPrice(r.booking));
});
admin.patch('/bookings/:id', (req, res) => {
  const b = db.bookings.find((x) => x.id === req.params.id), p = req.body;
  if (!b) return bad(res, 'Booking not found.', 404);
  if (p.status) { if (!STATUSES.includes(p.status)) return bad(res, 'Invalid status.'); b.status = p.status; }
  if ('discountPct' in p) b.discountPct = Math.max(0, Math.min(100, Number(p.discountPct) || 0));
  if ('price' in p) b.price = Math.max(0, Number(p.price) || 0);
  if ('adminNote' in p) b.adminNote = clean(p.adminNote, 300);
  if (p.date) { if (!isDate(p.date)) return bad(res, 'Invalid date.'); b.date = p.date; }
  if (p.time) { if (!isTime(p.time)) return bad(res, 'Invalid time.'); b.time = p.time; }
  save();
  res.json(withPrice(b));
});
admin.delete('/bookings/:id', (req, res) => { db.bookings = db.bookings.filter((b) => b.id !== req.params.id); save(); res.json({ ok: true }); });

const svcFields = (b) => ({
  name: clean(b.name, 80), description: clean(b.description, 240),
  duration: Math.max(15, Math.min(480, parseInt(b.duration) || 60)), price: Math.max(0, Number(b.price) || 0), active: b.active !== false,
});
admin.get('/services', (_req, res) => res.json(db.services.slice().sort((a, b) => a.order - b.order)));
admin.post('/services', (req, res) => {
  const f = svcFields(req.body);
  if (f.name.length < 2) return bad(res, 'Enter a service name.');
  const s = { id: uid(), ...f, order: db.services.reduce((m, x) => Math.max(m, x.order), -1) + 1 };
  db.services.push(s); save(); res.status(201).json(s);
});
admin.patch('/services/:id', (req, res) => {
  const s = db.services.find((x) => x.id === req.params.id);
  if (!s) return bad(res, 'Service not found.', 404);
  const f = svcFields({ ...s, ...req.body });
  if (f.name.length < 2) return bad(res, 'Enter a service name.');
  Object.assign(s, f); save(); res.json(s);
});
admin.delete('/services/:id', (req, res) => { db.services = db.services.filter((s) => s.id !== req.params.id); save(); res.json({ ok: true }); });

const upload = multer({
  storage: multer.diskStorage({
    destination: uploads,
    filename: (_r, f, cb) => cb(null, uid() + path.extname(f.originalname).toLowerCase().replace(/[^.a-z0-9]/g, '')),
  }),
  limits: { fileSize: 10 * 1024 * 1024, files: 12 },
  fileFilter: (_r, f, cb) => cb(null, /^image\/(jpeg|png|webp|gif)$/.test(f.mimetype)),
});
admin.post('/photos', upload.array('files', 12), (req, res) => {
  if (!req.files?.length) return bad(res, 'Choose at least one image (JPG, PNG, WebP or GIF).');
  const category = clean(req.body.category, 40) || 'Latest';
  const added = req.files.map((f) => ({ id: uid(), url: `/uploads/${f.filename}`, category, createdAt: new Date().toISOString() }));
  db.photos.unshift(...added); save();
  res.status(201).json(added);
});
admin.patch('/photos/:id', (req, res) => {
  const p = db.photos.find((x) => x.id === req.params.id);
  if (!p) return bad(res, 'Photo not found.', 404);
  p.category = clean(req.body.category, 40) || p.category; save(); res.json(p);
});
admin.delete('/photos/:id', (req, res) => {
  const p = db.photos.find((x) => x.id === req.params.id);
  if (p) fs.unlink(path.join(uploads, path.basename(p.url)), () => {});
  db.photos = db.photos.filter((x) => x.id !== req.params.id); save(); res.json({ ok: true });
});

admin.get('/clients', (_req, res) => res.json(db.users.filter((u) => u.role === 'client').map((u) => ({
  ...pub(u), createdAt: u.createdAt,
  bookings: db.bookings.filter((b) => b.userId === u.id).length, visits: visitsOf(u.id, u.phone),
}))));

admin.get('/enrollments', (_req, res) => res.json(db.enrollments.slice().reverse()));
admin.patch('/enrollments/:id', (req, res) => {
  const e = db.enrollments.find((x) => x.id === req.params.id);
  if (!e || !['new', 'contacted', 'enrolled', 'declined'].includes(req.body.status)) return bad(res, 'Invalid request.');
  e.status = req.body.status; save(); res.json(e);
});
admin.delete('/enrollments/:id', (req, res) => { db.enrollments = db.enrollments.filter((e) => e.id !== req.params.id); save(); res.json({ ok: true }); });

admin.get('/reviews', (_req, res) => res.json(db.reviews.slice().reverse()));
admin.patch('/reviews/:id', (req, res) => {
  const r = db.reviews.find((x) => x.id === req.params.id);
  if (!r) return bad(res, 'Review not found.', 404);
  r.approved = !!req.body.approved; save(); res.json(r);
});
admin.delete('/reviews/:id', (req, res) => { db.reviews = db.reviews.filter((r) => r.id !== req.params.id); save(); res.json({ ok: true }); });

admin.get('/settings', (_req, res) => res.json(db.settings));
admin.put('/settings', (req, res) => {
  const b = req.body, s = db.settings;
  for (const k of ['businessName', 'tagline', 'address', 'phone', 'instagram', 'tiktok', 'currency']) if (k in b) s[k] = clean(b[k], 120);
  if ('whatsapp' in b) s.whatsapp = digits(b.whatsapp);
  if ([30, 60, 90, 120].includes(Number(b.slotStep))) s.slotStep = Number(b.slotStep);
  if (Array.isArray(b.blockedDates)) s.blockedDates = [...new Set(b.blockedDates.filter(isDate))].sort();
  if ('loyaltyEvery' in b) s.loyaltyEvery = Math.max(2, Math.min(20, parseInt(b.loyaltyEvery) || 5));
  if ('loyaltyDiscount' in b) s.loyaltyDiscount = Math.max(0, Math.min(100, parseInt(b.loyaltyDiscount) || 0));
  if (b.hours) for (const k of Object.keys(s.hours)) {
    const h = b.hours[k];
    if (h && isTime(h.open) && isTime(h.close) && toMin(h.open) < toMin(h.close)) s.hours[k] = { open: h.open, close: h.close, closed: !!h.closed };
  }
  save(); res.json(s);
});

/* ---------- static site (after `npm run build`) ---------- */
const dist = path.join(__dirname, '../client/dist');
app.use('/api', (_req, res) => bad(res, 'Not found.', 404));
if (fs.existsSync(dist)) {
  app.use(express.static(dist));
  app.get('*', (_req, res) => res.sendFile(path.join(dist, 'index.html')));
}
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => bad(res, err.message || 'Something went wrong.'));

app.listen(PORT, () => console.log(`Shyfunmi Nails running on http://localhost:${PORT}`));
