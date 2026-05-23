import { getLegacyChapterRedirect, normalizeChapterId } from './data/aionData';

export interface AppRoute {
  name: 'home' | 'chapters' | 'atlas' | 'timeline' | 'symbols' | 'about' | 'chapter';
  path: string;
  label: string;
}

export interface RouteMatch {
  name: AppRoute['name'];
  params?: Record<string, string>;
  redirectedFrom?: string;
}

export const APP_ROUTES: AppRoute[] = [
  { name: 'home', path: '/', label: 'Home' },
  { name: 'chapters', path: '/chapters', label: 'Chapters' },
  { name: 'atlas', path: '/atlas', label: 'Atlas' },
  { name: 'timeline', path: '/timeline', label: 'Timeline' },
  { name: 'symbols', path: '/symbols', label: 'Symbols' },
  { name: 'about', path: '/about', label: 'About' },
  { name: 'chapter', path: '/journey/chapter/:chapterId', label: 'Journey' },
];

const routeByPath = new Map(APP_ROUTES.map((route) => [route.path, route]));

export function resolveRoute(pathname: string): RouteMatch {
  const cleanPath = pathname.replace(/\/+$/, '') || '/';
  const legacyRedirect = getLegacyChapterRedirect(cleanPath);
  if (legacyRedirect) {
    return {
      name: 'chapter',
      params: { chapterId: normalizeChapterId(legacyRedirect.split('/').pop()) },
      redirectedFrom: cleanPath,
    };
  }

  const chapterMatch = cleanPath.match(/^\/journey\/chapter\/([^/]+)$/);
  if (chapterMatch) {
    return {
      name: 'chapter',
      params: { chapterId: normalizeChapterId(chapterMatch[1]) },
    };
  }

  const route = routeByPath.get(cleanPath);
  if (route) return { name: route.name };

  return { name: 'home' };
}
