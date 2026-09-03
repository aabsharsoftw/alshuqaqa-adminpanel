import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../auth/context';
import { usePrefs } from '../lib/prefs';

const NAV = [
  { to: '/', label: 'Dashboard', end: true, icon: '◧' },
  { to: '/listings', label: 'Listings', end: false, icon: '▤' },
  { to: '/categories', label: 'Categories', end: false, icon: '▦' },
  { to: '/places', label: 'Places', end: false, icon: '◈' },
  { to: '/landlords', label: 'Landlords', end: false, icon: '◍' },
  { to: '/enquiries', label: 'Enquiries', end: false, icon: '✉' },
];

export function Layout() {
  const { user, logout } = useAuth();
  const { lang, setLang, theme, toggleTheme } = usePrefs();
  const [navOpen, setNavOpen] = useState(false);

  return (
    <div className="shell">
      <aside className={`sidebar${navOpen ? ' sidebar--open' : ''}`}>
        <div className="sidebar__brand">
          <span className="sidebar__mark" aria-hidden="true">
            R
          </span>
          <span>
            Rental <strong>Admin</strong>
          </span>
        </div>

        <nav className="sidebar__nav">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `sidebar__link${isActive ? ' sidebar__link--active' : ''}`
              }
              onClick={() => setNavOpen(false)}
            >
              <span className="sidebar__icon" aria-hidden="true">
                {item.icon}
              </span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar__footer">
          <div className="sidebar__user">
            <span className="avatar" aria-hidden="true">
              {user?.name?.charAt(0).toUpperCase() ?? 'A'}
            </span>
            <div className="sidebar__user-text">
              <strong>{user?.name}</strong>
              <span>{user?.email}</span>
            </div>
          </div>
          <button type="button" className="btn btn--ghost btn--sm" onClick={logout}>
            Sign out
          </button>
          <NavLink
            to="/privacy"
            className="btn btn--ghost btn--sm"
            onClick={() => setNavOpen(false)}
          >
            Privacy Policy
          </NavLink>
        </div>
      </aside>

      <div className="main">
        <header className="topbar">
          <button
            type="button"
            className="topbar__menu"
            aria-label="Toggle navigation"
            aria-expanded={navOpen}
            onClick={() => setNavOpen((open) => !open)}
          >
            ☰
          </button>

          <div className="topbar__actions">
            <div className="segmented" role="group" aria-label="Content language">
              <button
                type="button"
                className={lang === 'en' ? 'is-active' : ''}
                onClick={() => setLang('en')}
              >
                EN
              </button>
              <button
                type="button"
                className={lang === 'ar' ? 'is-active' : ''}
                onClick={() => setLang('ar')}
              >
                AR
              </button>
            </div>
            <button
              type="button"
              className="btn btn--icon"
              onClick={toggleTheme}
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
            >
              {theme === 'dark' ? '☀' : '☾'}
            </button>
          </div>
        </header>

        <main className="content">
          <Outlet />
        </main>
      </div>

      {navOpen && (
        <button
          type="button"
          className="scrim"
          aria-label="Close navigation"
          onClick={() => setNavOpen(false)}
        />
      )}
    </div>
  );
}
