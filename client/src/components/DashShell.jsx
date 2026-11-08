import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from './Layout.jsx';
import Logo from './Logo.jsx';
import FxLayer from './FxLayer.jsx';
import { MenuIcon, CloseIcon, SunIcon, MoonIcon, LogOutIcon, GlobeIcon } from './Icons.jsx';

/* Shared dashboard frame used by the admin dashboard AND the client dashboard:
   dark sidebar (slide-in drawer on phones), sticky top bar, scrolling content.
   Styles live in admin.css (.admin, .side, .atop, …).

   nav      : [[groupLabel, [[key, label, Icon, badgeKey?], …]], …]
   basePath : '/admin' or '/account'  (links become `${basePath}/${key}`)
   counts   : { [badgeKey]: number }
   cta      : optional { to, label, Icon } highlighted button above the footer
   topExtra : optional node shown in the top bar next to the theme toggle */
export default function DashShell({
  brand, brandSub, nav, basePath, tab, counts = {}, title, blurb, user, logout, cta, topExtra, children,
}) {
  const [dark, toggle] = useTheme();
  const [menu, setMenu] = useState(false);
  const close = () => setMenu(false);

  // Escape closes the drawer; page scroll is locked while it is open
  useEffect(() => {
    if (!menu) return undefined;
    const esc = (e) => { if (e.key === 'Escape') setMenu(false); };
    window.addEventListener('keydown', esc);
    document.body.classList.add('drawer-open');
    return () => { window.removeEventListener('keydown', esc); document.body.classList.remove('drawer-open'); };
  }, [menu]);
  // growing to desktop width with the drawer open must not leave the page locked
  useEffect(() => {
    const mq = matchMedia('(min-width: 861px)');
    const f = () => { if (mq.matches) setMenu(false); };
    mq.addEventListener('change', f);
    return () => mq.removeEventListener('change', f);
  }, []);

  const name = (user.name || 'Account').trim();
  const initials = name.split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase();

  return (
    <div className={`admin ${menu ? 'drawer-on' : ''}`}>
      <FxLayer />
      <div className="side-scrim" onClick={close} aria-hidden="true" />
      <aside className={`side ${menu ? 'open' : ''}`} aria-label="Navigation">
        <div className="side-head">
          <Link to="/" className="side-brand" onClick={close}>
            <span className="side-mark"><Logo size={26} light /></span>
            <span className="side-name"><b>{brand || 'Shyfunmi Nails'}</b><small>{brandSub}</small></span>
          </Link>
          <button type="button" className="side-close" onClick={close} aria-label="Close menu"><CloseIcon size={18} /></button>
        </div>

        <nav className="side-nav" aria-label="Sections">
          {nav.map(([group, items]) => (
            <div className="nav-group" key={group}>
              <span className="nav-label">{group}</span>
              {items.map(([k, l, Icon, badge]) => (
                <Link key={k} to={`${basePath}/${k}`} className={tab === k ? 'on' : ''} aria-current={tab === k ? 'page' : undefined} onClick={close}>
                  <Icon size={18} />
                  <span>{l}</span>
                  {badge && counts[badge] > 0 && <em className="nav-badge">{counts[badge] > 99 ? '99+' : counts[badge]}</em>}
                </Link>
              ))}
            </div>
          ))}
        </nav>

        <div className="side-foot">
          {cta && (
            <Link to={cta.to} className="side-cta" onClick={close}>{cta.Icon && <cta.Icon size={17} />} {cta.label}</Link>
          )}
          <div className="side-user">
            {user.avatar
              ? <img className="avatar-sm" src={user.avatar} alt="" referrerPolicy="no-referrer" />
              : <span className="avatar-sm" aria-hidden="true">{initials || 'A'}</span>}
            <span className="side-user-txt"><b>{name}</b><small>{user.email}</small></span>
          </div>
          <div className="side-actions">
            <Link to="/" className="side-act" onClick={close}><GlobeIcon size={17} /> <span>View website</span></Link>
            <button type="button" className="side-act" onClick={toggle}>{dark ? <SunIcon size={17} /> : <MoonIcon size={17} />} <span>{dark ? 'Light mode' : 'Dark mode'}</span></button>
            <button type="button" className="side-act out" onClick={logout}><LogOutIcon size={17} /> <span>Sign out</span></button>
          </div>
        </div>
      </aside>

      <div className="amain" data-lenis-prevent>
        <header className="atop">
          <button type="button" className="icon-btn menu-btn" onClick={() => setMenu(true)} aria-label="Open menu" aria-expanded={menu}><MenuIcon size={20} /></button>
          <div className="atop-title">
            <h1>{title}</h1>
            {blurb && <p>{blurb}</p>}
          </div>
          <div className="atop-actions">
            {topExtra}
            <button type="button" className="icon-btn" onClick={toggle} aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}>{dark ? <SunIcon size={18} /> : <MoonIcon size={18} />}</button>
            <Link to="/" className="btn ghost sm site-link"><GlobeIcon size={15} /> <span>View site</span></Link>
          </div>
        </header>
        <div className="abody">{children}</div>
      </div>
    </div>
  );
}
