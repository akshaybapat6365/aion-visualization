export type ChapterId = `ch${number}`;

export interface SourceRef {
  work: 'Aion';
  chapterId: ChapterId;
  locator?: string;
  note?: string;
}

export interface ChapterRecord {
  id: ChapterId;
  order: number;
  title: string;
  cluster: string;
  summary: string;
  keyConceptIds: string[];
  relatedChapterIds: ChapterId[];
  learningObjectIds: string[];
  sourceRefs?: SourceRef[];
}

export interface ConceptRecord {
  id: string;
  label: string;
  definition: string;
  chapterRefs: ChapterId[];
  symbolRefs: string[];
  difficulty: 'foundational' | 'intermediate' | 'advanced';
  prerequisites: string[];
  sourceRefs?: SourceRef[];
}

export interface SymbolRecord {
  id: string;
  label: string;
  motif: string;
  historicPeriod: string;
  conceptIds: string[];
  sourceRefs?: SourceRef[];
}

export interface LearningObjectRecord {
  id: string;
  chapterId: ChapterId;
  type: string;
  title: string;
  prompt: string;
}

export interface RelationshipRecord {
  id: string;
  source: string;
  target: string;
  relationType: string;
  weight: number;
  narrativeNotes: string;
}

export interface LearningPanel {
  id: string;
  kicker: string;
  title: string;
  body: string;
  insight: string;
}

export interface ChapterExperience {
  chapterId: ChapterId;
  visualTheme: string;
  sceneModule: string;
  panels: LearningPanel[];
  checkpoints: string[];
  fallbackSummary: string;
  motionGrammar: 'opposition' | 'integration' | 'transformation' | 'cyclical-return';
}

export interface SceneAdapterContext {
  chapter: ChapterRecord;
  experience: ChapterExperience;
  reducedMotion: boolean;
}

export interface SceneAdapter {
  mount(container: HTMLElement, context: SceneAdapterContext): Promise<void> | void;
  setPanelState?(state: { activePanelId: string; progress: number }): void;
  setReducedMotion?(enabled: boolean): void;
  dispose(): void;
}
