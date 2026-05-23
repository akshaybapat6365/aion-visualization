import type { ReactNode } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router';

import { getAdjacentChapters, getChapterById, getChapterRoute, getChapters, normalizeChapterId } from '../data/aionData';
import { APP_ROUTES } from '../routes';

const navRoutes = APP_ROUTES.filter((route) => route.name !== 'chapter');

function routeClass({ isActive }: { isActive: boolean }) {
  return isActive ? 'app-nav__link app-nav__link--active' : 'app-nav__link';
}

export default function Shell({ children }: { children: ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const isChapter = location.pathname.startsWith('/journey/chapter/');
  const activeChapter = isChapter ? getChapterById(normalizeChapterId(location.pathname.split('/').pop())) : null;
  const adjacent = activeChapter ? getAdjacentChapters(activeChapter.id) : null;

  return (
    <div className={isChapter ? 'app-shell app-shell--chapter' : 'app-shell'}>
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <header className="app-nav" aria-label="Global navigation">
        <NavLink to="/" className="app-nav__brand" aria-label="Aion home">
          Aion
        </NavLink>
        <div className="app-nav__right">
          <nav className="app-nav__links" aria-label="Primary">
            {navRoutes.map((route) => (
              <NavLink key={route.path} to={route.path} className={routeClass}>
                {route.label}
              </NavLink>
            ))}
          </nav>
          <div className="chapter-jump" aria-label="Chapter navigation">
            {activeChapter && adjacent && (
              <div className="chapter-jump__sequence" aria-label="Adjacent chapters">
                {adjacent.previous ? (
                  <NavLink to={getChapterRoute(adjacent.previous.id)} aria-label={`Previous chapter: ${adjacent.previous.title}`}>
                    ←
                  </NavLink>
                ) : (
                  <span aria-hidden="true">←</span>
                )}
                {adjacent.next ? (
                  <NavLink to={getChapterRoute(adjacent.next.id)} aria-label={`Next chapter: ${adjacent.next.title}`}>
                    →
                  </NavLink>
                ) : (
                  <span aria-hidden="true">→</span>
                )}
              </div>
            )}
            <label className="sr-only" htmlFor="chapter-jump-select">
              Jump to chapter
            </label>
            <select
              id="chapter-jump-select"
              aria-label="Jump to chapter"
              value={activeChapter?.id || ''}
              onChange={(event) => {
                if (event.target.value) navigate(getChapterRoute(event.target.value));
              }}
            >
              <option value="">Jump</option>
              {getChapters().map((chapter) => (
                <option key={chapter.id} value={chapter.id}>
                  {String(chapter.order).padStart(2, '0')} · {chapter.title}
                </option>
              ))}
            </select>
          </div>
        </div>
      </header>
      <main id="main-content" className="app-main">
        {children}
      </main>
    </div>
  );
}
