import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useApp } from '../context.jsx';
import Logo from './Logo.jsx';
import FxLayer from './FxLayer.jsx';
import { FootMark, ScrollProgress } from './motion.jsx';
import {
  SunIcon, MoonIcon, UserIcon, ArrowRightIcon, ArrowUpIcon, CloseIcon, MapPinIcon, PhoneIcon,
  InstagramIcon, FacebookIcon, TikTokIcon, WhatsAppIcon, ClockIcon, LogOutIcon,
} from './Icons.jsx';
import { fmtTime } from '../utils.js';

const LINKS = [['/', 'Home'], ['/services', 'Services'], ['/gallery', 'Gallery'], ['/training', 'Training'], ['/contact', 'Contact']];

export function useTheme() {
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || '');
  useEffect(() => {
    if (theme) document.documentElement.dataset.theme = theme; else delete document.documentElement.dataset.theme;
    localStorage.setItem('theme', theme);
  }, [theme]);
  const dark = theme ? theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
  return [dark, () => setTheme(dark ? 'light' : 'dark')];
}

/* "Open now · until 6:00 pm" from the opening hours set in the admin settings */
function openStatus(hours) {
  const keys = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  const now = new Date();
  const h = hours?.[keys[now.getDay()]];
  if (!h || h.closed) return { open: false, text: 'Closed today' };
  const mins = (t) => { const [a, b] = t.split(':').map(Number); return a * 60 + b; };
  const cur = now.getHours() * 60 + now.getMinutes();
  if (cur >= mins(h.open) && cur < mins(h.close)) return { open: true, text: `Open now · until ${fmtTime(h.close)}` };
  if (cur < mins(h.open)) return { open: false, text: `Opens today at ${fmtTime(h.open)}` };
  return { open: false, text: 'Closed for today' };
}

export default function Layout() {
  const { site, user, logout } = useApp();
  const s = site.settings;
  const loc = useLocation();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [dark, toggle] = useTheme();

  useEffect(() => {
    setOpen(false);
    if (window.__lenis) window.__lenis.scrollTo(0, { immediate: true }); else window.scrollTo(0, 0);
  }, [loc.pathname]);
  useEffect(() => {
    const f = () => setScrolled(window.scrollY > 12);
    f(); window.addEventListener('scroll', f, { passive: true });
    return () => window.removeEventListener('scroll', f);
  }, []);

  // full-screen menu: lock page scroll, Escape closes, closes itself when the window grows to desktop
  useEffect(() => {
    if (!open) return undefined;
    const lenis = window.__lenis;
    lenis?.stop();
    document.body.classList.add('drawer-open');
    const esc = (e) => { if (e.key === 'Escape') setOpen(false); };
    const mq = matchMedia('(min-width: 1021px)');
    const grow = () => { if (mq.matches) setOpen(false); };
    window.addEventListener('keydown', esc);
    mq.addEventListener('change', grow);
    return () => {
      window.removeEventListener('keydown', esc);
      mq.removeEventListener('change', grow);
      document.body.classList.remove('drawer-open');
      lenis?.start();
    };
  }, [open]);

  const account = user ? (user.role === 'admin' ? '/admin' : '/account') : '/login';
  const accountLabel = user ? (user.role === 'admin' ? 'Admin' : 'My account') : 'Sign in';
  const status = openStatus(s.hours);
  const wa = `https://wa.me/${(s.whatsapp || '2349159814635').replace(/\D/g, '')}`;
  const tel = s.phone ? `tel:${s.phone.replace(/[^\d+]/g, '')}` : null;
  const socials = [
    s.instagram && ['Instagram', `https://www.instagram.com/${s.instagram}`, InstagramIcon],
    s.tiktok && ['TikTok', `https://www.tiktok.com/@${s.tiktok}`, TikTokIcon],
    ['Facebook', 'https://www.facebook.com/Shyfunmi.nails', FacebookIcon],
    ['WhatsApp', wa, WhatsAppIcon],
  ].filter(Boolean);
  const toTop = () => { if (window.__lenis) window.__lenis.scrollTo(0); else window.scrollTo({ top: 0, behavior: 'smooth' }); };

  return (
    <>
      <a className="skip" href="#main">Skip to content</a>
      <ScrollProgress />
      <FxLayer cursor />

      <header className={`nav ${scrolled ? 'scrolled' : ''}`}>
        <div className="nav-shell">
          <Link to="/" className="logo"><Logo size={32} /> <span>{s.businessName || 'Shyfunmi Nails'}</span></Link>
          <nav className="links" aria-label="Main">
            {LINKS.map(([to, label]) => <NavLink key={to} to={to} end={to === '/'}>{label}</NavLink>)}
          </nav>
          <div className="nav-actions">
            <button type="button" className="icon-btn nav-theme" onClick={toggle} aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}>{dark ? <SunIcon size={17} /> : <MoonIcon size={17} />}</button>
            <Link className="nav-account" to={account} title={accountLabel}><UserIcon size={17} /> <span>{accountLabel}</span></Link>
            <Link className="btn sm nav-book" to="/book">Book now <ArrowRightIcon size={15} /></Link>
            <button type="button" className="burger" aria-label="Open menu" aria-expanded={open} onClick={() => setOpen(true)}><i /><i /><i /></button>
          </div>
        </div>
      </header>

      {/* Rendered outside the header: a blurred header would otherwise trap this fixed layer */}
      <AnimatePresence>
        {open && (
          <motion.div className="mnav" role="dialog" aria-modal="true" aria-label="Menu" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
            <div className="mnav-head">
              <Link to="/" className="logo" onClick={() => setOpen(false)}><Logo size={30} /> <span>{s.businessName || 'Shyfunmi Nails'}</span></Link>
              <button type="button" className="icon-btn" onClick={() => setOpen(false)} aria-label="Close menu"><CloseIcon size={18} /></button>
            </div>

            <nav className="mnav-links" aria-label="Mobile">
              {LINKS.map(([to, label], i) => (
                <NavLink key={to} to={to} end={to === '/'} style={{ '--i': i }} onClick={() => setOpen(false)}>
                  <span className="n">{String(i + 1).padStart(2, '0')}</span>{label}<ArrowRightIcon size={18} />
                </NavLink>
              ))}
            </nav>

            <div className="mnav-foot" style={{ '--i': LINKS.length }}>
              <Link className="btn" to="/book" onClick={() => setOpen(false)}>Book an appointment <ArrowRightIcon size={16} /></Link>
              <Link className="btn ghost" to={account} onClick={() => setOpen(false)}><UserIcon size={16} /> {accountLabel}</Link>
              <div className="mnav-row">
                <div className="socials">
                  {socials.map(([label, href, Ico]) => <a key={label} className="soc" href={href} target="_blank" rel="noreferrer" aria-label={label}><Ico size={18} /></a>)}
                </div>
                <button type="button" className="icon-btn" onClick={toggle} aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}>{dark ? <SunIcon size={17} /> : <MoonIcon size={17} />}</button>
              </div>
              {s.address && <p className="mnav-addr muted"><MapPinIcon size={14} /> {s.address}</p>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div id="main"><Outlet /></div>

      <footer className="footer">
        <div className="container">
          <section className="foot-cta">
            <div>
              <h2>Ready for your next set?</h2>
              <p>Book online in under a minute, or message us on WhatsApp and we’ll sort it out together.</p>
            </div>
            <div className="foot-cta-actions">
              <Link className="btn light" to="/book">Book now <ArrowRightIcon size={16} /></Link>
              <a className="btn ghost-light" href={wa} target="_blank" rel="noreferrer"><WhatsAppIcon size={16} /> Chat on WhatsApp</a>
            </div>
          </section>

          <div className="foot-grid">
            <div className="foot-brand">
              <Link to="/" className="fb-logo"><Logo size={36} className="footer-logo" /> <span>{s.businessName}</span></Link>
              <p>{s.tagline}.</p>
              <span className={`foot-status ${status.open ? 'is-open' : ''}`}><i /> {status.text}</span>
              <div className="socials">
                {socials.map(([label, href, Ico]) => <a key={label} className="soc" href={href} target="_blank" rel="noreferrer" aria-label={label} title={label}><Ico size={18} /></a>)}
              </div>
            </div>

            <div className="foot-col">
              <h4>Explore</h4>
              {LINKS.map(([to, label]) => <Link key={to} to={to}>{label}</Link>)}
              <Link to="/book">Book appointment</Link>
            </div>

            <div className="foot-col">
              <h4>Visit us</h4>
              {s.address && <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(s.address)}`} target="_blank" rel="noreferrer"><MapPinIcon size={15} /> <span>{s.address}</span></a>}
              {tel && <a href={tel}><PhoneIcon size={15} /> <span>{s.phone}</span></a>}
              <Link to="/contact"><ClockIcon size={15} /> <span>Opening hours</span></Link>
            </div>

            <div className="foot-col">
              <h4>Account</h4>
              {user ? (
                <>
                  <Link to={user.role === 'admin' ? '/admin' : '/account'}>{user.role === 'admin' ? 'Admin dashboard' : 'My account'}</Link>
                  {user.role !== 'admin' && <Link to="/account/bookings">My bookings</Link>}
                  <button type="button" className="linklike" onClick={logout}><LogOutIcon size={15} /> Sign out</button>
                </>
              ) : (
                <>
                  <Link to="/login">Sign in</Link>
                  <Link to="/register">Create account</Link>
                </>
              )}
            </div>
          </div>
        </div>

        <FootMark text={s.businessName || 'Shyfunmi Nails'} />

        <div className="container fine">
          <span>© {new Date().getFullYear()} {s.businessName}. All rights reserved.</span>
          <span className="fine-right">
            {!user && <Link to="/admin/login">Admin portal</Link>}
            <button type="button" className="to-top" onClick={toTop}>Back to top <ArrowUpIcon size={14} /></button>
          </span>
        </div>
      </footer>
    </>
  );
}

