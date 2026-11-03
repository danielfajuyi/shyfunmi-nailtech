import { Link } from 'react-router-dom';
import Page from '../components/Page.jsx';
import Reveal from '../components/Reveal.jsx';
import { useApp } from '../context.jsx';
import { useTitle } from '../hooks.js';
import { dur, money } from '../utils.js';

export default function Services() {
  useTitle('Services');
  const { site } = useApp();
  const s = site.settings;
  return (
    <Page className="container section page-top">
      <Reveal><h1 className="h1s">Services</h1><p className="lead">Every set is made to fit your hands and your lifestyle. Pick a service to book it.</p></Reveal>
      <div className="rows">
        {site.services.map((v, i) => (
          <Reveal key={v.id} delay={Math.min(i, 6) * 0.05}>
            <Link to={`/book?service=${v.id}`} className="row">
              <h3>{v.name}</h3><p>{v.description}</p>
              <span className="meta">{dur(v.duration)}<b>{money(v.price, s.currency)}</b></span>
            </Link>
          </Reveal>
        ))}
        {!site.services.length && <p className="muted">Services will appear here soon.</p>}
      </div>
      <Reveal className="note-box">
        <p>Loyal client? Every {s.loyaltyEvery}th visit earns {s.loyaltyDiscount}% off. <Link to="/register">Create an account</Link> to track your visits.</p>
      </Reveal>
    </Page>
  );
}
