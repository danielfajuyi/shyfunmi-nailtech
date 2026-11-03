import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), 'data');
fs.mkdirSync(dir, { recursive: true });
const file = path.join(dir, 'db.json');

export function uid() { return crypto.randomUUID(); }
const day = (closed = false) => ({ open: '09:00', close: '18:00', closed });

const defaults = () => ({
  users: [], services: [], bookings: [], photos: [], reviews: [], enrollments: [],
  settings: {
    businessName: 'Shyfunmi Nails', tagline: 'Your confidence starts here',
    address: 'Peter Odili Road, Port Harcourt', phone: '', whatsapp: '',
    instagram: 'shyfunmi_nails', tiktok: 'shyfunmi_nails', currency: '₦',
    timezone: 'Africa/Lagos', slotStep: 60, blockedDates: [],
    loyaltyEvery: 5, loyaltyDiscount: 30,
    hours: { mon: day(), tue: day(), wed: day(), thu: day(), fri: day(), sat: day(), sun: day(true) },
  },
});

let data = defaults();
try {
  const saved = JSON.parse(fs.readFileSync(file, 'utf8'));
  data = { ...data, ...saved, settings: { ...data.settings, ...saved.settings } };
} catch { /* first run */ }

// Starter services. Prices are 0 ("Price on request") until the owner sets them in the admin dashboard.
if (!data.services.length) {
  data.services = [
    ['Gel manicure', 'Long-lasting colour with careful prep and shaping.', 90],
    ['Acrylic and extensions', 'Length and strength in the shape you choose.', 150],
    ['Cateye and French tips', 'Magnetic shimmer or a clean, classic tip.', 120],
    ['Custom press-ons', 'Made to fit your nails. Ready to wear and reuse.', 60],
    ['Freestyle nail art', 'Marble, charms and one-of-a-kind designs.', 180],
    ['Toe nails and pedicure', 'Clean, neat and polished from head to toe.', 60],
  ].map(([name, description, duration], order) => ({ id: uid(), name, description, duration, price: 0, active: true, order }));
}

let timer;
export function flush() {
  clearTimeout(timer);
  const tmp = file + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
  fs.renameSync(tmp, file);
}
export const save = () => { clearTimeout(timer); timer = setTimeout(flush, 100); };
for (const sig of ['SIGINT', 'SIGTERM']) process.on(sig, () => { flush(); process.exit(0); });
flush();

export const db = data;
