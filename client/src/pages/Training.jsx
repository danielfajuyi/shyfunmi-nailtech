import { useState } from 'react';
import Page from '../components/Page.jsx';
import Reveal from '../components/Reveal.jsx';
import { api } from '../api.js';
import { useApp } from '../context.jsx';
import { useTitle } from '../hooks.js';

const LEARN = ['Hands-on practice, not just theory', 'Prep, shaping, gel and press-on application', 'Hygiene and client care', 'Nail art and freestyle techniques'];

export default function Training() {
  useTitle('Training');
  const { user } = useApp();
  const [f, setF] = useState({ name: user?.name || '', phone: user?.phone || '', email: user?.email || '', level: 'Beginner', message: '' });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const submit = async (e) => {
    e.preventDefault(); setErr(''); setBusy(true);
    try { await api.post('/api/enroll', f); setDone(true); } catch (x) { setErr(x.message); } finally { setBusy(false); }
  };
  return (
    <Page className="container section page-top split">
      <Reveal>
        <h1 className="h1s">Learn to do nails.</h1>
        <p className="lead">Nail training is available for beginners and for techs who want to sharpen their skills.</p>
        <ul className="ticks">{LEARN.map((x) => <li key={x}>{x}</li>)}</ul>
      </Reveal>
      <Reveal delay={0.1} className="card">
        {done ? (
          <div><h3>Thank you.</h3><p className="muted">Your enquiry is in. Shyfunmi will contact you about dates and fees.</p></div>
        ) : (
          <form onSubmit={submit} className="form" noValidate>
            <h3>Ask about training</h3>
            <div className="field"><label htmlFor="tn">Your name</label><input id="tn" value={f.name} onChange={set('name')} autoComplete="name" required /></div>
            <div className="grid-2">
              <div className="field"><label htmlFor="tp">Phone</label><input id="tp" type="tel" value={f.phone} onChange={set('phone')} autoComplete="tel" required /></div>
              <div className="field"><label htmlFor="te">Email (optional)</label><input id="te" type="email" value={f.email} onChange={set('email')} autoComplete="email" /></div>
            </div>
            <div className="field"><label htmlFor="tl">Experience</label>
              <select id="tl" value={f.level} onChange={set('level')}><option>Beginner</option><option>Some experience</option><option>Working nail tech</option></select></div>
            <div className="field"><label htmlFor="tm">What do you want to learn?</label><textarea id="tm" rows="3" value={f.message} onChange={set('message')} /></div>
            {err && <p className="err" role="alert">{err}</p>}
            <button className="btn" disabled={busy}>{busy ? 'Sending…' : 'Send enquiry'}</button>
          </form>
        )}
      </Reveal>
    </Page>
  );
}
