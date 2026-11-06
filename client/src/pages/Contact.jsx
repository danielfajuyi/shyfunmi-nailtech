import { useState } from 'react';
import { Link } from 'react-router-dom';
import Page from '../components/Page.jsx';
import Reveal from '../components/Reveal.jsx';
import PageHero from '../components/PageHero.jsx';
import { toast } from '../components/Toast.jsx';
import { api } from '../api.js';
import { useApp } from '../context.jsx';
import { useTitle } from '../hooks.js';
import { DAYS, fmtTime, waLink } from '../utils.js';

const FAQ = [
  ['How do I book?', 'Use the online booking page. Choose a service, pick an available time and confirm. Shyfunmi will confirm your appointment.'],
  ['How does the loyalty card work?', 'Every few visits earns a discount. Create an account and your completed visits are tracked automatically.'],
  ['Do you offer nail training?', 'Yes. Send an enquiry on the training page and say what you want to learn.'],
  ['Can I bring inspiration photos?', 'Yes. Show them at your appointment or send them on WhatsApp before you come.'],
  ['What if I need to cancel?', 'Cancel from your account page, or message on WhatsApp, so the slot can go to someone else.'],
  ['Do you do group bookings?', 'Yes, for events, birthdays or bridal parties. Message us on WhatsApp with your group size and preferred date.'],
  ['How early should I arrive?', 'Please arrive 5 minutes early so we can start on time. Let us know if you\'re running late.'],
];

const SUBJECTS = ['General enquiry', 'Appointment question', 'Group booking', 'Press-on order', 'Training', 'Other'];

export default function Contact() {
  useTitle('Contact');
  const { site, user } = useApp();
  const s = site.settings;
  const [open, setOpen] = useState(-1);
  const [f, setF] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    subject: 'General enquiry',
    message: '',
  });
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const wa = waLink(s, 'Hello, I\u2019d like to ask about an appointment.');

  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    if (!f.name.trim()) return toast('Please enter your name.', 'err');
    if (!f.message.trim()) return toast('Please write a message.', 'err');
    setBusy(true);
    try {
      await api.post('/api/contact', f);
      setDone(true);
    } catch (x) {
      toast(x.message, 'err');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Page className="container section page-top">
      <PageHero kicker="Say hello" title={'Visit and\ncontact'} />

      <div className="split" style={{ marginTop: 36 }}>
        <Reveal className="card">
          <h3>Find us</h3>
          <p>{s.address}</p>
          <div className="cta-row" style={{ marginTop: 16, marginBottom: 16 }}>
            <a className="btn ghost sm" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(s.address)}`} target="_blank" rel="noreferrer">Open in Maps</a>
            {wa && <a className="btn sm" href={wa} target="_blank" rel="noreferrer">WhatsApp</a>}
            {s.phone && <a className="btn ghost sm" href={`tel:${s.phone}`}>Call</a>}
          </div>
          {s.instagram && <p className="muted">Instagram: <a href={`https://www.instagram.com/${s.instagram}`} target="_blank" rel="noreferrer">@{s.instagram}</a></p>}
          {s.tiktok && <p className="muted" style={{ marginTop: 4 }}>TikTok: <a href={`https://www.tiktok.com/@${s.tiktok}`} target="_blank" rel="noreferrer">@{s.tiktok}</a></p>}
        </Reveal>

        <Reveal delay={0.1} className="card">
          <h3>Opening hours</h3>
          <ul className="hours">
            {DAYS.map(([k, label]) => { const h = s.hours[k]; return <li key={k}><span>{label}</span><b>{!h || h.closed ? 'Closed' : `${fmtTime(h.open)} to ${fmtTime(h.close)}`}</b></li>; })}
          </ul>
        </Reveal>
      </div>

      {/* Contact Form */}
      <Reveal style={{ marginTop: 72 }}>
        <h2>Send a message</h2>
        <p className="lead" style={{ marginBottom: 32 }}>Have a question, want to arrange a group booking, or just want to say hi? We'll get back to you soon.</p>
        {done ? (
          <div className="card" style={{ maxWidth: 560, textAlign: 'center', padding: '40px 36px' }}>
            <div className="check" aria-hidden="true" style={{ margin: '0 auto 16px' }}>✓</div>
            <h3>Message sent!</h3>
            <p className="muted">Thanks for getting in touch. We'll reply to you as soon as possible.</p>
            <div className="cta-row" style={{ justifyContent: 'center', marginTop: 20 }}>
              <Link className="btn" to="/book">Book an appointment</Link>
              <button className="btn ghost" onClick={() => { setDone(false); setF({ ...f, message: '' }); }}>Send another</button>
            </div>
          </div>
        ) : (
          <form className="card form" style={{ maxWidth: 640 }} onSubmit={submit} noValidate>
            <div className="grid-2">
              <div className="field"><label htmlFor="cn">Your name</label><input id="cn" value={f.name} onChange={set('name')} autoComplete="name" required /></div>
              <div className="field"><label htmlFor="cp">Phone (optional)</label><input id="cp" type="tel" value={f.phone} onChange={set('phone')} autoComplete="tel" /></div>
            </div>
            <div className="field"><label htmlFor="ce">Email (optional)</label><input id="ce" type="email" value={f.email} onChange={set('email')} autoComplete="email" /></div>
            <div className="field"><label htmlFor="cs">Subject</label>
              <select id="cs" value={f.subject} onChange={set('subject')}>
                {SUBJECTS.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="field"><label htmlFor="cm">Message</label><textarea id="cm" rows="5" value={f.message} onChange={set('message')} placeholder="What would you like to know?" required /></div>
            <button className="btn" disabled={busy}>{busy ? 'Sending…' : 'Send message'}</button>
          </form>
        )}
      </Reveal>

      <Reveal className="faq" style={{ marginTop: 80 }}>
        <h2>Questions</h2>
        {FAQ.map(([q, a], i) => (
          <div key={q} className={`faq-item ${open === i ? 'open' : ''}`}>
            <button aria-expanded={open === i} onClick={() => setOpen(open === i ? -1 : i)}>{q}<span>+</span></button>
            <div className="faq-a"><p>{a}</p></div>
          </div>
        ))}
        <p className="muted" style={{ marginTop: 24 }}>Ready? <Link to="/book">Book your appointment</Link>.</p>
      </Reveal>
    </Page>
  );
}
