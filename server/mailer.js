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
    });
  }
  return transport;
}

async function send({ to, subject, html, text, replyTo }) {
  const t = getTransport();
  if (!t) {
    console.log('[mailer] SMTP not configured — email skipped:', subject);
    return;
  }
  try {
    await t.sendMail({
      from: `"${BUSINESS_NAME}" <${SMTP_USER}>`,
      replyTo: replyTo || `"${BUSINESS_NAME}" <${SMTP_USER}>`,
      to,
      subject,
      text,
      html,
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

function fmtDuration(dur) {
  const mins = Number(dur) || 60;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h > 0 && m > 0) return `${h} hr ${m} min`;
  if (h > 0) return `${h} hr`;
  return `${m} min`;
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
    tagline: settings.tagline || 'Nails that transform confidence',
    address: settings.address || 'Peter Odili Road, Port Harcourt',
    whatsapp: settings.whatsapp || '',
    site: appUrl(),
  };
}

/**
 * Clean, lightweight, professional email layout.
 * Avoids heavy dark banners, hidden divs, and spammy CSS patterns.
 */
function layout(bodyHtml, settings = {}) {
  const b = brand(settings);
  const wa = b.whatsapp ? `https://wa.me/${b.whatsapp}` : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(b.name)}</title>
</head>
<body style="margin:0;padding:24px 12px;background-color:#F5F5F7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1C1C1E;line-height:1.6;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:580px;margin:0 auto;background:#FFFFFF;border-radius:18px;border:1px solid #E5E5EA;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.04);">
    <!-- Header -->
    <tr>
      <td style="padding:28px 32px 20px;border-bottom:1px solid #F2F2F7;">
        <h2 style="margin:0;font-size:22px;font-weight:600;color:#2A1626;letter-spacing:-0.02em;">${esc(b.name)}</h2>
        <p style="margin:4px 0 0;font-size:13px;color:#8E8E93;">${esc(b.tagline)} · ${esc(b.address)}</p>
      </td>
    </tr>
    <!-- Content -->
    <tr>
      <td style="padding:28px 32px;">
        ${bodyHtml}
      </td>
    </tr>
    <!-- Footer -->
    <tr>
      <td style="padding:20px 32px;background:#FBFBFD;border-top:1px solid #F2F2F7;font-size:12px;color:#8E8E93;line-height:1.5;">
        <p style="margin:0 0 6px;">
          <a href="${esc(b.site)}" style="color:#8E3B6A;text-decoration:none;font-weight:500;">Visit Salon Website</a>
          ${wa ? ` &nbsp;·&nbsp; <a href="${wa}" style="color:#8E3B6A;text-decoration:none;font-weight:500;">WhatsApp</a>` : ''}
          &nbsp;·&nbsp; <a href="${esc(b.site)}/account" style="color:#8E3B6A;text-decoration:none;font-weight:500;">My Account</a>
        </p>
        <p style="margin:0;">You received this email regarding your appointment or enquiry with ${esc(b.name)}.</p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export async function sendBookingConfirmation(booking, settings = {}) {
  if (!booking.email) return;
  const b = brand(settings);
  const firstName = booking.name.split(' ')[0] || booking.name;
  const dateFormatted = fmtDate(booking.date);
  const timeFormatted = fmtTime(booking.time);
  const durFormatted = fmtDuration(booking.duration);
  const priceFormatted = money(booking.price, settings.currency) + (booking.discountPct ? ` (${booking.discountPct}% loyalty applied)` : '');

  const text = `Hi ${firstName},

Thank you for booking with ${b.name}!

We have received your appointment request and will confirm it shortly.

Appointment Summary:
• Service: ${booking.serviceName}
• Date: ${dateFormatted}
• Time: ${timeFormatted}
• Duration: ${durFormatted}
• Price: ${priceFormatted}
• Nail Shape: ${booking.shape || 'Standard'}
${booking.color ? `• Colour/Style Idea: ${booking.color}\n` : ''}${booking.notes ? `• Special Notes: ${booking.notes}\n` : ''}
Status: Pending Confirmation

You can view your booking status and appointments at:
${b.site}/account

Warm regards,
${b.name}
${b.address}`;

  const html = layout(`
    <p style="margin:0 0 16px;font-size:16px;color:#1C1C1E;">Hi <strong>${esc(firstName)}</strong>,</p>
    <p style="margin:0 0 20px;font-size:15px;color:#3A3A3C;">We have received your booking request! Victoria will review your slot and confirm shortly.</p>

    <div style="background:#FAF8FA;border:1px solid #EFE8ED;border-radius:12px;padding:18px 20px;margin-bottom:24px;">
      <h3 style="margin:0 0 14px;font-size:15px;color:#2A1626;font-weight:600;text-transform:uppercase;letter-spacing:0.04em;">Appointment Details</h3>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;color:#3A3A3C;">
        <tr><td style="padding:6px 0;color:#636366;">Service</td><td style="padding:6px 0;text-align:right;font-weight:600;color:#1C1C1E;">${esc(booking.serviceName)}</td></tr>
        <tr><td style="padding:6px 0;color:#636366;">Date</td><td style="padding:6px 0;text-align:right;font-weight:600;color:#1C1C1E;">${esc(dateFormatted)}</td></tr>
        <tr><td style="padding:6px 0;color:#636366;">Time</td><td style="padding:6px 0;text-align:right;font-weight:600;color:#1C1C1E;">${esc(timeFormatted)}</td></tr>
        <tr><td style="padding:6px 0;color:#636366;">Duration</td><td style="padding:6px 0;text-align:right;font-weight:600;color:#1C1C1E;">${esc(durFormatted)}</td></tr>
        <tr><td style="padding:6px 0;color:#636366;">Estimated Price</td><td style="padding:6px 0;text-align:right;font-weight:600;color:#1C1C1E;">${esc(priceFormatted)}</td></tr>
        <tr><td style="padding:6px 0;color:#636366;">Nail Shape</td><td style="padding:6px 0;text-align:right;font-weight:600;color:#1C1C1E;">${esc(booking.shape || 'Standard')}</td></tr>
        ${booking.color ? `<tr><td style="padding:6px 0;color:#636366;">Colour / Idea</td><td style="padding:6px 0;text-align:right;font-weight:600;color:#1C1C1E;">${esc(booking.color)}</td></tr>` : ''}
        ${booking.notes ? `<tr><td style="padding:6px 0;color:#636366;">Notes</td><td style="padding:6px 0;text-align:right;font-weight:600;color:#1C1C1E;">${esc(booking.notes)}</td></tr>` : ''}
      </table>
    </div>

    <div style="margin:24px 0 10px;text-align:center;">
      <a href="${esc(b.site)}/account" style="display:inline-block;padding:12px 28px;background:#8E3B6A;color:#FFFFFF;text-decoration:none;border-radius:999px;font-size:14px;font-weight:500;">View My Bookings</a>
    </div>
  `, settings);

  await send({
    to: booking.email,
    subject: `Appointment Booking Request: ${booking.serviceName} (${dateFormatted})`,
    text,
    html,
  });
}

export async function sendStatusUpdate(booking, settings = {}) {
  if (!booking.email) return;
  const b = brand(settings);
  const firstName = booking.name.split(' ')[0] || booking.name;
  const dateFormatted = fmtDate(booking.date);
  const timeFormatted = fmtTime(booking.time);

  const messages = {
    confirmed: {
      subject: `Your Appointment is Confirmed! — ${booking.serviceName} at ${b.name}`,
      headline: 'Your appointment is confirmed!',
      body: `We are looking forward to seeing you on ${dateFormatted} at ${timeFormatted}. Please arrive a few minutes before your slot.`,
    },
    completed: {
      subject: `Thank you for visiting ${b.name}!`,
      headline: 'Thank you for your visit!',
      body: `We hope you love your new nails! Your loyalty visit has been recorded on your account. You can leave a review anytime from your dashboard.`,
    },
    cancelled: {
      subject: `Appointment Update: Booking Cancelled — ${b.name}`,
      headline: 'Your appointment has been cancelled',
      body: `Your appointment for ${booking.serviceName} on ${dateFormatted} has been cancelled. You can pick another date or rebook anytime.`,
    },
  };

  const info = messages[booking.status] || {
    subject: `Booking Update: ${booking.status} — ${b.name}`,
    headline: `Booking status: ${booking.status}`,
    body: `Your booking status for ${booking.serviceName} on ${dateFormatted} is now ${booking.status}.`,
  };

  const text = `Hi ${firstName},

${info.headline}

${info.body}

Service: ${booking.serviceName}
Date: ${dateFormatted}
Time: ${timeFormatted}

View details anytime at:
${b.site}/account

Warm regards,
${b.name}`;

  const html = layout(`
    <p style="margin:0 0 14px;font-size:16px;color:#1C1C1E;">Hi <strong>${esc(firstName)}</strong>,</p>
    <h3 style="margin:0 0 12px;font-size:18px;color:#2A1626;">${esc(info.headline)}</h3>
    <p style="margin:0 0 20px;font-size:15px;color:#3A3A3C;">${esc(info.body)}</p>

    <div style="background:#FAF8FA;border:1px solid #EFE8ED;border-radius:12px;padding:16px 20px;margin-bottom:20px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;color:#3A3A3C;">
        <tr><td style="padding:5px 0;color:#636366;">Service</td><td style="padding:5px 0;text-align:right;font-weight:600;color:#1C1C1E;">${esc(booking.serviceName)}</td></tr>
        <tr><td style="padding:5px 0;color:#636366;">Date</td><td style="padding:5px 0;text-align:right;font-weight:600;color:#1C1C1E;">${esc(dateFormatted)}</td></tr>
        <tr><td style="padding:5px 0;color:#636366;">Time</td><td style="padding:5px 0;text-align:right;font-weight:600;color:#1C1C1E;">${esc(timeFormatted)}</td></tr>
      </table>
    </div>

    <div style="margin:20px 0;text-align:center;">
      <a href="${esc(b.site)}/account" style="display:inline-block;padding:12px 28px;background:#8E3B6A;color:#FFFFFF;text-decoration:none;border-radius:999px;font-size:14px;font-weight:500;">Manage My Booking</a>
    </div>
  `, settings);

  await send({
    to: booking.email,
    subject: info.subject,
    text,
    html,
  });
}

export async function sendAdminNewBooking(booking, settings = {}) {
  const b = brand(settings);
  const phone = String(booking.phone || '').replace(/\D/g, '');
  const wa = phone ? `https://wa.me/${phone.replace(/^0/, '234')}` : '';

  const text = `New Booking Request from ${booking.name}

Service: ${booking.serviceName}
Date: ${fmtDate(booking.date)}
Time: ${fmtTime(booking.time)}
Phone: ${booking.phone}
Email: ${booking.email || 'N/A'}
Shape: ${booking.shape || 'Standard'}
Color: ${booking.color || 'N/A'}
Notes: ${booking.notes || 'None'}

Admin Dashboard:
${b.site}/admin/bookings`;

  const html = layout(`
    <h3 style="margin:0 0 16px;font-size:18px;color:#2A1626;">New Booking Request</h3>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;color:#3A3A3C;margin-bottom:20px;">
      <tr><td style="padding:6px 0;color:#636366;">Client</td><td style="padding:6px 0;text-align:right;font-weight:600;">${esc(booking.name)}</td></tr>
      <tr><td style="padding:6px 0;color:#636366;">Phone</td><td style="padding:6px 0;text-align:right;font-weight:600;">${esc(booking.phone)}</td></tr>
      ${booking.email ? `<tr><td style="padding:6px 0;color:#636366;">Email</td><td style="padding:6px 0;text-align:right;font-weight:600;">${esc(booking.email)}</td></tr>` : ''}
      <tr><td style="padding:6px 0;color:#636366;">Service</td><td style="padding:6px 0;text-align:right;font-weight:600;">${esc(booking.serviceName)}</td></tr>
      <tr><td style="padding:6px 0;color:#636366;">Date</td><td style="padding:6px 0;text-align:right;font-weight:600;">${esc(fmtDate(booking.date))}</td></tr>
      <tr><td style="padding:6px 0;color:#636366;">Time</td><td style="padding:6px 0;text-align:right;font-weight:600;">${esc(fmtTime(booking.time))}</td></tr>
      <tr><td style="padding:6px 0;color:#636366;">Price</td><td style="padding:6px 0;text-align:right;font-weight:600;">${esc(money(booking.price, settings.currency))}</td></tr>
      ${booking.notes ? `<tr><td style="padding:6px 0;color:#636366;">Notes</td><td style="padding:6px 0;text-align:right;">${esc(booking.notes)}</td></tr>` : ''}
    </table>

    <div style="margin:20px 0;text-align:center;">
      ${wa ? `<a href="${wa}" style="display:inline-block;margin-right:8px;padding:10px 20px;background:#25D366;color:#FFFFFF;text-decoration:none;border-radius:999px;font-size:13px;font-weight:500;">WhatsApp Client</a>` : ''}
      <a href="${esc(b.site)}/admin/bookings" style="display:inline-block;padding:10px 20px;background:#2A1626;color:#FFFFFF;text-decoration:none;border-radius:999px;font-size:13px;font-weight:500;">Open Dashboard</a>
    </div>
  `, settings);

  await send({
    to: ADMIN_EMAIL,
    subject: `New Appointment: ${booking.name} — ${booking.serviceName}`,
    text,
    html,
  });
}

export async function sendContactMessage(msg, settings = {}) {
  const b = brand(settings);
  const text = `Contact Inquiry from ${msg.name}

Email: ${msg.email || 'N/A'}
Phone: ${msg.phone || 'N/A'}
Subject: ${msg.subject || 'General'}

Message:
${msg.message}

Reply via email or check dashboard:
${b.site}/admin/messages`;

  const html = layout(`
    <h3 style="margin:0 0 16px;font-size:18px;color:#2A1626;">New Contact Message</h3>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;color:#3A3A3C;margin-bottom:16px;">
      <tr><td style="padding:5px 0;color:#636366;">From</td><td style="padding:5px 0;text-align:right;font-weight:600;">${esc(msg.name)}</td></tr>
      <tr><td style="padding:5px 0;color:#636366;">Email</td><td style="padding:5px 0;text-align:right;">${esc(msg.email)}</td></tr>
      ${msg.phone ? `<tr><td style="padding:5px 0;color:#636366;">Phone</td><td style="padding:5px 0;text-align:right;">${esc(msg.phone)}</td></tr>` : ''}
      <tr><td style="padding:5px 0;color:#636366;">Subject</td><td style="padding:5px 0;text-align:right;">${esc(msg.subject || 'General enquiry')}</td></tr>
    </table>
    <div style="background:#F5F5F7;border-radius:10px;padding:16px;font-size:14px;line-height:1.6;margin-bottom:20px;">
      ${esc(msg.message).replace(/\n/g, '<br>')}
    </div>
    <div style="text-align:center;">
      ${msg.email ? `<a href="mailto:${esc(msg.email)}" style="display:inline-block;padding:10px 22px;background:#8E3B6A;color:#FFFFFF;text-decoration:none;border-radius:999px;font-size:13px;font-weight:500;">Reply to ${esc(msg.name)}</a>` : ''}
    </div>
  `, settings);

  await send({
    to: ADMIN_EMAIL,
    replyTo: msg.email || undefined,
    subject: `Contact Form: ${msg.name} — ${msg.subject || 'General enquiry'}`,
    text,
    html,
  });
}

export async function sendContactConfirmation(msg, settings = {}) {
  if (!msg.email) return;
  const b = brand(settings);
  const firstName = msg.name.split(' ')[0] || msg.name;

  const text = `Hi ${firstName},

Thank you for reaching out to ${b.name}!

We have received your message regarding "${msg.subject || 'General enquiry'}" and will get back to you shortly.

Your message:
${msg.message}

Warm regards,
${b.name}`;

  const html = layout(`
    <p style="margin:0 0 14px;font-size:16px;color:#1C1C1E;">Hi <strong>${esc(firstName)}</strong>,</p>
    <p style="margin:0 0 16px;font-size:15px;color:#3A3A3C;">Thank you for getting in touch with us! We have received your message and will reply as soon as possible.</p>
    <div style="background:#FAF8FA;border:1px solid #EFE8ED;border-radius:10px;padding:14px 18px;margin-bottom:20px;font-size:14px;color:#636366;">
      <strong>Your Message:</strong><br>
      ${esc(msg.message).replace(/\n/g, '<br>')}
    </div>
    <div style="text-align:center;">
      <a href="${esc(b.site)}" style="display:inline-block;padding:10px 24px;background:#2A1626;color:#FFFFFF;text-decoration:none;border-radius:999px;font-size:13px;font-weight:500;">Visit Website</a>
    </div>
  `, settings);

  await send({
    to: msg.email,
    subject: `We received your message — ${b.name}`,
    text,
    html,
  });
}

export async function sendPasswordReset(user, token, settings = {}) {
  const b = brand(settings);
  const link = `${b.site}/reset?token=${encodeURIComponent(token)}&email=${encodeURIComponent(user.email)}`;
  const firstName = user.name.split(' ')[0] || user.name;

  const text = `Hi ${firstName},

We received a request to reset the password for your ${b.name} account.

Use the link below to choose a new password (valid for 1 hour):
${link}

If you didn't request this, you can safely ignore this email.

${b.name}`;

  const html = layout(`
    <p style="margin:0 0 14px;font-size:16px;color:#1C1C1E;">Hi <strong>${esc(firstName)}</strong>,</p>
    <p style="margin:0 0 16px;font-size:15px;color:#3A3A3C;">We received a request to reset your password. Click the button below to set a new password. This link is valid for 1 hour.</p>
    <div style="margin:24px 0;text-align:center;">
      <a href="${esc(link)}" style="display:inline-block;padding:12px 28px;background:#8E3B6A;color:#FFFFFF;text-decoration:none;border-radius:999px;font-size:14px;font-weight:500;">Reset Password</a>
    </div>
    <p style="margin:0;font-size:13px;color:#8E8E93;">If you did not request this change, you can safely ignore this email.</p>
  `, settings);

  await send({
    to: user.email,
    subject: `Reset your ${b.name} password`,
    text,
    html,
  });
}
