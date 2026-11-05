import nodemailer from 'nodemailer';
import { appUrl } from './auth.js';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'shyfunmiinails@gmail.com';
const SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com';
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587');
const SMTP_USER = process.env.SMTP_USER || '';
const SMTP_PASS = process.env.SMTP_PASS || '';
const BUSINESS_NAME = 'Shyfunmi Nails';

let transport = null;

function getTransport() {
  if (!SMTP_USER || !SMTP_PASS) return null;
  if (!transport) {
    transport = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
      pool: true,
      tls: { rejectUnauthorized: true },
    });
  }
  return transport;
}

function toPlainText(html) {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/tr>/gi, '\n')
    .replace(/<\/td>/gi, '  ')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

async function send(opts) {
  const t = getTransport();
  if (!t) {
    console.log('[mailer] SMTP not configured — email skipped:', opts.subject);
    return;
  }
  const html = opts.html || '';
  try {
    await t.sendMail({
      from: `"${BUSINESS_NAME}" <${SMTP_USER}>`,
      replyTo: opts.replyTo || `"${BUSINESS_NAME}" <${SMTP_USER}>`,
      ...opts,
      html,
      // Provide a clean plain-text alternative (crucial for spam filters)
      text: opts.text || toPlainText(html),
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
function esc(s) {
  return String(s || '').replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
}

function brand(settings = {}) {
  return {
    name: settings.businessName || BUSINESS_NAME,
    tagline: settings.tagline || 'Your confidence starts here',
    address: settings.address || 'Peter Odili Road, Port Harcourt',
    whatsapp: settings.whatsapp || '',
    site: appUrl(),
  };
}

const base = (content, settings = {}, previewText = '') => {
  const b = brand(settings);
  const wa = b.whatsapp ? `https://wa.me/${b.whatsapp}` : '';
  // previewText shown in inbox before email is opened — improves open rate & trust signal
  const preview = previewText || b.tagline;
  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<meta name="format-detection" content="telephone=no,address=no,email=no,date=no,url=no">
<title>${esc(b.name)}</title>
<!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
</head>
<body style="margin:0;padding:0;background:#F7F5F8;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;color:#17131B;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
  <!-- Preview text (hidden, shows in inbox) -->
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${esc(preview)}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#F7F5F8;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;width:100%;background:#ffffff;border:1px solid #E7E1EA;border-radius:24px;overflow:hidden;">
        <!-- Header -->
        <tr>
          <td style="background:#2A1626;color:#F7F5F8;padding:36px 40px 28px;">
            <p style="margin:0 0 8px;font-size:11px;letter-spacing:0.22em;text-transform:uppercase;color:#E08BB4;">Nail studio · Port Harcourt</p>
            <h1 style="margin:0;font-family:Georgia,'Times New Roman',serif;font-weight:300;font-size:28px;letter-spacing:-0.03em;">${esc(b.name)}</h1>
            <p style="margin:8px 0 0;opacity:0.7;font-size:14px;">${esc(b.tagline)}</p>
          </td>
        </tr>
        <!-- Body -->
        <tr><td style="padding:32px 40px;">${content}</td></tr>
        <!-- Footer -->
        <tr>
          <td style="padding:20px 40px;background:#F7F5F8;border-top:1px solid #E7E1EA;font-size:12px;color:#6C6473;">
            <p style="margin:0 0 6px;"><strong style="color:#17131B;">${esc(b.name)}</strong> · ${esc(b.address)}</p>
            <p style="margin:0 0 6px;">
              <a href="${esc(b.site)}" style="color:#8E3B6A;text-decoration:none;">Visit the salon website</a>
              ${wa ? ` · <a href="${wa}" style="color:#8E3B6A;text-decoration:none;">WhatsApp</a>` : ''}
            </p>
            <p style="margin:0;font-size:11px;color:#9CA3AF;">You are receiving this email because you made a booking or enquiry at ${esc(b.name)}. If this wasn't you, please ignore this email.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
};

const row = (label, value) => value
  ? `<tr>
      <td style="padding:12px 0;border-bottom:1px solid #E7E1EA;color:#6C6473;font-size:14px;">${esc(label)}</td>
      <td style="padding:12px 0;border-bottom:1px solid #E7E1EA;font-size:14px;font-weight:600;text-align:right;">${value}</td>
    </tr>` : '';

const pill = (status, label) => {
  const colors = {
    pending: 'background:#FEF3C7;color:#92400E;',
    confirmed: 'background:#D1FAE5;color:#065F46;',
    completed: 'background:#EDE9FE;color:#5B21B6;',
    cancelled: 'background:#FEE2E2;color:#991B1B;',
  };
  return `<span style="display:inline-block;padding:3px 12px;border-radius:999px;font-size:12px;font-weight:600;text-transform:capitalize;${colors[status] || colors.pending}">${esc(label || status)}</span>`;
};

const btn = (href, label, accent = false) =>
  `<a href="${esc(href)}" style="display:inline-block;margin-top:20px;margin-right:8px;padding:14px 26px;background:${accent ? '#8E3B6A' : '#17131B'};color:#F7F5F8;border-radius:999px;text-decoration:none;font-size:15px;font-weight:500;">${esc(label)}</a>`;

function bookingRows(booking, settings) {
  const { currency = '₦' } = settings;
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:18px 0 8px;">
    ${row('Service', esc(booking.serviceName))}
    ${row('Date', esc(fmtDate(booking.date)))}
    ${row('Time', esc(fmtTime(booking.time)))}
    ${row('Duration', esc(`${Math.floor(booking.duration / 60) ? Math.floor(booking.duration / 60) + ' hr ' : ''}${booking.duration % 60 ? booking.duration % 60 + ' min' : ''}`.trim()))}
    ${row('Price', esc(money(booking.price, currency) + (booking.discountPct ? ` (${booking.discountPct}% loyalty discount)` : '')))}
    ${row('Nail shape', esc(booking.shape))}
    ${booking.color ? row('Colour idea', esc(booking.color)) : ''}
    ${booking.notes ? row('Notes', esc(booking.notes)) : ''}
  </table>`;
}

export async function sendBookingConfirmation(booking, settings) {
  if (!booking.email) return;
  const b = brand(settings);
  const wa = b.whatsapp ? `https://wa.me/${b.whatsapp}` : '';
  const firstName = esc(booking.name.split(' ')[0]);
  const preview = `Hi ${firstName}, we've received your booking for ${booking.serviceName} on ${fmtDate(booking.date)}.`;
  await send({
    to: booking.email,
    subject: `Booking received – ${booking.serviceName} on ${fmtDate(booking.date)}`,
    html: base(`
      <p style="margin:0 0 12px;font-size:16px;">Hi <strong>${firstName}</strong>,</p>
      <p style="margin:0 0 8px;line-height:1.6;">We've received your booking request. Shyfunmi will confirm your appointment shortly — you'll get another email when it's confirmed.</p>
      ${bookingRows(booking, settings)}
      <p style="margin:16px 0 0;">Status ${pill('pending', 'Pending confirmation')}</p>
      ${wa ? btn(wa, 'Message on WhatsApp') : ''}
      ${btn(`${b.site}/account`, 'View my bookings', true)}
    `, settings, preview),
  });
}

export async function sendStatusUpdate(booking, settings) {
  if (!booking.email) return;
  const b = brand(settings);
  const wa = b.whatsapp ? `https://wa.me/${b.whatsapp}` : '';
  const labels = { confirmed: 'Your appointment is confirmed!', completed: 'Thanks for visiting us!', cancelled: 'Your booking has been cancelled.' };
  const label = labels[booking.status] || `Booking ${booking.status}`;
  const firstName = esc(booking.name.split(' ')[0]);
  await send({
    to: booking.email,
    subject: `${label} – ${booking.serviceName} at ${b.name}`,
    html: base(`
      <p style="margin:0 0 12px;font-size:16px;">Hi <strong>${firstName}</strong>,</p>
      ${booking.status === 'confirmed' ? '<p style="line-height:1.6;">Your appointment is confirmed. We\'ll see you soon — please arrive a few minutes early.</p>' : ''}
      ${booking.status === 'completed' ? '<p style="line-height:1.6;">Thank you for visiting Shyfunmi Nails. We hope you loved your nails. Leave a review from your account — it means a lot. This visit also stamps your loyalty card.</p>' : ''}
      ${booking.status === 'cancelled' ? '<p style="line-height:1.6;">Your appointment has been cancelled. You can rebook on our website anytime.</p>' : ''}
      ${bookingRows(booking, settings)}
      <p style="margin:16px 0 0;">Status ${pill(booking.status)}</p>
      ${booking.status !== 'cancelled' && wa ? btn(wa, 'Message on WhatsApp') : ''}
      ${booking.status === 'cancelled' ? btn(`${b.site}/book`, 'Book another appointment', true) : btn(`${b.site}/account`, 'Open my account', true)}
    `, settings, label),
  });
}

export async function sendAdminNewBooking(booking, settings) {
  const { currency = '₦' } = settings;
  const b = brand(settings);
  const n = String(booking.phone || '').replace(/\D/g, '').replace(/^0/, '234');
  await send({
    to: ADMIN_EMAIL,
    subject: `New booking: ${booking.name} — ${booking.serviceName} on ${fmtDate(booking.date)}`,
    html: base(`
      <p style="margin:0 0 8px;letter-spacing:0.16em;text-transform:uppercase;font-size:11px;color:#8E3B6A;">Studio inbox</p>
      <h2 style="margin:0 0 16px;font-family:Georgia,serif;font-weight:300;font-size:24px;">New booking request</h2>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        ${row('Client', esc(booking.name))}
        ${row('Phone', esc(booking.phone))}
        ${booking.email ? row('Email', `<a href="mailto:${esc(booking.email)}" style="color:#8E3B6A;text-decoration:none;">${esc(booking.email)}</a>`) : ''}
        ${row('Service', esc(booking.serviceName))}
        ${row('Date', esc(fmtDate(booking.date)))}
        ${row('Time', esc(fmtTime(booking.time)))}
        ${row('Nail shape', esc(booking.shape))}
        ${booking.color ? row('Colour', esc(booking.color)) : ''}
        ${booking.notes ? row('Notes', esc(booking.notes)) : ''}
        ${row('Price', esc(money(booking.price, currency)))}
        ${booking.loyalty ? row('Loyalty visit', esc(`Yes — ${booking.discountPct}% off applies`)) : ''}
      </table>
      ${n ? btn(`https://wa.me/${n}`, 'WhatsApp client') : ''}
      ${btn(`${b.site}/admin/bookings`, 'Open dashboard', true)}
    `, settings, `New booking from ${booking.name} for ${booking.serviceName}`),
  });
}

export async function sendContactMessage(msg, settings = {}) {
  const b = brand(settings);
  await send({
    to: ADMIN_EMAIL,
    replyTo: msg.email || undefined,
    subject: `Contact form: ${msg.subject || 'General enquiry'} — from ${msg.name}`,
    html: base(`
      <p style="margin:0 0 8px;letter-spacing:0.16em;text-transform:uppercase;font-size:11px;color:#8E3B6A;">Studio inbox</p>
      <h2 style="margin:0 0 16px;font-family:Georgia,serif;font-weight:300;font-size:24px;">New message</h2>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        ${row('Name', esc(msg.name))}
        ${msg.email ? row('Email', `<a href="mailto:${esc(msg.email)}" style="color:#8E3B6A;text-decoration:none;">${esc(msg.email)}</a>`) : ''}
        ${msg.phone ? row('Phone', esc(msg.phone)) : ''}
        ${row('Subject', esc(msg.subject || 'General enquiry'))}
      </table>
      <p style="background:#F7F5F8;border-radius:16px;padding:16px 20px;font-size:14px;line-height:1.7;margin:18px 0 0;">${esc(msg.message).replace(/\n/g, '<br>')}</p>
      ${msg.email ? btn(`mailto:${msg.email}`, 'Reply by email', true) : ''}
      ${btn(`${b.site}/admin/messages`, 'Open messages')}
    `, settings, `New contact from ${msg.name}: ${msg.subject || 'General enquiry'}`),
  });
}

export async function sendContactConfirmation(msg, settings = {}) {
  if (!msg.email) return;
  const b = brand(settings);
  const firstName = esc(msg.name.split(' ')[0]);
  await send({
    to: msg.email,
    subject: `We received your message – ${b.name}`,
    html: base(`
      <p style="margin:0 0 12px;font-size:16px;">Hi <strong>${firstName}</strong>,</p>
      <p style="line-height:1.6;">Thank you for writing to ${esc(b.name)}. We have your message and will reply as soon as we can.</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        ${row('Subject', esc(msg.subject || 'General enquiry'))}
      </table>
      <p style="background:#F7F5F8;border-radius:16px;padding:16px 20px;font-size:14px;line-height:1.7;margin:18px 0 0;">${esc(msg.message).replace(/\n/g, '<br>')}</p>
      ${btn(b.site, 'Back to the website', true)}
    `, settings, `We got your message, ${firstName}. We'll be in touch soon.`),
  });
}

export async function sendPasswordReset(user, token, settings = {}) {
  const b = brand(settings);
  const link = `${b.site}/reset?token=${encodeURIComponent(token)}&email=${encodeURIComponent(user.email)}`;
  const firstName = esc(user.name.split(' ')[0]);
  await send({
    to: user.email,
    subject: `Reset your ${b.name} password`,
    html: base(`
      <p style="margin:0 0 12px;font-size:16px;">Hi <strong>${firstName}</strong>,</p>
      <p style="line-height:1.6;">We received a request to reset the password for your ${esc(b.name)} account. This link expires in 1 hour.</p>
      ${btn(link, 'Choose a new password', true)}
      <p style="margin-top:24px;font-size:13px;color:#6C6473;">If you did not ask for this, you can ignore this email. Your password stays the same.</p>
    `, settings, `Password reset request for your ${b.name} account`),
  });
}
