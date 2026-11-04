import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

/*
  Storage:
  - When SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY are set, the whole salon database
    is one JSON document in the `app_state` table (run server/supabase.sql once).
  - Locally, with no Supabase variables, it is the file server/data/db.json.
*/
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
export const remote = Boolean(SUPABASE_URL && SUPABASE_KEY);
const supabase = remote
  ? createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false, autoRefreshToken: false } })
  : null;

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

async function readSaved() {
  if (remote) {
    const { data, error } = await supabase.from('app_state').select('data').eq('id', 'main').maybeSingle();
    if (error) throw new Error(error.message);
    return data?.data && Object.keys(data.data).length ? data.data : null;
  }
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return null; }
}

const data = {};
function apply(saved) {
  const base = defaults();
  const merged = { ...base, ...(saved || {}), settings: { ...base.settings, ...(saved?.settings || {}) } };
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
  merged.users = (merged.users || []).map((u) => ({
    avatar: '', provider: u.provider || 'password', notifyEmail: u.notifyEmail !== false, ...u,
  }));
  merged.photos = (merged.photos || []).map((p) => ({
    title: p.title || '', caption: p.caption || '', publicId: p.publicId || '', ...p,
  }));
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
  const snapshot = JSON.parse(JSON.stringify(data));
  inFlight++;
  pending = pending
    .then(async () => {
      const { error } = await supabase.from('app_state').upsert({
        id: 'main',
        data: snapshot,
        updated_at: new Date().toISOString(),
      });
      if (error) throw new Error(error.message);
    })
    .catch((e) => console.error('Could not save to Supabase:', e.message))
    .finally(() => { inFlight--; });
}

export const settled = () => pending;

export async function refresh() {
  if (!remote || inFlight) return;
  apply(await readSaved());
}

apply(await readSaved());
if (!remote) {
  if (process.env.VERCEL) {
    console.error('Supabase is not configured. Login, bookings and the dashboard will not persist on Vercel. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
  }
  flush();
  for (const sig of ['SIGINT', 'SIGTERM']) process.on(sig, () => { flush(); process.exit(0); });
} else {
  console.log('Database: Supabase connected');
}

export const db = data;
