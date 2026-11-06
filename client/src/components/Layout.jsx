import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useApp } from '../context.jsx';
import Logo from './Logo.jsx';
import FxLayer from './FxLayer.jsx';
import { FootMark, ScrollProgress } from './motion.jsx';

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

  const account = user ? (user.role === 'admin' ? '/admin' : '/account') : '/login';
  const accountLabel = user ? (user.role === 'admin' ? 'Admin' : 'My account') : 'Sign in';
  return (
    <>
      <a className="skip" href="#main">Skip to content</a>
      <ScrollProgress />
      <FxLayer cursor />
      <header className={`nav ${scrolled ? 'scrolled' : ''}`}>
        <div className="container nav-in">
          <Link to="/" className="logo"><Logo size={32} /> <span>{s.businessName || 'Shyfunmi Nails'}</span></Link>
          <nav className="links" aria-label="Main">
            {LINKS.map(([to, label]) => <NavLink key={to} to={to}>{label}</NavLink>)}
          </nav>
          <div className="nav-actions">
            <button className="icon-btn" onClick={toggle} aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}>{dark ? '☀' : '☾'}</button>
            <Link className="link-quiet" to={account}>{accountLabel}</Link>
            <Link className="btn sm" to="/book">Book now</Link>
            <button className="burger" aria-label="Menu" aria-expanded={open} onClick={() => setOpen(!open)}><i /><i /></button>
          </div>
        </div>
        <AnimatePresence>
          {open && (
            <motion.nav className="mobile" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} aria-label="Mobile">
              {[...LINKS, [account, accountLabel]].map(([to, label]) => <NavLink key={to + label} to={to}>{label}</NavLink>)}
              <Link className="btn" to="/book">Book now</Link>
            </motion.nav>
          )}
        </AnimatePresence>
      </header>
      <div id="main"><Outlet /></div>
      <footer className="footer">
        <div className="container foot-grid">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <Logo size={34} className="footer-logo" />
              <h3 style={{ margin: 0 }}>{s.businessName}</h3>
            </div>
            <p>{s.tagline}.</p>
          </div>
          <div>
            <h4>Visit</h4>
            <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(s.address || '')}`} target="_blank" rel="noreferrer">{s.address}</a>
            <Link to="/book">Book appointment</Link>
            <Link to="/contact">Opening hours</Link>
          </div>
          <div>
            <h4>Follow</h4>
            {s.instagram && <a href={`https://www.instagram.com/${s.instagram}`} target="_blank" rel="noreferrer">Instagram</a>}
            {s.tiktok && <a href={`https://www.tiktok.com/@${s.tiktok}`} target="_blank" rel="noreferrer">TikTok</a>}
            {s.whatsapp && <a href={`https://wa.me/${s.whatsapp}`} target="_blank" rel="noreferrer">WhatsApp</a>}
            <a href="https://www.facebook.com/Shyfunmi.nails" target="_blank" rel="noreferrer">Facebook</a>
          </div>
          <div>
            <h4>Account</h4>
            {user ? (
              <>
                <Link to={user.role === 'admin' ? '/admin' : '/account'}>{user.role === 'admin' ? 'Admin Dashboard' : 'My account'}</Link>
                <button className="linklike" onClick={logout}>Sign out</button>
              </>
            ) : (
              <>
                <Link to="/login">Sign in</Link>
                <Link to="/register">Create account</Link>
                <Link to="/admin/login" style={{ opacity: 0.6, fontSize: '0.85rem', marginTop: 6 }}>Admin portal</Link>
              </>
            )}
          </div>
        </div>
        <FootMark text={s.businessName || 'Shyfunmi Nails'} />
        <div className="container fine"><span>© {new Date().getFullYear()} {s.businessName}</span><span>Nails that transform confidence.</span></div>
      </footer>
    </>
  );
}
