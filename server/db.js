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
    address: 'Peter Odili Road, Port Harcourt', phone: '+2349159814635', whatsapp: '2349159814635',
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
      ['Short acrylic set', 'A stylish acrylic set with your choice of minimal nail art.', 180, 20000],
      ['Medium acrylic set', 'Flawless medium-length acrylic extensions shaped and sculpted to perfection.', 210, 25000],
      ['Long acrylic set', 'Dramatic long acrylic extensions for a sleek, statement look.', 210, 30000],
      ['Short Gel_x set', 'Soft gel full-cover extensions for lightweight, natural-feeling nails.', 120, 10000],
      ['Medium Gel_x set', 'Medium-length soft gel tips offering flexibility, beauty, and strength.', 120, 15000],
      ['Long Gel_x set', 'Glamorous elongated soft gel extensions tailored to your favorite shape.', 150, 18000],
      ['Soak off', 'Gentle removal of old nails.', 60, 5000],
      ['Biab (on short natural nails)', 'Builder in a bottle, on natural nails for strengthening nails.', 120, 18000],
      ['Biab (medium)', 'Strengthening builder gel overlay for medium-length natural nails.', 150, 25000],
      ['Biab (long)', 'Reinforcing builder gel overlay designed to protect and support long nails.', 150, 40000],
      ['Acrylic overlay', 'Strengthen your natural nails with a protective acrylic layer.', 120, 20000],
      ['Xl (Acrylic)', 'Extra-long acrylics for a striking and glamorous finish.', 210, 45000],
      ['Gel on natural nails', 'Classic gel polish on your natural nails for a glossy finish.', 60, 5000],
      ['Xl (Gel)', 'Extra-long gel nails for a dramatic, eye-catching style.', 180, 25000],
      ['Toe gel on natural nails', 'Smooth gel polish for long-lasting shine on natural toes.', 30, 4000],
      ['Toe nails with extensions', 'Length and beauty added to your toenails with extensions.', 60, 7000],
      ['French tips', 'The French tip included alone.', 30, 3000],
      ['Stones and charms', 'Dazzling crystal stones and luxury charms customized for your set.', 30, 3000],
      ['Chrome effects', 'Mirror-finish metallic glazed chrome powder over your favorite gel shade.', 30, 2000],
      ['3D effect', 'Sculpted 3D floral and textural gel art accents that pop.', 30, 3000],
      ['Marble effect', 'Intricate swirling marble patterns blended with luxury metallic accents.', 30, 3000],
      ['Red bottoms', 'Signature Louboutin-inspired red under-nail polish finish.', 30, 3000],
      ['Blooming effect', 'Delicate watercolor and blooming gel floral smoke gradients.', 30, 2000],
      ['Airbrush design', 'Flawless ombré and aura airbrush nail gradients with crisp stencils.', 90, 3000],
    ].map(([name, description, duration, price], order) => ({ id: uid(), name, description, duration, price, active: true, order }));
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
