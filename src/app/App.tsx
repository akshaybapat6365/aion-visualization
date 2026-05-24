import { useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigate, useParams } from 'react-router';

import Shell from './components/Shell';
import { getChapterById, getChapterRoute, normalizeChapterId } from './data/aionData';
import AboutPage from './pages/AboutPage';
import AtlasPage from './pages/AtlasPage';
import ChapterPage from './pages/ChapterPage';
import ChaptersPage from './pages/ChaptersPage';
import HomePage from './pages/HomePage';
import SymbolsPage from './pages/SymbolsPage';
import TimelinePage from './pages/TimelinePage';
import { APP_ROUTES } from './routes';

function routePath(name: (typeof APP_ROUTES)[number]['name']) {
  const route = APP_ROUTES.find((candidate) => candidate.name === name);
  if (!route) throw new Error(`Missing app route: ${name}`);
  return route.path;
}

function LegacyChapterRedirect() {
  const { legacyChapter } = useParams();
  const match = legacyChapter?.match(/^chapter-(\d+)\.html$/);
  if (!match) return <Navigate to="/chapters" replace />;
  const id = normalizeChapterId(match?.[1]);
  return <Navigate to={getChapterRoute(id)} replace />;
}

function ChapterGate() {
  const { chapterId } = useParams();
  const id = normalizeChapterId(chapterId);
  const chapter = getChapterById(id);
  if (!chapter) return <Navigate to="/" replace />;
  return <ChapterPage chapterId={id} />;
}

function StoredRedirect() {
  const navigate = useNavigate();

  useEffect(() => {
    const target = sessionStorage.getItem('aion-spa-redirect');
    if (!target) return;
    sessionStorage.removeItem('aion-spa-redirect');
    navigate(target, { replace: true });
  }, [navigate]);

  return null;
}

function ScrollToRouteTop() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) return;
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [pathname, hash]);

  return null;
}

export default function App() {
  const basename = import.meta.env.BASE_URL.replace(/\/$/, '') || '/';

  return (
    <BrowserRouter basename={basename === '/' ? undefined : basename}>
      <StoredRedirect />
      <ScrollToRouteTop />
      <Shell>
        <Routes>
          <Route path={routePath('home')} element={<HomePage />} />
          <Route path={routePath('chapters')} element={<ChaptersPage />} />
          <Route path={routePath('atlas')} element={<AtlasPage />} />
          <Route path={routePath('timeline')} element={<TimelinePage />} />
          <Route path={routePath('symbols')} element={<SymbolsPage />} />
          <Route path={routePath('about')} element={<AboutPage />} />
          <Route path={routePath('chapter')} element={<ChapterGate />} />
          <Route path="/chapters/:legacyChapter" element={<LegacyChapterRedirect />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Shell>
    </BrowserRouter>
  );
}
