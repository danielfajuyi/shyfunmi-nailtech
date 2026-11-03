import { useState } from 'react';
import { Link } from 'react-router-dom';
import Page from '../components/Page.jsx';
import Reveal from '../components/Reveal.jsx';
import { useApp } from '../context.jsx';
import { useTitle } from '../hooks.js';
import { DAYS, fmtTime, waLink } from '../utils.js';

const FAQ = [
  ['How do I book?', 'Use the online booking page. Choose a service, pick an available time and confirm. Shyfunmi will confirm your appointment.'],
  ['How does the loyalty card work?', 'Every few visits earns a discount. Create an account and your completed visits are tracked automatically.'],
  ['Do you offer nail training?', 'Yes. Send an enquiry on the training page and say what you want to learn.'],
  ['Can I bring inspiration photos?', 'Yes. Show them at your appointment or send them on WhatsApp before you come.'],
  ['What if I need to cancel?', 'Cancel from your account page, or message on WhatsApp, so the slot can go to someone else.'],
];

export default function Contact() {
  useTitle('Contact');
  const { site } = useApp();
  const s = site.settings;
  const [open, setOpen] = useState(0);
  const wa = waLink(s, 'Hello, I’d like to ask about an appointment.');
  return (
    <Page className="container section page-top">
      <Reveal><h1 className="h1s">Visit and contact</h1></Reveal>
      <div className="split">
        <Reveal className="card">
          <h3>Find us</h3>
          <p>{s.address}</p>
          <div className="cta-row">
            <a className="btn ghost sm" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(s.address)}`} target="_blank" rel="noreferrer">Open in Maps</a>
            {wa && <a className="btn sm" href={wa} target="_blank" rel="noreferrer">WhatsApp</a>}
            {s.phone && <a className="btn ghost sm" href={`tel:${s.phone}`}>Call</a>}
          </div>
          <p className="muted">Instagram @{s.instagram}, TikTok @{s.tiktok}</p>
        </Reveal>
        <Reveal delay={0.1} className="card">
          <h3>Opening hours</h3>
          <ul className="hours">
            {DAYS.map(([k, label]) => { const h = s.hours[k]; return <li key={k}><span>{label}</span><b>{!h || h.closed ? 'Closed' : `${fmtTime(h.open)} to ${fmtTime(h.close)}`}</b></li>; })}
          </ul>
        </Reveal>
      </div>
      <Reveal className="faq">
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
