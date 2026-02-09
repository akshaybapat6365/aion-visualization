const chapterRouteData = [
  { path: 'chapter1.html', title: 'Chapter 1: The Ego', chapterId: 1, conceptCluster: 'Ego–Self Axis', prev: 'chapters.html', next: 'chapter2.html', contextLinks: [{ label: 'Ego', href: 'chapter1.html' }, { label: 'Shadow', href: 'chapter2.html' }, { label: 'Self', href: 'chapter14.html' }] },
  { path: 'chapter2.html', title: 'Chapter 2: The Shadow', chapterId: 2, conceptCluster: 'Personal Shadow', prev: 'chapter1.html', next: 'chapter3.html', contextLinks: [{ label: 'Shadow', href: 'chapter2.html' }, { label: 'Projection', href: 'dynamics.html' }, { label: 'Integration', href: 'integration.html' }] },
  { path: 'chapter3.html', title: 'Chapter 3: The Syzygy', chapterId: 3, conceptCluster: 'Anima / Animus', prev: 'chapter2.html', next: 'chapter4.html', contextLinks: [{ label: 'Syzygy', href: 'chapter3.html' }, { label: 'Anima', href: 'profiles.html' }, { label: 'Animus', href: 'profiles.html' }] },
  { path: 'chapter4.html', title: 'Chapter 4: The Sign of the Fishes', chapterId: 4, conceptCluster: 'Fish Symbolism', prev: 'chapter3.html', next: 'chapter5.html', contextLinks: [{ label: 'Fish Sign', href: 'chapter4.html' }, { label: 'History', href: 'history.html' }, { label: 'Duality', href: 'chapter9.html' }] },
  { path: 'chapter5.html', title: 'Chapter 5: Christ as Archetype', chapterId: 5, conceptCluster: 'Self Symbolism', prev: 'chapter4.html', next: 'chapter6.html', contextLinks: [{ label: 'Christ Symbol', href: 'chapter5.html' }, { label: 'Self', href: 'chapter14.html' }, { label: 'Quaternity', href: 'chapter13.html' }] },
  { path: 'chapter6.html', title: 'Chapter 6: The Antichrist', chapterId: 6, conceptCluster: 'Oppositional Dynamics', prev: 'chapter5.html', next: 'chapter7.html', contextLinks: [{ label: 'Antichrist', href: 'chapter6.html' }, { label: 'Opposition', href: 'dynamics.html' }, { label: 'Shadow', href: 'chapter2.html' }] },
  { path: 'chapter7.html', title: 'Chapter 7: The Pleroma', chapterId: 7, conceptCluster: 'Gnostic Fullness', prev: 'chapter6.html', next: 'chapter8.html', contextLinks: [{ label: 'Pleroma', href: 'chapter7.html' }, { label: 'Cosmology', href: 'network.html' }, { label: 'Self', href: 'chapter14.html' }] },
  { path: 'chapter8.html', title: 'Chapter 8: Sophia', chapterId: 8, conceptCluster: 'Wisdom Archetype', prev: 'chapter7.html', next: 'chapter9.html', contextLinks: [{ label: 'Sophia', href: 'chapter8.html' }, { label: 'Anima', href: 'chapter3.html' }, { label: 'Transformation', href: 'integration.html' }] },
  { path: 'chapter9.html', title: 'Chapter 9: The Naassenes', chapterId: 9, conceptCluster: 'Serpent Wisdom', prev: 'chapter8.html', next: 'chapter10.html', contextLinks: [{ label: 'Naassenes', href: 'chapter9.html' }, { label: 'Serpent', href: 'symbols.html' }, { label: 'History', href: 'history.html' }] },
  { path: 'chapter10.html', title: 'Chapter 10: The Lapis', chapterId: 10, conceptCluster: 'Alchemical Symbol', prev: 'chapter9.html', next: 'chapter11.html', contextLinks: [{ label: 'Lapis', href: 'chapter10.html' }, { label: 'Alchemy', href: 'dynamics.html' }, { label: 'Coniunctio', href: 'chapter12.html' }] },
  { path: 'chapter11.html', title: 'Chapter 11: Mercurius', chapterId: 11, conceptCluster: 'Transformative Spirit', prev: 'chapter10.html', next: 'chapter12.html', contextLinks: [{ label: 'Mercurius', href: 'chapter11.html' }, { label: 'Ambivalence', href: 'chapter9.html' }, { label: 'Integration', href: 'chapter12.html' }] },
  { path: 'chapter12.html', title: 'Chapter 12: The Coniunctio', chapterId: 12, conceptCluster: 'Sacred Union', prev: 'chapter11.html', next: 'chapter13.html', contextLinks: [{ label: 'Coniunctio', href: 'chapter12.html' }, { label: 'Syzygy', href: 'chapter3.html' }, { label: 'Wholeness', href: 'chapter14.html' }] },
  { path: 'chapter13.html', title: 'Chapter 13: The Quaternary', chapterId: 13, conceptCluster: 'Fourfold Structure', prev: 'chapter12.html', next: 'chapter14.html', contextLinks: [{ label: 'Quaternity', href: 'chapter13.html' }, { label: 'Mandala', href: 'symbols.html' }, { label: 'Self', href: 'chapter14.html' }] },
  { path: 'chapter14.html', title: 'Chapter 14: The Self', chapterId: 14, conceptCluster: 'Archetype of Wholeness', prev: 'chapter13.html', next: 'chapters.html', contextLinks: [{ label: 'Self', href: 'chapter14.html' }, { label: 'Ego-Self Axis', href: 'chapter1.html' }, { label: 'Synthesis', href: 'integration.html' }] }
];

const visualizationRouteData = [
  { path: 'ego.html', title: 'Visualization: Ego Dynamics', chapterId: 1, conceptCluster: 'Consciousness Center', prev: 'chapter1.html', next: 'dynamics.html', contextLinks: [{ label: 'Chapter 1', href: 'chapter1.html' }, { label: 'Dynamics', href: 'dynamics.html' }] },
  { path: 'dynamics.html', title: 'Visualization: Psyche Dynamics', chapterId: null, conceptCluster: 'System Dynamics', prev: 'ego.html', next: 'integration.html', contextLinks: [{ label: 'Ego', href: 'ego.html' }, { label: 'Integration', href: 'integration.html' }, { label: 'Atlas', href: 'network.html' }] },
  { path: 'integration.html', title: 'Visualization: Integration Lab', chapterId: null, conceptCluster: 'Integration Process', prev: 'dynamics.html', next: 'journey.html', contextLinks: [{ label: 'Coniunctio', href: 'chapter12.html' }, { label: 'Self', href: 'chapter14.html' }] },
  { path: 'network.html', title: 'Visualization: Concept Network', chapterId: null, conceptCluster: 'Concept Atlas', prev: 'journey.html', next: 'profiles.html', contextLinks: [{ label: 'Atlas', href: 'network.html' }, { label: 'Profiles', href: 'profiles.html' }] },
  { path: 'profiles.html', title: 'Visualization: Archetype Profiles', chapterId: null, conceptCluster: 'Archetypal Patterns', prev: 'network.html', next: 'symbols.html', contextLinks: [{ label: 'Profiles', href: 'profiles.html' }, { label: 'Symbols', href: 'symbols.html' }] }
];

const routeMetadata = [...chapterRouteData, ...visualizationRouteData];

const FALLBACK_ROUTE = {
  title: 'Aion Visualization',
  chapterId: null,
  conceptCluster: 'Core Concepts',
  prev: 'index.html',
  next: 'chapters.html',
  contextLinks: [{ label: 'Chapters', href: 'chapters.html' }, { label: 'Symbols', href: 'symbols.html' }]
};

export function resolveRouteMetadata(pathname = window.location.pathname) {
  const current = pathname.split('/').pop();
  return routeMetadata.find((route) => route.path === current) || FALLBACK_ROUTE;
}

export const ROUTE_METADATA = routeMetadata;
