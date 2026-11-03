import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

/*
  Storage:
  - On Vercel (or anywhere KV_REST_API_URL / KV_REST_API_TOKEN are set) the whole database is one JSON
    document kept in Upstash Redis.
  - Locally, with no Redis variables, it is the file server/data/db.json as before.
*/
const REDIS_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
export const remote = Boolean(REDIS_URL && REDIS_TOKEN);
const KEY = 'shyfunmi:db';

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), 'data');
const file = path.join(dir, 'db.json');
if (!remote) fs.mkdirSync(dir, { recursive: true });

export function uid() { return crypto.randomUUID(); }
const day = (closed = false) => ({ open: '09:00', close: '18:00', closed });

const defaults = () => ({
  users: [], services: [], bookings: [], photos: [], reviews: [], enrollments: [], messages: [],
  settings: {
    businessName: 'Shyfunmi Nails', tagline: 'Your confidence starts here',
    address: 'Peter Odili Road, Port Harcourt', phone: '', whatsapp: '',
    instagram: 'shyfunmi_nails', tiktok: 'shyfunmi_nails', currency: '₦',
    timezone: 'Africa/Lagos', slotStep: 60, blockedDates: [],
    loyaltyEvery: 5, loyaltyDiscount: 30,
    hours: { mon: day(), tue: day(), wed: day(), thu: day(), fri: day(), sat: day(), sun: day(true) },
  },
});

async function redis(...cmd) {
  const r = await fetch(REDIS_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${REDIS_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(cmd),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || j.error) throw new Error(j.error || `Redis error ${r.status}`);
  return j.result;
}

async function readSaved() {
  if (remote) { const raw = await redis('GET', KEY); return raw ? JSON.parse(raw) : null; }
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return null; }
}

// The exported `db` object is never replaced, only refilled, so every import keeps seeing current data.
const data = {};
function apply(saved) {
  const base = defaults();
  const merged = { ...base, ...(saved || {}), settings: { ...base.settings, ...(saved?.settings || {}) } };
  // Starter services. Prices are 0 ("Price on request") until the owner sets them in the admin dashboard.
  if (!merged.services.length) {
    merged.services = [
      ['Gel manicure', 'Long-lasting colour with careful prep and shaping.', 90],
      ['Acrylic and extensions', 'Length and strength in the shape you choose.', 150],
      ['Cateye and French tips', 'Magnetic shimmer or a clean, classic tip.', 120],
      ['Custom press-ons', 'Made to fit your nails. Ready to wear and reuse.', 60],
      ['Freestyle nail art', 'Marble, charms and one-of-a-kind designs.', 180],
      ['Toe nails and pedicure', 'Clean, neat and polished from head to toe.', 60],
    ].map(([name, description, duration], order) => ({ id: uid(), name, description, duration, price: 0, active: true, order }));
  }
  for (const k of Object.keys(data)) delete data[k];
  Object.assign(data, merged);
}

let timer;
let pending = Promise.resolve();
let inFlight = 0;

export function flush() {
  clearTimeout(timer);
  const tmp = file + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
  fs.renameSync(tmp, file);
}

export function save() {
  if (!remote) { clearTimeout(timer); timer = setTimeout(flush, 100); return; }
  const body = JSON.stringify(data); // snapshot now
  inFlight++;
  pending = pending
    .then(() => redis('SET', KEY, body))
    .catch((e) => console.error('Could not save to Redis:', e.message))
    .finally(() => { inFlight--; });
}

/** Resolves once every save() so far has reached the database. */
export const settled = () => pending;

/** On serverless every request may land on a different instance, so reload the data first. */
export async function refresh() {
  if (!remote || inFlight) return;
  apply(await readSaved());
}

// If the first read fails this throws on purpose: better a 500 than overwriting real data with defaults.
apply(await readSaved());
if (!remote) {
  flush();
  for (const sig of ['SIGINT', 'SIGTERM']) process.on(sig, () => { flush(); process.exit(0); });
}

export const db = data;
