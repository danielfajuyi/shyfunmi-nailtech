import { Link } from 'react-router-dom';
import Page from '../components/Page.jsx';
import Reveal from '../components/Reveal.jsx';
import PageHero from '../components/PageHero.jsx';
import ServiceRow from '../components/ServiceRow.jsx';
import { useApp } from '../context.jsx';
import { useTitle } from '../hooks.js';

export default function Services() {
  useTitle('Services');
  const { site } = useApp();
  const s = site.settings;
  return (
    <Page className="container section page-top">
      <PageHero kicker="What I do" title="Services" lead="Every set is made to fit your hands and your lifestyle. Pick a service to book it." />
      <div className="hx-rows" style={{ marginTop: 48 }}>
        {site.services.map((v, i) => <ServiceRow key={v.id} v={v} i={i} s={s} />)}
        {!site.services.length && <p className="muted" style={{ paddingTop: 24 }}>Services will appear here soon.</p>}
      </div>
      <Reveal className="note-box">
        <p>Loyal client? Every {s.loyaltyEvery}th visit earns {s.loyaltyDiscount}% off. <Link to="/register">Create an account</Link> to track your visits.</p>
      </Reveal>
    </Page>
  );
}
