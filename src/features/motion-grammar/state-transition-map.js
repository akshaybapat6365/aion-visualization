export const VISUALIZATION_STATE_TRANSITIONS = Object.freeze({
  conceptGraph: Object.freeze({
    'overview->polarized': 'opposition',
    'polarized->synthesis': 'integration',
    'synthesis->new-symbol': 'transformation',
    'new-symbol->overview': 'cyclical-return'
  }),
  shadowIntegration: Object.freeze({
    'denial->confrontation': 'opposition',
    'confrontation->dialogue': 'integration',
    'dialogue->assimilation': 'transformation',
    'assimilation->reflection': 'cyclical-return'
  }),
  alchemyLab: Object.freeze({
    'nigredo->albedo': 'transformation',
    'albedo->citrinitas': 'transformation',
    'citrinitas->rubedo': 'integration',
    'rubedo->nigredo': 'cyclical-return'
  }),
  chapterNavigation: Object.freeze({
    'current->next': 'integration',
    'current->previous': 'opposition',
    'current->distant': 'transformation',
    'final->first': 'cyclical-return'
  })
});

export const RELATION_TYPE_TO_PRESET = Object.freeze({
  opposes: 'opposition',
  'integrates-into': 'integration',
  'related-to': 'integration',
  'relates-to': 'integration',
  'develops-toward': 'transformation',
  'guides-to': 'transformation',
  'achieved-through': 'transformation',
  'manifests-as': 'transformation',
  'expresses-as': 'transformation',
  'symbolized-by': 'cyclical-return',
  'structured-as': 'cyclical-return',
  represents: 'cyclical-return',
  'completed-by': 'cyclical-return',
  'culminates-in': 'cyclical-return'
});

export function getPresetForRelationType(relationType) {
  return RELATION_TYPE_TO_PRESET[relationType] || 'integration';
}

export function getPresetForVisualizationTransition(moduleName, transitionKey) {
  return VISUALIZATION_STATE_TRANSITIONS[moduleName]?.[transitionKey] || 'integration';
}
