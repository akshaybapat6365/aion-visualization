export const canonicalGraph = {
  chapterNodes: [
    { id: 1, key: 'ego', title: 'The Ego' },
    { id: 2, key: 'shadow', title: 'The Shadow' },
    { id: 3, key: 'syzygy', title: 'The Syzygy' },
    { id: 4, key: 'self', title: 'The Self' },
    { id: 5, key: 'christ-symbol', title: 'Christ, A Symbol of the Self' },
    { id: 6, key: 'fishes-sign', title: 'The Sign of the Fishes' },
    { id: 7, key: 'nostradamus', title: 'The Prophecies of Nostradamus' },
    { id: 8, key: 'historical-fish', title: 'Historical Significance of the Fish' },
    { id: 9, key: 'fish-ambivalence', title: 'Ambivalence of the Fish Symbol' },
    { id: 10, key: 'fish-alchemy', title: 'The Fish in Alchemy' },
    { id: 11, key: 'alchemical-interpretation', title: 'The Alchemical Interpretation' },
    { id: 12, key: 'christian-alchemy', title: 'Christian Alchemical Symbolism' },
    { id: 13, key: 'gnostic-self', title: 'Gnostic Symbols of the Self' },
    { id: 14, key: 'structure-self', title: 'Structure and Dynamics of the Self' }
  ],
  conceptEdges: [
    { sourceChapter: 1, targetChapter: 2, concept: 'shadow integration' },
    { sourceChapter: 1, targetChapter: 4, concept: 'ego-self axis' },
    { sourceChapter: 2, targetChapter: 3, concept: 'relational unconscious' },
    { sourceChapter: 2, targetChapter: 11, concept: 'projection → alchemical work' },
    { sourceChapter: 3, targetChapter: 14, concept: 'union of opposites' },
    { sourceChapter: 5, targetChapter: 12, concept: 'christian symbolism' },
    { sourceChapter: 6, targetChapter: 8, concept: 'fish axis history' },
    { sourceChapter: 8, targetChapter: 9, concept: 'symbolic ambivalence' },
    { sourceChapter: 9, targetChapter: 10, concept: 'fish in alchemy' },
    { sourceChapter: 10, targetChapter: 11, concept: 'alchemical sequence' },
    { sourceChapter: 11, targetChapter: 14, concept: 'individuation process' },
    { sourceChapter: 12, targetChapter: 13, concept: 'gnostic continuity' },
    { sourceChapter: 13, targetChapter: 14, concept: 'self architecture' }
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
