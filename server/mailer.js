import nodemailer from 'nodemailer';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'shyfunmiinails@gmail.com';
const SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com';
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587');
const SMTP_USER = process.env.SMTP_USER || '';
const SMTP_PASS = process.env.SMTP_PASS || '';

let transport = null;

function getTransport() {
  if (!SMTP_USER || !SMTP_PASS) return null;
  if (!transport) {
    transport = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    });
  }
  return transport;
}

async function send(opts) {
  const t = getTransport();
  if (!t) {
    console.log('[mailer] SMTP not configured — email skipped:', opts.subject);
    return;
  }
  try {
    await t.sendMail({
      from: `"Shyfunmi Nails" <${SMTP_USER}>`,
      ...opts,
    });
  } catch (e) {
    console.error('[mailer] Failed to send email:', e.message);
  }
}

function fmtDate(d) {
  return new Date(d + 'T12:00:00').toLocaleDateString('en-NG', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}
function fmtTime(t) {
  const [h, m] = t.split(':').map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h < 12 ? 'am' : 'pm'}`;
}
function money(n, c = '₦') {
  return n > 0 ? `${c}${Number(n).toLocaleString('en-NG')}` : 'Confirmed on arrival';
}

const base = (content) => `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
  body { margin: 0; padding: 0; background: #F7F5F8; font-family: system-ui, -apple-system, sans-serif; color: #17131B; }
  .wrap { max-width: 540px; margin: 40px auto; background: #fff; border-radius: 20px; overflow: hidden; border: 1px solid #E7E1EA; }
  .head { background: #2A1626; color: #F7F5F8; padding: 32px 36px 24px; }
  .head h1 { margin: 0 0 4px; font-size: 22px; font-weight: 300; letter-spacing: -0.03em; }
  .head p { margin: 0; opacity: 0.7; font-size: 13px; }
  .body { padding: 28px 36px; }
  .dl { margin: 20px 0; border-top: 1px solid #E7E1EA; }
  .dl div { display: flex; justify-content: space-between; padding: 11px 0; border-bottom: 1px solid #E7E1EA; font-size: 14px; }
  .dl dt { color: #6C6473; }
  .dl dd { margin: 0; font-weight: 600; text-align: right; }
  .btn { display: inline-block; margin-top: 20px; padding: 14px 28px; background: #17131B; color: #F7F5F8; border-radius: 999px; text-decoration: none; font-size: 15px; font-weight: 500; }
  .pill { display: inline-block; padding: 3px 12px; border-radius: 999px; font-size: 12px; font-weight: 600; text-transform: capitalize; }
  .pill.pending { background: #FEF3C7; color: #92400E; }
  .pill.confirmed { background: #D1FAE5; color: #065F46; }
  .pill.completed { background: #EDE9FE; color: #5B21B6; }
  .pill.cancelled { background: #FEE2E2; color: #991B1B; }
  .foot { padding: 18px 36px; background: #F7F5F8; border-top: 1px solid #E7E1EA; font-size: 12px; color: #6C6473; }
  .foot a { color: #8E3B6A; }
</style>
</head>
<body>
<div class="wrap">
  ${content}
  <div class="foot">
    <p>Shyfunmi Nails &nbsp;·&nbsp; Peter Odili Road, Port Harcourt &nbsp;·&nbsp; <a href="https://shyfunminails.com">shyfunminails.com</a></p>
    <p>Questions? Reply to this email or message us on <a href="https://wa.me/">WhatsApp</a>.</p>
  </div>
</div>
</body>
</html>`;

/* ---------- Booking confirmation (to client) ---------- */
export async function sendBookingConfirmation(booking, settings) {
  if (!booking.email) return;
  const { currency = '₦', businessName = 'Shyfunmi Nails', whatsapp } = settings;
  const waLink = whatsapp ? `https://wa.me/${whatsapp}` : null;

  await send({
    to: booking.email,
    subject: `Booking received – ${booking.serviceName} on ${fmtDate(booking.date)}`,
    html: base(`
      <div class="head">
        <h1>${businessName}</h1>
        <p>Booking confirmation</p>
      </div>
      <div class="body">
        <p>Hi <strong>${booking.name.split(' ')[0]}</strong>,</p>
        <p>We've received your booking request. Shyfunmi will confirm your appointment shortly — you'll get another email when it's confirmed.</p>
        <dl class="dl">
          <div><dt>Service</dt><dd>${booking.serviceName}</dd></div>
          <div><dt>Date</dt><dd>${fmtDate(booking.date)}</dd></div>
          <div><dt>Time</dt><dd>${fmtTime(booking.time)}</dd></div>
          <div><dt>Duration</dt><dd>${Math.floor(booking.duration / 60) ? Math.floor(booking.duration / 60) + ' hr ' : ''}${booking.duration % 60 ? booking.duration % 60 + ' min' : ''}</dd></div>
          <div><dt>Price</dt><dd>${money(booking.price, currency)}${booking.discountPct ? ` (${booking.discountPct}% loyalty discount)` : ''}</dd></div>
          <div><dt>Nail shape</dt><dd>${booking.shape}</dd></div>
          ${booking.color ? `<div><dt>Colour idea</dt><dd>${booking.color}</dd></div>` : ''}
          ${booking.notes ? `<div><dt>Notes</dt><dd>${booking.notes}</dd></div>` : ''}
          <div><dt>Status</dt><dd><span class="pill pending">Pending confirmation</span></dd></div>
        </dl>
        ${waLink ? `<p>You can also message us on WhatsApp if you have questions.</p><a class="btn" href="${waLink}">Message on WhatsApp</a>` : ''}
      </div>
    `),
  });
}

/* ---------- Status update (to client) ---------- */
export async function sendStatusUpdate(booking, settings) {
  if (!booking.email) return;
  const { currency = '₦', businessName = 'Shyfunmi Nails', whatsapp } = settings;
  const waLink = whatsapp ? `https://wa.me/${whatsapp}` : null;
  const labels = { confirmed: 'Your appointment is confirmed!', completed: 'Thanks for visiting us!', cancelled: 'Your booking has been cancelled.' };
  const label = labels[booking.status] || `Booking ${booking.status}`;

  await send({
    to: booking.email,
    subject: `${label} – ${booking.serviceName} at ${businessName}`,
    html: base(`
      <div class="head">
        <h1>${businessName}</h1>
        <p>${label}</p>
      </div>
      <div class="body">
        <p>Hi <strong>${booking.name.split(' ')[0]}</strong>,</p>
        ${booking.status === 'confirmed' ? '<p>Your appointment is confirmed. We\'ll see you soon — please arrive a few minutes early.</p>' : ''}
        ${booking.status === 'completed' ? '<p>Thank you for visiting Shyfunmi Nails! We hope you loved your nails. Please leave a review on your account page — it means a lot.</p>' : ''}
        ${booking.status === 'cancelled' ? '<p>Your appointment has been cancelled. If you\'d like to rebook, you can do so on our website anytime.</p>' : ''}
        <dl class="dl">
          <div><dt>Service</dt><dd>${booking.serviceName}</dd></div>
          <div><dt>Date</dt><dd>${fmtDate(booking.date)}</dd></div>
          <div><dt>Time</dt><dd>${fmtTime(booking.time)}</dd></div>
          <div><dt>Status</dt><dd><span class="pill ${booking.status}">${booking.status}</span></dd></div>
        </dl>
        ${booking.status !== 'cancelled' && waLink ? `<a class="btn" href="${waLink}">Message on WhatsApp</a>` : ''}
        ${booking.status === 'cancelled' ? `<a class="btn" href="https://shyfunminails.com/book">Book another appointment</a>` : ''}
      </div>
    `),
  });
}

/* ---------- New booking alert (to admin) ---------- */
export async function sendAdminNewBooking(booking, settings) {
  const { currency = '₦' } = settings;
  const waClient = (phone) => {
    const n = String(phone).replace(/\D/g, '').replace(/^0/, '234');
    return `https://wa.me/${n}`;
  };

  await send({
    to: ADMIN_EMAIL,
    subject: `New booking: ${booking.name} — ${booking.serviceName} on ${fmtDate(booking.date)}`,
    html: base(`
      <div class="head">
        <h1>New Booking</h1>
        <p>Someone just booked an appointment</p>
      </div>
      <div class="body">
        <dl class="dl">
          <div><dt>Client</dt><dd>${booking.name}</dd></div>
          <div><dt>Phone</dt><dd>${booking.phone}</dd></div>
          ${booking.email ? `<div><dt>Email</dt><dd>${booking.email}</dd></div>` : ''}
          <div><dt>Service</dt><dd>${booking.serviceName}</dd></div>
          <div><dt>Date</dt><dd>${fmtDate(booking.date)}</dd></div>
          <div><dt>Time</dt><dd>${fmtTime(booking.time)}</dd></div>
          <div><dt>Nail shape</dt><dd>${booking.shape}</dd></div>
          ${booking.color ? `<div><dt>Colour</dt><dd>${booking.color}</dd></div>` : ''}
          ${booking.notes ? `<div><dt>Notes</dt><dd>${booking.notes}</dd></div>` : ''}
          <div><dt>Price</dt><dd>${money(booking.price, currency)}</dd></div>
          ${booking.loyalty ? `<div><dt>Loyalty visit</dt><dd>Yes — ${booking.discountPct}% off applies</dd></div>` : ''}
        </dl>
        <a class="btn" href="${waClient(booking.phone)}">WhatsApp client</a>
        <a class="btn" href="https://shyfunminails.com/admin/bookings" style="margin-left:12px; background:#8E3B6A;">Open dashboard</a>
      </div>
    `),
  });
}

/* ---------- Contact form message (to admin) ---------- */
export async function sendContactMessage(msg) {
  await send({
    to: ADMIN_EMAIL,
    replyTo: msg.email || undefined,
    subject: `Contact form: ${msg.subject || 'General enquiry'} — from ${msg.name}`,
    html: base(`
      <div class="head">
        <h1>New Message</h1>
        <p>Someone sent a message via the contact form</p>
      </div>
      <div class="body">
        <dl class="dl">
          <div><dt>Name</dt><dd>${msg.name}</dd></div>
          ${msg.email ? `<div><dt>Email</dt><dd><a href="mailto:${msg.email}">${msg.email}</a></dd></div>` : ''}
          ${msg.phone ? `<div><dt>Phone</dt><dd>${msg.phone}</dd></div>` : ''}
          <div><dt>Subject</dt><dd>${msg.subject || 'General enquiry'}</dd></div>
        </dl>
        <p style="background:#F7F5F8; border-radius:14px; padding:16px 20px; font-size:14px; line-height:1.6;">${(msg.message || '').replace(/\n/g, '<br>')}</p>
        ${msg.email ? `<a class="btn" href="mailto:${msg.email}">Reply by email</a>` : ''}
      </div>
    `),
  });
}

