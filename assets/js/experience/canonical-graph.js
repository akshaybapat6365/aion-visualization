export const canonicalGraph = {
  chapters: [
    { id: 1, key: 'ego', title: 'The Ego', concepts: ['persona', 'identity', 'consciousness'] },
    { id: 2, key: 'shadow', title: 'The Shadow', concepts: ['shadow', 'projection', 'integration'] },
    { id: 3, key: 'syzygy', title: 'The Syzygy', concepts: ['anima', 'animus', 'union'] },
    { id: 4, key: 'self', title: 'The Self', concepts: ['self', 'totality', 'center'] },
    { id: 5, key: 'christ-symbol', title: 'Christ, A Symbol of the Self', concepts: ['christ', 'symbol', 'self'] },
    { id: 6, key: 'fishes-sign', title: 'The Sign of the Fishes', concepts: ['fishes', 'pisces', 'axis'] },
    { id: 7, key: 'nostradamus', title: 'The Prophecies of Nostradamus', concepts: ['prophecy', 'collective', 'transition'] },
    { id: 8, key: 'historical-fish', title: 'Historical Significance of the Fish', concepts: ['history', 'fish', 'christianity'] },
    { id: 9, key: 'fish-ambivalence', title: 'Ambivalence of the Fish Symbol', concepts: ['duality', 'symbol', 'ambivalence'] },
    { id: 10, key: 'fish-alchemy', title: 'The Fish in Alchemy', concepts: ['alchemy', 'fish', 'transformation'] },
    { id: 11, key: 'alchemical-interpretation', title: 'The Alchemical Interpretation', concepts: ['alchemy', 'individuation', 'process'] },
    { id: 12, key: 'christian-alchemy', title: 'Christian Alchemical Symbolism', concepts: ['christianity', 'alchemy', 'symbolism'] },
    { id: 13, key: 'gnostic-self', title: 'Gnostic Symbols of the Self', concepts: ['gnostic', 'self', 'quaternity'] },
    { id: 14, key: 'structure-self', title: 'Structure and Dynamics of the Self', concepts: ['self', 'individuation', 'wholeness'] }
  ],
  conceptEdges: [
    { source: 1, target: 2, concept: 'shadow integration' },
    { source: 2, target: 11, concept: 'projection → alchemical work' },
    { source: 3, target: 14, concept: 'union of opposites' },
    { source: 4, target: 14, concept: 'self realization' },
    { source: 5, target: 12, concept: 'christian symbolism' },
    { source: 6, target: 8, concept: 'fish axis history' },
    { source: 8, target: 9, concept: 'symbolic ambivalence' },
    { source: 9, target: 10, concept: 'fish in alchemy' },
    { source: 10, target: 11, concept: 'alchemical sequence' },
    { source: 11, target: 14, concept: 'individuation process' },
    { source: 12, target: 13, concept: 'gnostic continuity' },
    { source: 13, target: 14, concept: 'self architecture' },
    { source: 2, target: 3, concept: 'relational unconscious' },
    { source: 1, target: 4, concept: 'ego-self axis' }
  ]
};

export const pathPresets = [
  {
    id: 'archetypes',
    label: 'Archetypes',
    chapters: [2, 3, 13, 14],
    mode: 'journey',
    narrative: 'Start with living figures of psyche, then integrate them into the Self.'
  },
  {
    id: 'symbolism',
    label: 'Symbolism',
    chapters: [5, 9, 10, 12],
    mode: 'atlas',
    narrative: 'Follow symbols across Christian, alchemical, and imaginal traditions.'
  },
  {
    id: 'historical-christian-axis',
    label: 'Historical-Christian Axis',
    chapters: [6, 8, 12, 13],
    mode: 'atlas',
    narrative: 'Trace the fish symbol through history and Christian-alchemical development.'
  },
  {
    id: 'self-individuation',
    label: 'Self/Individuation',
    chapters: [1, 4, 11, 14],
    mode: 'journey',
    narrative: 'Move from ego orientation toward individuation and wholeness.'
  }
];
